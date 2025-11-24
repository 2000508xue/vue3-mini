import {
  getCurrentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
} from './component'

export enum LifecycleHooks {
  // 挂载
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  // 更新
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  // 卸载
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

function createHook(type) {
  return (hook, target = getCurrentInstance()) => {
    injectHook(target, hook, type)
  }
}

function injectHook(instance, hook, type) {
  // if (instance[type] == null) {
  //   instance[type] = []
  // }
  // instance[type].push(hook)

  const _hook = () => {
    setCurrentInstance(instance)
    hook()
    unsetCurrentInstance()
  }

  ;(instance[type] ??= []).push(_hook)
}

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
export const onUpdated = createHook(LifecycleHooks.UPDATED)
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT)
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED)

export function triggerHooks(instance, type) {
  const hooks = instance[type]
  if (hooks) {
    for (let i = 0; i < hooks.length; i++) {
      hooks[i]()
    }
  }
}
