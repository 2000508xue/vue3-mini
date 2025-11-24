import { ShapeFlags, hasOwn } from '@vue/shared'

export function initSlots(instance) {
  const { vnode, slots } = instance

  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    const children = vnode.children
    for (const key in children) {
      slots[key] = children[key]
    }
  }
}

export function updateSlots(instance, vnode) {
  const { slots } = instance

  // 组件的子元素是插槽吗
  if (vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN) {
    const children = vnode.children
    for (const key in children) {
      slots[key] = children[key]
    }

    // 删除不存在的插槽
    for (const key in slots) {
      if (children[key] == null) {
        delete slots[key]
      }
    }
  }
}
