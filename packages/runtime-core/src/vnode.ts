import { ShapeFlags, isArray, isNumber, isObject, isString } from '@vue/shared'

export const Text = Symbol('v-text')

export function isVNode(value) {
  return value?.__v_isVNode
}

export function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    return createVNode(Text, null, String(vnode))
  }
  return vnode
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function normalizeChildren(children) {
  if (isNumber(children)) {
    children = String(children)
  }
  return children
}

export function createVNode(type, props?, children = null) {
  children = normalizeChildren(children)
  let shapeFlag = 0

  // 判断type的类型
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isObject(type)) {
    // 有状态的组件
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
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
