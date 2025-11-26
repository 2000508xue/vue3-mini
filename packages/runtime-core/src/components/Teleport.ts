export const isTeleport = type => type?.__isTeleport

export const Teleport = {
  name: 'Teleport',
  __isTeleport: true,
  props: {
    to: {
      type: String,
    },
    disabled: {
      type: Boolean,
    },
  },
  process(n1, n2, container, anchor, parentComponent, internals) {
    const {
      mountChildren,
      patchChildren,
      options: { insert },
    } = internals
    const { to, disabled } = n2.props

    if (n1 === null) {
      // 挂载
      /**
       * 挂载的逻辑，就是我们要把 n2.children 挂载到 选择器为 to 的容器中
       */
      const target = disabled ? container : document.querySelector(to)
      if (target) {
        n2.target = target
        mountChildren(n2.children, target, parentComponent)
      }
    } else {
      patchChildren(n1, n2, n1.target, parentComponent)
      n2.target = n1.target

      const prevProps = n1.props

      if (prevProps.to !== to || prevProps.disabled !== disabled) {
        const target = disabled ? container : document.querySelector(to)

        for (const child of n2.children) {
          insert(child.el, target)
        }
        n2.target = target
      }
    }
  },
}
