import { startTrack, endTrack } from './system'
import { Link } from './system'

export let activeSub

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
  constructor(public fn) {}

  run() {
    // 每次执行 fn 前，先保存当前的 effect 实例
    const prevSub = activeSub
    activeSub = this
    startTrack(this)
    try {
      return this.fn()
    } finally {
      endTrack(this)
      activeSub = prevSub
    }
  }

  scheduler() {
    this.run()
  }

  notify() {
    this.scheduler()
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
