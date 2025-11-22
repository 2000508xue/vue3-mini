import { ShapeFlags } from '@vue/shared'
import { isSameVNodeType, normalizeVNode, Text } from './vnode'
import { seq } from './seq'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { ReactiveEffect } from '@vue/reactivity'
import { queueJob } from './scheduler'

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

  // 卸载元素的方法
  const unmount = vnode => {
    const { type, shapeFlag, children } = vnode
    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      unmountChildren(children)
    }
    hostRemove(vnode.el)
  }

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      const child = (children[i] = normalizeVNode(children[i]))

      patch(null, child, container)
    }
  }

  // 挂载元素的方法
  const mountElement = (vnode, container, anchor) => {
    /**
     * 1. 创建一个 DOM 节点
     * 2. 将 vnode 的 props 挂载到 DOM 上
     * 3. 将 vnode 的 children 挂载到 DOM 上
     */
    const { type, props, children, shapeFlag } = vnode
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
      mountChildren(children, el)
    }

    hostInsert(el, container, anchor)
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

  const patchChildren = (n1, n2) => {
    const el = n2.el
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
          mountChildren(n2.children, el)
        }
      } else {
        if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 子元素有没有 key 是编译时确定的 不是运行时确定的 写运行时时候默认是有 key 的
            patchKeyedChildren(n1.children, n2.children, el)
          } else {
            unmountChildren(n1.children)
          }
        } else {
          if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(n2.children, el)
          }
        }
      }
    }
  }

  const patchKeyedChildren = (c1, c2, container) => {
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
        patch(n1, n2, container)
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
        patch(n1, n2, container)
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
        patch(null, (c2[i] = normalizeVNode(c2[i])), container, anchor)
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
          patch(oldVnode, c2[newIndex], container)
        }
      }

      const increasingSeq = moved ? seq(newIndexToOldIndexMap) : []
      let j = increasingSeq.length - 1
      for (let i = toBePatched - 1; i >= 0; --i) {
        let newIndex = s2 + i
        const anchor = c2[newIndex + 1]?.el || null
        const vnode = c2[newIndex]
        if (!vnode?.el) {
          patch(null, vnode, container, anchor)
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
  const patchElement = (n1, n2) => {
    const el = (n2.el = n1.el)
    const oldProps = n1.props
    const newProps = n2.props
    patchProps(el, oldProps, newProps)
    patchChildren(n1, n2)
  }

  // 处理元素的挂载和更新
  const processElement = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountElement(n2, container, anchor)
    } else {
      patchElement(n1, n2)
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

  const processComponent = (n1, n2, container, anchor) => {
    if (n1 === null) {
      mountComponent(n2, container, anchor)
    } else {
    }
  }

  const mountComponent = (vnode, container, anchor) => {
    /**
     * 1. 创建组件的实例
     * 2. 初始化组件的状态
     * 3. 将组件挂载到页面中
     */

    // 创建组件实例
    const instance = createComponentInstance(vnode)

    // 初始化组件的状态
    setupComponent(instance)

    // 将组件挂载到页面中
    setupRenderEffect(instance, container, anchor)
  }

  const setupRenderEffect = (instance, container, anchor) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        // 调用 render 函数，拿到组件的子树（render返回的虚拟节点），this 指向 setup 返回的结果
        const subTree = instance.render.call(instance.proxy)
        // 将 subTree 挂载到页面中
        patch(null, subTree, container, anchor)
        instance.subTree = subTree
        instance.isMounted = true
      } else {
        const prevSubTree = instance.subTree
        const subTree = instance.render.call(instance.proxy)
        patch(prevSubTree, subTree, container, anchor)
        instance.subTree = subTree
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
  const patch = (n1, n2, container, anchor?) => {
    // 如果两次传递了同一个虚拟节点，则不执行任何操作
    if (n1 === n2) return

    if (n1 && !isSameVNodeType(n1, n2)) {
      unmount(n1)
      n1 = null
    }

    const { shapeFlag, type } = n2
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor)
        } else if (shapeFlag & ShapeFlags.COMPONENT) {
          processComponent(n1, n2, container, anchor)
        }
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
