import { proxyRefs } from '@vue/reactivity'

export const createComponentInstance = vnode => {
  const { type } = vnode
  const instance = {
    type,
    vnode,
    props: {},
    attrs: {},
    subTree: null, // 子树， render的返回值
    isMounted: false, // 是否已经挂载
    render: null, // 组件的渲染函数
    setupState: null, // setup返回的结果
  }
  return instance
}

/**
 * 初始化组件实例
 * @param instance 组件实例
 */
export const setupComponent = instance => {
  const { type } = instance
  const setupResult = proxyRefs(type.setup())
  // 拿到 setup 返回的结果，并存到组件实例上
  instance.setupState = setupResult
  instance.render = type.render
}
