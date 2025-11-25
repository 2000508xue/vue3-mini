import { h } from './h'

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const context = {
      // app 往后代组件注入的数据 会存到这里来
      provides: {},
    }
    const app = {
      _container: null,
      mount(container) {
        // 创建组件的虚拟节点
        const vnode = h(rootComponent, rootProps)
        // 为根组件绑定 appContext 上下文
        vnode.appContext = context
        render(vnode, container)
        app._container = container
      },
      unmount() {
        render(null, app._container)
      },
    }

    return app
  }
}
