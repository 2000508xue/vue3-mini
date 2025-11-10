import { hasChanged, isObject } from '@vue/shared'
import { ReactiveFlags, isRef } from './ref'
import { track, trigger } from './dep'
import { reactive } from './reactive'

export const mutableHandlers = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    /**
     * target = { a: 0 }
     * 收集依赖，绑定target中某一个key和sub之间的关系
     */
    track(target, key)

    /**
     * receiver 用来保证访问器中的this指向正确
     */
    const res = Reflect.get(target, key, receiver)

    if (isRef(res)) {
      return res.value
    }

    if (isObject(res)) {
      // 如果 res 是一个对象 则递归转为响应式对象
      return reactive(res)
    }

    return res
  },
  set(target, key, newValue, receiver) {
    /**
     * 触发依赖，执行target中某一个key对应的sub
     */
    // 先set 再通知依赖，执行sub
    const oldValue = target[key]
    const res = Reflect.set(target, key, newValue, receiver)

    if (isRef(oldValue) && !isRef(newValue)) {
      oldValue.value = newValue
      return res
    }

    if (hasChanged(oldValue, newValue)) {
      trigger(target, key)
    }

    return res
  },
}
