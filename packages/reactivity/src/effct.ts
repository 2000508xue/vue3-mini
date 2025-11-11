import { startTrack, endTrack } from './system'
import { Link } from './system'

export let activeSub

export function setActiveSub(sub) {
  activeSub = sub
}

export class ReactiveEffect {
  /**
   * 依赖项链表的头结点
   */
  deps: Link | undefined

  /**
   * 依赖项链表的尾结点
   */
  depsTail: Link | undefined

  tracking = false

  dirty = false

  // 表示这个 effect 是否处于激活状态
  active = true
  constructor(public fn) {}

  run() {
    if (!this.active) {
      return this.fn()
    }
    // 每次执行 fn 前，先保存当前的 effect 实例
    const prevSub = activeSub
    setActiveSub(this)
    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      setActiveSub(prevSub)
    }
  }

  scheduler() {
    this.run()
  }

  notify() {
    this.scheduler()
  }

  stop() {
    if (this.active) {
      // 清理依赖
      startTrack(this)
      endTrack(this)
      this.active = false
    }
  }
}

export function effect(fn, options) {
  const e = new ReactiveEffect(fn)
  Object.assign(e, options)
  const runner = e.run.bind(e)
  runner()
  runner.effect = e
  return runner
}
