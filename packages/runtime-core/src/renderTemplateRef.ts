import { isRef } from '@vue/reactivity'
import { ShapeFlags, isString } from '@vue/shared'
import { getComponentPublicInstace } from './component'

export function setRef(ref, vnode) {
  const { r: rawRef, i: instance } = ref

  if (vnode == null) {
    if (isRef(rawRef)) {
      rawRef.value = null
    } else if (isString(rawRef)) {
      instance.refs[rawRef] = null
    }

    return
  }

  const { shapeFlag } = vnode
  if (isRef(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      rawRef.value = getComponentPublicInstace(vnode.component)
    } else {
      rawRef.value = vnode.el
    }
  } else if (isString(rawRef)) {
    if (shapeFlag & ShapeFlags.COMPONENT) {
      instance.refs[rawRef] = getComponentPublicInstace(vnode.component)
    } else {
      instance.refs[rawRef] = vnode.el
    }
  }
}
