import { ShapeFlags } from '@vue/shared'
import { Fragment, isSameVNodeType, normalizeVNode, Text } from './vnode'
import { seq } from './seq'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from '@vue/reactivity'
import { queueJob } from './scheduler'
import {
  renderComponentRoot,
  shouldUpdateComponent,
} from './componentRenderUtils'
import { updateProps } from './componentPorps'
import { updateSlots } from './componentSlots'
import { LifecycleHooks, triggerHooks } from './apiLifecycle'
import { setRef } from './renderTemplateRef'
import { isKeepAlive } from './components/KeepAlive'

export function createRenderer(options) {
  const {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
  } = options

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const unmountComponent = instance => {
    triggerHooks(instance, LifecycleHooks.BEFORE_UNMOUNT)
    unmount(instance.subTree)
    triggerHooks(instance, LifecycleHooks.UNMOUNTED)
  }

  // 卸载元素的方法
  const unmount = vnode => {
    const { shapeFlag, children, ref, transition, type } = vnode
    if (shapeFlag & ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE) {
      // 我们虽然不用卸载 KeepAlive 要缓存的组件，但是我要告诉 KeepAlive 这个组件你已经被停用了
      const parentComponent = vnode.component.parent
      parentComponent.ctx.deactivate(vnode)
      return
    }

    if (type === Fragment) {
      unmountChildren(children)
      return
    }

    if (shapeFlag & ShapeFlags.COMPONENT) {
      unmountComponent(vnode.component)
    } else if (shapeFlag & ShapeFlags.TELEPORT) {
      // 卸载 Teleport 组件
      unmountChildren(vnode.children)
      return
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }

    const remove = () => {
      vnode.el && hostRemove(vnode.el)
    }

    if (transition) {
      transition.leave(vnode.el, remove)
    } else {
      remove()
    }

    if (ref != null) {
      setRef(ref, null)
    }
  }

  const mountChildren = (children, container, parentComponent) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))

      patch(null, child, container, null, parentComponent)
    }
  }

  // 挂载元素的方法
  const mountElement = (vnode, container, anchor, parentComponent) => {
    /**
     * 1. 创建一个 DOM 节点
     * 2. 将 vnode 的 props 挂载到 DOM 上
     * 3. 将 vnode 的 children 挂载到 DOM 上
     */
    const { type, props, children, shapeFlag, transition } = vnode
    const el = (vnode.el = hostCreateElement(type))

    if (props) {
      for (const key in props) {
        const value = props[key]
        hostPatchProp(el, key, null, value)
      }
    }

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children)
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent)
    }

    if (transition) {
      transition.beforeEnter?.(el)
    }

    hostInsert(el, container, anchor)

    if (transition) {
      transition.enter?.(el)
    }
  }

  const patchProps = (el, oldProps, newProps) => {
    if (oldProps) {
      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProp(el, key, oldProps[key], null)
        }
      }
    }
    if (newProps) {
      for (const key in newProps) {
        hostPatchProp(el, key, oldProps?.[key], newProps[key])
      }
    }
  }

  const patchChildren = (n1, n2, el, parentComponent) => {
    /**
     * 1. 新节点是文本
     *   1.1 老的是文本
     *   1.2 老的是数组
     *   1.3 老的是空
     * 2. 新节点是数组
     *   2.1 老的是文本
     *   2.2 老的是数组
     *   2.3 老的是空
     */
    const preShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children)
      }
      if (n1.children !== n2.children) {
        hostSetElementText(el, n2.children)
      }
    } else {
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        hostSetElementText(el, '')
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(n2.children, el, parentComponent)
        }
      } else {
        if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 子元素有没有 key 是编译时确定的 不是运行时确定的 写运行时时候默认是有 key 的
            patchKeyedChildren(n1.children, n2.children, el, parentComponent)
          } else {
            unmountChildren(n1.children)
          }
        } else {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(n2.children, el, parentComponent)
          }
        }
      }
    }
  }

  const patchKeyedChildren = (c1, c2, container, parentComponent) => {
    /**
     * 全量 Diff 算法
     *
     * 1. 双端 DIFF 算法
     *
     * 2. 乱序对比
     *
     */
    let i = 0
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    /**
     * 头部对比
     *  c1 => [a, b]    [a, b, c]   =>   [a, b]    2 2 1
     *  c2 => [a, b, c]
     *    开始： i = 0, e1 = 1, e2 = 2
     *    结束： i = 2, e1 = 1, e2 = 2
     */
    while (i <= e1 && i <= e2) {
      const n1 = (c1[i] = normalizeVNode(c1[i]))
      const n2 = (c2[i] = normalizeVNode(c2[i]))
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent)
      } else {
        break
      }
      i++
    }

    /**
     * 尾部对比
     *  c1 => [a, b]      [c, a, b]   =>   [a, b]    0 0 -1
     *  c2 => [c, a, b]
     *    开始： i = 0, e1 = 1, e2 = 2
     *    结束： i = 0, e1 = -1, e2 = 0
     */
    while (i <= e1 && i <= e2) {
      const n1 = (c1[e1] = normalizeVNode(c1[e1]))
      const n2 = (c2[e2] = normalizeVNode(c2[e2]))
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent)
      } else {
        break
      }
      e1--
      e2--
    }

    if (i > e1) {
      // 表示老的少，新的多，要新增
      const nextPos = e2 + 1
      const anchor = nextPos < c2.length ? c2[nextPos].el : null
      while (i <= e2) {
        patch(
          null,
          (c2[i] = normalizeVNode(c2[i])),
          container,
          anchor,
          parentComponent,
        )
        i++
      }
    } else if (i > e2) {
      // 表示老的多，新的少，要删除
      while (i <= e1) {
        unmount(c1[i++])
      }
    } else {
      // 找到 Key 相同的虚拟节点 让他们patch一下
      let s1 = i
      let s2 = i
      // 用新的子节点的 key 和 index 建立一个映射表
      const keyToNewIndexMap = new Map()
      const toBePatched = e2 - s2 + 1
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      // 遍历新的子节点 这些是还没有更新的 做一份 key => index map
      for (let j = s2; j <= e2; j++) {
        const n2 = (c2[j] = normalizeVNode(c2[j]))
        keyToNewIndexMap.set(n2?.key, j)
      }

      let pos = -1
      let moved = false

      for (let j = s1; j <= e1; j++) {
        const oldVnode = c1[j]
        const newIndex = keyToNewIndexMap.get(oldVnode?.key)
        if (newIndex === undefined) {
          unmount(c1[j])
        } else {
          if (newIndex > pos) {
            pos = newIndex
          } else {
            moved = true
          }
          newIndexToOldIndexMap[newIndex - s2] = j
          patch(oldVnode, c2[newIndex], container, null, parentComponent)
        }
      }

      const increasingSeq = moved ? seq(newIndexToOldIndexMap) : []
      let j = increasingSeq.length - 1
      for (let i = toBePatched - 1; i >= 0; --i) {
        let newIndex = s2 + i
        const anchor = c2[newIndex + 1]?.el || null
        const vnode = c2[newIndex]
        if (!vnode?.el) {
          patch(null, vnode, container, anchor, parentComponent)
        } else {
          if (moved) {
            if (i === increasingSeq[j]) {
              j--
            } else {
              hostInsert(vnode.el, container, anchor)
            }
          }
        }
      }
    }
  }

  /**
   *
   * 1. 复用元素
   * 2. 更新 props
   * 3. 更新 子节点 children
   * @param n1 旧 vnode
   * @param n2 新 vnode
   */
  const patchElement = (n1, n2, parentComponent) => {
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2, el, parentComponent)
  }

  // 处理元素的挂载和更新
  const processElement = (n1, n2, container, anchor, parentComponent) => {
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent)
    } else {
      patchElement(n1, n2, parentComponent)
    }
  }

  // 处理文本的挂载和更新
  const processText = (n1, n2, container, anchor) => {
    if (n1 === null) {
      const el = (n2.el = hostCreateText(n2.children))
      hostInsert(el, container, anchor)
    } else {
      const el = (n2.el = n1.el)
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children)
      }
    }
  }

  const processFragment = (n1, n2, container, parentComponent) => {
    if (n1 === null) {
      mountChildren(n2.children, container, parentComponent)
    } else {
      patchChildren(n1, n2, container, parentComponent)
    }
  }

  const processComponent = (n1, n2, container, anchor, parentComponent) => {
    if (n1 === null) {
      if (n2.shapeFlag & ShapeFlags.COMPONENT_KEPT_ALIVE) {
        /**
         * 需要复用 不用重新挂载
         */
        parentComponent.ctx.activate(n2, container, anchor)
        return
      }
      mountComponent(n2, container, anchor, parentComponent)
    } else {
      updateComponent(n1, n2)
    }
  }

  // 组件的挂载
  const mountComponent = (vnode, container, anchor, parentComponent) => {
    /**
     * 1. 创建组件的实例
     * 2. 初始化组件的状态
     * 3. 将组件挂载到页面中
     */

    // 创建组件实例
    const instance = createComponentInstance(vnode, parentComponent)

    if (isKeepAlive(vnode.type)) {
      instance.ctx.renderer = {
        options,
        unmount,
      }
    }

    // 将组件的实例保存到 vnode 上，方便后续使用
    vnode.component = instance

    // 初始化组件的状态
    setupComponent(instance)

    // 将组件挂载到页面中
    setupRenderEffect(instance, container, anchor)
  }

  // 组件的更新
  const updateComponent = (n1, n2) => {
    const instance = (n2.component = n1.component)
    // instance.props.age = n2.props.age

    /**
     * 该更新：props 或者 slots 发生了变化
     * 不该更新：什么都没有变化
     */
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2
      instance.update()
    } else {
      // 复用元素
      n2.el = n1.el
      // 更新虚拟节点
      instance.vnode = n2
    }
  }

  const updateComponentPreRender = (instance, nextVNode) => {
    /**
     * 复用组件实例
     * 更新 props
     * 更新 slots
     */
    instance.vnode = nextVNode
    updateProps(instance, nextVNode)
    updateSlots(instance, nextVNode)
  }

  const setupRenderEffect = (instance, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const { vnode, render } = instance

        // 触发 beforeMount 钩子函数
        triggerHooks(instance, LifecycleHooks.BEFORE_MOUNT)

        // 调用 render 函数，拿到组件的子树（render返回的虚拟节点），this 指向 setup 返回的结果
        const subTree = renderComponentRoot(instance)

        // 将 subTree 挂载到页面中
        patch(null, subTree, container, anchor, instance)
        // 组件 vnode.el 会指向 subTree.el 他们是相同的
        vnode.el = subTree.el
        instance.subTree = subTree
        instance.isMounted = true

        triggerHooks(instance, LifecycleHooks.MOUNTED)
      } else {
        let { vnode, render, next } = instance
        if (next) {
          // 父组件传递属性，触发的更新
          updateComponentPreRender(instance, next)
        } else {
          next = vnode
        }

        // 触发 beforeUpdate 钩子函数
        triggerHooks(instance, LifecycleHooks.BEFORE_UPDATE)

        const prevSubTree = instance.subTree
        const subTree = renderComponentRoot(instance)

        patch(prevSubTree, subTree, container, anchor, instance)
        next.el = subTree?.el
        instance.subTree = subTree

        // 触发 updated 钩子函数
        triggerHooks(instance, LifecycleHooks.UPDATED)
      }
    }

    const effect = new ReactiveEffect(componentUpdateFn)
    const update = effect.run.bind(effect)

    // 保存 effect.run 到 instance.update 中
    instance.update = update

    effect.scheduler = () => {
      queueJob(update)
    }
    update()
  }

  /**
   *
   * @param n1 旧 vnode
   * @param n2 新 vnode
   * @param container 容器
   */
  const patch = (n1, n2, container, anchor = null, parentComponent = null) => {
    // 如果两次传递了同一个虚拟节点，则不执行任何操作
    if (n1 === n2) return

    if (n1 && n2 == null) {
      unmount(n1)
      return
    }

    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null
    }

    const { shapeFlag, type, ref } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break
      case Fragment:
        processFragment(n1, n2, container, parentComponent)
        break
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor, parentComponent)
        } else if (shapeFlag * ShapeFlags.TELEPORT) {
          type.process(n1, n2, container, anchor, parentComponent, {
            mountChildren,
            patchChildren,
            options,
          })
        }
    }

    if (ref != null) {
      setRef(ref, n2)
    }
  }

  /**
   * 分三步
   * 1. 挂载
   * 2. 更新
   * 3. 卸载
   */
  const render = (vnode, container) => {
    if (vnode === null) {
      if (container._vnode) {
        unmount(container._vnode)
      }
    } else {
      patch(container._vnode || null, vnode, container)
    }
    container._vnode = vnode
  }
  return {
    render,
    createApp: createAppAPI(render),
  }
}
