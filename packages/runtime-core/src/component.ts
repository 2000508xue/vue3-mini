import { proxyRefs } from '@vue/reactivity'
import { initProps, normalizePropsOptions } from './componentPorps'
import { hasOwn, isFunction, isObject } from '@vue/shared'
import { nextTick } from './scheduler'

export const createComponentInstance = vnode => {
  const { type } = vnode
  const instance: any = {
    type,
    vnode,
    propsOptions: normalizePropsOptions(type.props), // 组件内部声明的props
    props: {},
    attrs: {},
    slots: {},
    refs: {},
    subTree: null, // 子树， render的返回值
    isMounted: false, // 是否已经挂载
    render: null, // 组件的渲染函数
    setupState: {}, // setup返回的结果
    proxy: null,
    setupContext: null,
  }
  instance.ctx = { _: instance }
  return instance
}

/**
 * 初始化组件实例
 * @param instance 组件实例
 */
export const setupComponent = instance => {
  // 初始化 props
  initProps(instance)
  // 初始化组件中的 状态和渲染函数
  setupStatefulComponent(instance)
}

const publicPropertiesMap = {
  $attrs: instance => instance.attrs,
  $slots: instance => instance.slots,
  $refs: instance => instance.refs,
  $nextTick: instance => {
    return nextTick.bind(instance)
  },
  $forceUpdate: instance => {
    return () => instance.update()
  },
}

const publicInstanceProxyHandlers = {
  get(target, key) {
    const { _: instance } = target
    const { setupState, props } = instance

    /**
     * 访问了某个属性，我先去 setupState 中找，如果没有再去 props 中找
     */
    if (hasOwn(setupState, key)) {
      return setupState[key]
    }

    if (hasOwn(props, key)) {
      return props[key]
    }

    /**
     * $attrs
     * $slots
     * $refs
     */
    if (hasOwn(publicPropertiesMap, key)) {
      const publicGetter = publicPropertiesMap[key]
      return publicGetter(instance)
    }

    return instance[key]
  },
  set(target, key, newValue) {
    const { _: instance } = target
    const { setupState, props } = instance

    if (hasOwn(setupState, key)) {
      setupState[key] = newValue
    }

    return true
  },
}

function setupStatefulComponent(instance) {
  const { type } = instance

  instance.proxy = new Proxy(instance.ctx, publicInstanceProxyHandlers)

  if (isFunction(type.setup)) {
    const setupContext = createSetupContext(instance)
    instance.setupContext = setupContext
    const setupResult = type.setup(instance.props, setupContext)
    handleSetupResult(instance, setupResult)
  }

  if (!instance.render) {
    instance.render = type.render
  }
}

function handleSetupResult(instance, setupResult) {
  if (isFunction(setupResult)) {
    instance.render = setupResult
  } else if (isObject(setupResult)) {
    // 拿到 setup 返回的结果，并存到组件实例上
    instance.setupState = proxyRefs(setupResult)
  }
}

/**
 * 创建 setup 上下文
 */
function createSetupContext(instance) {
  return {
    get attrs() {
      return instance.attrs
    },
  }
}
