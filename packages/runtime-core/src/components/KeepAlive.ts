import { ShapeFlags } from '@vue/shared'
import { getCurrentInstance } from '../component'

export const isKeepAlive = type => type?.__isKeepAlive

export const KeepAlive = {
  name: 'KeepAlive',
  __isKeepAlive: true,
  props: ['max'],
  setup(props, { slots }) {
    const instance = getCurrentInstance()

    const { options, unmount } = instance.ctx.renderer
    const { createElement, insert } = options

    const cache = new LRUCache(props.max)

    const storageContainer = createElement('div')

    // 虽然 unmount 不帮我卸载了 但是我自己需要把这个虚拟节点的 DOM 给放到某一个地方去
    instance.ctx.deactivate = vnode => {
      insert(vnode.el, storageContainer)
    }

    // 激活的时候
    instance.ctx.activate = (vnode, container, anchor) => {
      insert(vnode.el, container, anchor)
    }

    return () => {
      /**
       * 缓存：
       * component => vnode
       * or
       * key => vnode
       */
      const vnode = slots.default?.()
      const key = vnode.key != null ? vnode.key : vnode.type

      const cacheeVNode = cache.get(key)

      if (cacheeVNode) {
        // 复用缓存过得组件实例
        // 复用缓存过的 DOM 元素
        vnode.component = cacheeVNode.component
        vnode.el = cacheeVNode.el
        // 再打个标记 告诉 renderer.ts 里面不要让它重新挂载 我要复用之前的
        vnode.shapeFlag |= ShapeFlags.COMPONENT_KEPT_ALIVE
      }

      // 判断一下 _vnode 有没有，有的话就需要把它卸载掉
      const _vnode = cache.set(key, vnode)

      if (_vnode) {
        resetShapeFlag(_vnode)
        unmount(_vnode)
      }
      // 打个标记 告诉 unmount 不要给我卸载 我要做缓存
      // 标记 ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
      return vnode
    }
  },
}

function resetShapeFlag(vnode) {
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_KEPT_ALIVE
  vnode.shapeFlag &= ~ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE
}

class LRUCache {
  cache = new Map()
  max
  constructor(max = Infinity) {
    this.max = max
  }
  get(key) {
    if (!this.cache.has(key)) return

    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }
  set(key, value) {
    let vnode
    // 之前有 先删掉 把最新的放到最后面
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else {
      if (this.cache.size >= this.max) {
        const firstKey = this.cache.keys().next().value
        vnode = this.cache.get(firstKey)
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)

    return vnode
  }
}
