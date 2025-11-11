import { hasChanged, isFunction } from '@vue/shared'
import { ReactiveFlags } from './ref'
import { Dependency, Link, Sub, endTrack, startTrack } from './system'
import { activeSub, setActiveSub } from './effct'
import { link } from './system'

export function computed(getterOrOptions) {
  let getter
  let setter

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions
    setter = () => {}
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set
  }

  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl implements Dependency, Sub {
  [ReactiveFlags.IS_REF] = true

  _value

  subs: Link | undefined
  subsTail: Link | undefined

  deps: Link | undefined
  depsTail: Link | undefined
  tracking = false
  dirty = true
  constructor(
    public fn,
    private setter,
  ) {}

  get value() {
    // 如果计算属性是脏的，则需要重新计算值
    if (this.dirty) {
      this.update()
    }

    if (activeSub) {
      link(this, activeSub)
    }
    return this._value
  }

  set value(newValue) {
    if (this.setter) {
      this.setter(newValue)
    } else {
      console.warn('Computed value is readonly')
    }
  }

  update() {
    const prevSub = activeSub
    setActiveSub(this)
    startTrack(this)
    try {
      const oldValue = this._value
      this._value = this.fn()
      return hasChanged(oldValue, this._value)
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }
}
