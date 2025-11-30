import { getCurrentInstance } from '../component'
import { h } from '../h'

function resolveTransitionProps(props) {
  const {
    name = 'v',
    enterFromClass = `${name}-enter-from`,
    enterActiveClass = `${name}-enter-active`,
    enterToClass = `${name}-enter-to`,
    leaveFromClass = `${name}-leave-from`,
    leaveActiveClass = `${name}-leave-active`,
    leaveToClass = `${name}-leave-to`,
    onEnter,
    onBeforeEnter,
    onLeave,
    ...reset
  } = props

  return {
    ...reset,
    beforeEnter(el) {
      el.classList.add(enterFromClass)
      el.classList.add(enterActiveClass)
      onBeforeEnter?.(el)
    },
    enter(el) {
      const done = () => {
        // 动画结束了 删除这俩类类名
        el.classList.remove(enterToClass)
        el.classList.remove(enterActiveClass)
      }
      requestAnimationFrame(() => {
        el.classList.remove(enterFromClass)
        el.classList.add(enterToClass)
      })

      onEnter?.(el, done)

      if (!onEnter || onEnter.length < 2) {
        el.addEventListener('transitionend', done, { once: true })
      }
    },
    leave(el, remove) {
      const done = () => {
        el.classList.remove(leaveToClass)
        el.classList.remove(leaveActiveClass)
        remove()
      }
      el.classList.add(leaveActiveClass)
      el.classList.add(leaveFromClass)
      requestAnimationFrame(() => {
        el.classList.remove(leaveFromClass)
        el.classList.add(leaveToClass)
      })
      onLeave?.(el, done)
      if (!onLeave || onLeave.length < 2) {
        el.addEventListener('transitionend', done, { once: true })
      }
    },
  }
}

export function Transition(props, { slots }) {
  return h(BaseTransition, resolveTransitionProps(props), slots)
}

const BaseTransition = {
  props: ['enter', 'leave', 'beforeEnter', 'appear'],
  setup(props, { slots }) {
    const vm = getCurrentInstance()
    return () => {
      const vnode = slots.default()
      if (!vnode) return

      if (props.appear || vm.isMounted) {
        vnode.transition = props
      } else {
        vnode.transition = {
          leave: props.leave,
        }
      }

      return vnode
    }
  },
}
