import { h } from './h'

export function createAppAPI(render) {
  return function createApp(rootComponent, rootProps) {
    const app = {
      _container: null,
      mount(container) {
        // 创建组件的虚拟节点
        const vnode = h(rootComponent, rootProps)
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
