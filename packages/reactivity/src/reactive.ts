import { isObject } from '@vue/shared'
import { ReactiveFlags } from './ref'
import { mutableHandlers } from './mutableHandlers'

export function reactive(target) {
  return createReactiveObject(target)
}

/**
 * 保存 target 和 响应式对象之间的关联关系
 */
const reactiveMap = new WeakMap()

function createReactiveObject(target) {
  if (!isObject(target)) {
    return target
  }

  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }

  // 获取到之前的响应式对象，如果有就直接返回
  const existingProxy = reactiveMap.get(target)
  if (existingProxy) {
    return existingProxy
  }

  const proxy = new Proxy(target, mutableHandlers)

  reactiveMap.set(target, proxy)
  return proxy
}

export function isReactive(target) {
  return !!(target && target[ReactiveFlags.IS_REACTIVE])
}
