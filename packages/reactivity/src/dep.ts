import { activeSub } from './effct'
import { Dependency, Link, link, propagate } from './system'

/**
 * 绑定 target 的 key 关联的所有 dep
 * obj = {a: 0}
 * targetMap = {
 *   obj: {
 *     a: Dep,
 *     b: Dep
 *   }
 * }
 */
const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeSub) return

  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }

  let dep = depsMap.get(key)

  if (!dep) {
    dep = new Dep()
    depsMap.set(key, dep)
  }

  link(dep, activeSub)
}

export function trigger(target, key) {
  const depsMap = targetMap.get(target)

  const targetIsArray = Array.isArray(target)
  if (targetIsArray && key === 'length') {
    const length = target.length
    depsMap.forEach((dep, depKey) => {
      if (depKey >= length || depKey === 'length') {
        // 通知了访问了大于等于 length 的effct，重新执行
        propagate(dep.subs)
      }
    })
  } else {
    if (!depsMap) return
    const dep = depsMap.get(key)
    if (!dep) return
    propagate(dep.subs)
  }
}

class Dep implements Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
  constructor() {}
}
