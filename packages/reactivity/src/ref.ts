import { hasChanged, isObject } from '@vue/shared'
import { activeSub } from './effct'
import { propagate, link, type Link } from './system'
import { reactive } from './reactive'

export enum ReactiveFlags {
  IS_REF = '__v_isRef',
  IS_REACTIVE = '__v_isReactive',
}

class RefImpl {
  // 保存实际的值
  _value;
  // ref 标识，证明是一个ref
  [ReactiveFlags.IS_REF] = true

  // 保存和 effect 之间的关联关系 链表头结点
  subs: Link
  // 保存和 effect 之间的关联关系 链表尾结点
  subsTail: Link

  constructor(value) {
    this._value = isObject(value) ? reactive(value) : value
  }

  get value() {
    if (activeSub) {
      trackRef(this)
    }
    return this._value
  }

  set value(newValue) {
    if (hasChanged(this._value, newValue)) {
      this._value = isObject(newValue) ? reactive(newValue) : newValue
      triggerRef(this)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}

export function isRef(value) {
  return !!(value && value[ReactiveFlags.IS_REF])
}

/**
 * 收集依赖 建立 ref 和 effect 之间的链表关系
 * @param dep
 */
export function trackRef(dep) {
  if (activeSub) {
    link(dep, activeSub)
  }
}

/**
 * 触发 ref 关联的 effect 重新执行
 * @param dep ref 实例
 */
function triggerRef(dep) {
  if (dep.subs) {
    propagate(dep.subs)
  }
}

class ObjectRefImpl {
  [ReactiveFlags.IS_REF] = true
  constructor(
    public _object,
    public _key,
  ) {}

  get value() {
    return this._object[this._key]
  }
  set value(newValue) {
    this._object[this._key] = newValue
  }
}

export function toRef(target, key) {
  return new ObjectRefImpl(target, key)
}

export function toRefs(target) {
  const ret = {}
  for (const key in target) {
    ret[key] = toRef(target, key)
  }
  return ret
}

export function unref(ref) {
  return isRef(ref) ? ref.value : ref
}

export function proxyRefs(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver)
      return unref(res)
    },
    set(target, key, newValue, receiver) {
      const oldValue = target[key]
      if (isRef(oldValue) && !isRef(newValue)) {
        oldValue.value = newValue
        return true
      }
      return Reflect.set(target, key, newValue, receiver)
    },
  })
}
