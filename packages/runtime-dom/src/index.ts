export * from '@vue/runtime-core'
import { createRenderer } from '@vue/runtime-core'
import { nodeOps } from './nodeOps'
import { patchProp } from './patchProp'

export const renderOptons = { patchProp, ...nodeOps }

/**
 * createRenderer 是 runtime-core 提供的渲染器工厂函数，用于创建自定义的渲染器。
 * renderOptions 提供了自定义渲染器所需的节点操作和属性打补丁方法。
 */
const renderer = createRenderer(renderOptons)

export function render(vnode, container) {
  return renderer.render(vnode, container)
}
