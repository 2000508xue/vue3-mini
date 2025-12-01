import {
  ShapeFlags,
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
} from '@vue/shared'
import { getCurrentRenderingInstance } from './component'
import { isTeleport } from './components/Teleport'

export const Text = Symbol('v-text')

export const Fragment = Symbol('v-fragment')

export function isVNode(value) {
  return value?.__v_isVNode
}

export function normalizeVNode(vnode) {
  if (isString(vnode) || isNumber(vnode)) {
    return createVNode(Text, null, String(vnode))
  }
  return vnode !== null && vnode !== undefined ? vnode : ''
}

export function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key
}

export function normalizeChildren(vnode, children) {
  let { shapeFlag } = vnode

  // 追加子节点的类型
  if (isString(children) || isNumber(children)) {
    children = String(children)
    shapeFlag |= ShapeFlags.TEXT_CHILDREN
  } else if (isArray(children)) {
    shapeFlag |= ShapeFlags.ARRAY_CHILDREN
  } else if (isFunction(children)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      shapeFlag |= ShapeFlags.SLOTS_CHILDREN
    }
    children = { default: children }
  } else if (isObject(children)) {
    shapeFlag |= ShapeFlags.SLOTS_CHILDREN
  }

  vnode.shapeFlag = shapeFlag
  vnode.children = children
}

function normalizeRef(ref) {
  if (ref == null) return
  return {
    r: ref,
    i: getCurrentRenderingInstance(),
  }
}

export function createVNode(type, props?, children = null) {
  let shapeFlag = 0

  // 处理 type 的 shapeFlag
  // 判断type的类型
  if (isString(type)) {
    shapeFlag = ShapeFlags.ELEMENT
  } else if (isTeleport(type)) {
    shapeFlag = ShapeFlags.TELEPORT
  } else if (isObject(type)) {
    // 有状态的组件
    shapeFlag = ShapeFlags.STATEFUL_COMPONENT
  } else if (isFunction(type)) {
    // 函数式组件
    shapeFlag = ShapeFlags.FUNCTIONAL_COMPONENT
  }

  const vnode = {
    __v_isVNode: true,
    type,
    props,
    children: null,
    key: props?.key,
    el: null,
    shapeFlag,
    ref: normalizeRef(props?.ref),
    appContext: null,
  }

  normalizeChildren(vnode, children)

  return vnode
}
