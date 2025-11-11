import { ReactiveEffect } from './effct'

// 依赖项
export interface Dependency {
  subs: Link | undefined
  subsTail: Link | undefined
}

// 订阅者
export interface Sub {
  deps: Link | undefined
  depsTail: Link | undefined
}

/**
 * 链表节点
 */
export interface Link {
  // 订阅者
  sub: Sub
  nextSub: Link | undefined
  preSub: Link | undefined
  dep: Dependency | undefined
  nextDep: Link | undefined
}

let linkPool: Link

/**
 *
 * @param dep ref 实例
 * @param sub effect 函数 订阅者
 */
export function link(dep, sub) {
  const currentDep = sub.depsTail

  /**
   * 分两种情况：
   * 1. 如果头节点有，尾结点没有，尝试复用头结点
   * 2. 如果头节点有，尾结点也有，尝试复用尾结点的 nextDep
   */
  const nextDep = currentDep === undefined ? dep.subs : currentDep.nextDep
  if (nextDep && nextDep.dep === dep) {
    sub.depsTail = nextDep
    return
  }

  let newLink

  if (linkPool) {
    newLink = linkPool
    linkPool = linkPool.nextDep
    newLink.nextDep = nextDep
    newLink.dep = dep
    newLink.sub = sub
  } else {
    newLink = {
      sub,
      dep,
      nextDep,
      nextSub: undefined,
      preSub: undefined,
    }
  }

  /**
   * 关联链表关系
   * 1. 尾结点 就让尾结点的 nextSub 指向新节点，新节点的 preSub 指向尾结点，最后更新subsTail为新节点
   * 2. 没有尾结点 就让 subs 指向新节点，同时更新subsTail为新节点
   */
  if (dep.subsTail) {
    dep.subsTail.nextSub = newLink
    newLink.preSub = dep.subsTail
    dep.subsTail = newLink
  } else {
    dep.subs = dep.subsTail = newLink
  }

  if (sub.depsTail) {
    sub.depsTail.nextDep = newLink
    sub.depsTail = newLink
  } else {
    sub.deps = sub.depsTail = newLink
  }
}

function processComputedUpdate(sub) {
  /**
   * 更新计算属性
   * 1. 调用 update
   * 2. 通知 sub 链表上所有的 sub 重新执行
   *
   * sub.update 返回了 true， 表示值发生了变化
   *
   */
  if (sub.subs && sub.update()) {
    propagate(sub.subs)
  }
}

/**
 * 传播更新的函数
 * @param subs
 */
export function propagate(subs) {
  let link = subs
  let queueEffect = []
  while (link) {
    const sub = link.sub
    if (!sub.tracking && !sub.dirty) {
      sub.dirty = true
      if ('update' in sub) {
        processComputedUpdate(sub)
      } else {
        queueEffect.push(sub)
      }
    }
    link = link.nextSub
  }
  queueEffect.forEach(effct => effct.notify())
} // 开始追踪依赖 将 depsTail 设置成 undefined

export function startTrack(sub) {
  sub.tracking = true
  sub.depsTail = undefined
}
// 结束追踪依赖

export function endTrack(sub) {
  sub.tracking = false
  const depsTail = sub.depsTail
  sub.dirty = false
  /**
   * depsTail 有，并且 depsTail 还有 nextDep，我们应该把他们的依赖关系清理掉
   * depsTail 没有，并且头结点有，那就把所有的都清理掉
   */
  if (depsTail) {
    if (depsTail.nextDep) {
      clearTracking(depsTail.nextDep)
      depsTail.nextDep = undefined
    }
  } else if (sub.deps) {
    clearTracking(sub.deps)
    sub.deps = sub.depsTail = undefined
  }
}

export function clearTracking(link: Link) {
  while (link) {
    const { nextSub, preSub, dep, nextDep } = link
    /**
     * 如果 prevSub 有，那就把 preSub 的 nextSub 指向下一个节点
     * 如果没有，那就是头结点，那就把头结点指向下一个节点
     */
    if (preSub) {
      preSub.nextSub = nextSub
      link.nextSub = undefined
    } else {
      dep.subs = nextSub
    }

    /**
     * 如果 nextSub 有，那就把 nextSub 的 preSub 指向上一个节点
     * 如果没有，那就是尾结点，那就把尾结点指向上一个节点
     */
    if (nextSub) {
      nextSub.preSub = preSub
      link.preSub = undefined
    } else {
      dep.subsTail = preSub
    }
    link.dep = link.sub = undefined
    link.nextDep = linkPool
    linkPool = link
    link = nextDep
  }
}
