import { ShapeFlags, isArray, isString } from '@vue/shared'

export function isVNode(value) {
  return value?.__v_isVNode
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function createVNode(type, props?, children = null) {
  let shapeFlag

  // 判断type的类型
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  }

  // 追加子节点的类型
  if (isString(children)) {
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  }

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children,
    key: props?.key,
    el: null,
    shapeFlag,
  }

  return vnode
}
