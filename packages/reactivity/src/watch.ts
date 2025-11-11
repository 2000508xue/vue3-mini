import { isRef } from './ref'
import { ReactiveEffect } from './effct'
import { isFunction, isObject } from '@vue/shared'
import { isReactive } from './reactive'

export function watch(source, cb, options: any = {}) {
  let { immediate, once, deep } = options

  if (once) {
    const _cb = cb
    cb = (...args) => {
      _cb(...args)
      stop()
    }
  }

  let getter
  if (isRef(source)) {
    getter = () => source.value
  } else if (isReactive(source)) {
    getter = () => source
    if (!deep) {
      deep = true
    }
  } else if (isFunction(source)) {
    getter = source
  }

  if (deep) {
    const baseGetter = getter
    const depth = deep === true ? Infinity : deep
    getter = () => traverse(baseGetter(), depth)
  }

  let oldValue

  let cleanup = null
  function onCleanup(cb) {
    cleanup = cb
  }

  function job() {
    if (cleanup) {
      cleanup()
      cleanup = null
    }
    // 执行 effect.run 拿到 getter 的返回值，不能直接执行getter，因为要收集依赖
    const newValue = effect.run()
    // 执行用户的回调函数
    cb(newValue, oldValue, onCleanup)

    oldValue = newValue
  }

  const effect = new ReactiveEffect(getter)
  effect.scheduler = job

  if (immediate) {
    job()
  } else {
    // 拿到 oldValue 以及 收集依赖
    oldValue = effect.run()
  }

  function stop() {
    effect.stop()
  }

  return stop
}

function traverse(value, depth = Infinity, seen = new Set()) {
  if (!isObject(value) || depth <= 0) return value

  if (seen.has(value)) return value

  depth--

  seen.add(value)

  for (const key in value) {
    traverse(value[key], depth, seen)
  }

  return value
}
