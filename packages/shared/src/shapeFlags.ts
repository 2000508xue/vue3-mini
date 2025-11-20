// 利用位运算来标记不同类型的 vnode
export enum ShapeFlags {
  ELEMENT = 1, // 元素
  FUNCTIONAL_COMPONENT = 1 << 1, //函数式组件
  STATEFUL_COMPONENT = 1 << 2, // 有状态组件
  TEXT_CHILDREN = 1 << 3, // 文本子节点
  ARRAY_CHILDREN = 1 << 4, // 数组子节点
  SLOTS_CHILDREN = 1 << 5, // 插槽子节点
  TELEPORT = 1 << 6, // 传送门
  SUSPENSE = 1 << 7, // 异步组件
  COMPONENT_SHOULD_KEEP_ALIVE = 1 << 8, // 需要保持激活状态的组件
  COMPONENT_KEPT_ALIVE = 1 << 9, // 已经保持激活状态的组件
  COMPONENT = ShapeFlags.STATEFUL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT, // 组件
}
