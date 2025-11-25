import { getCurrentInstance } from './component'

export function provide(key, value) {
  const instance = getCurrentInstance()

  const parentProvides = instance.parent
    ? instance.parent.provides
    : instance.appContext.provides

  let provides = instance.provides

  if (parentProvides === provides) {
    instance.provides = Object.create(parentProvides)
    provides = instance.provides
  }

  // 设置属性到 provides 对象上
  provides[key] = value
}

export function inject(key, defultValue) {
  const instance = getCurrentInstance()

  const parentProvides = instance.parent
    ? instance.parent.provides
    : instance.appContext.provides

  if (key in parentProvides) {
    return parentProvides[key]
  }

  return defultValue
}
