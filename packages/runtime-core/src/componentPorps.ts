import { hasOwn, isArray } from '@vue/shared'
import { reactive } from '@vue/reactivity'

export const normalizePropsOptions = (props = {}) => {
  // 数组转对象
  if (isArray(props)) {
    return props.reduce((prev, cur) => {
      prev[cur] = {}
      return prev
    }, {})
  }
  return props
}

function setFullProps(instance, rawProps, props, attrs) {
  const { propsOptions } = instance
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key]
      if (hasOwn(propsOptions, key)) {
        props[key] = value
      } else {
        attrs[key] = value
      }
    }
  }
}

export const initProps = instance => {
  const { vnode } = instance
  const rawProps = vnode.props
  const props = {}
  const attrs = {}
  setFullProps(instance, rawProps, props, attrs)
  // props 是响应式的
  instance.props = reactive(props)
  instance.attrs = attrs
}

export function updateProps(instance, nextVNode) {
  const { props, attrs } = instance
  const rawProps = nextVNode.props
  // 设置所有的
  setFullProps(instance, rawProps, props, attrs)

  // 删除之前有 现在没有的
  for (const key in props) {
    if (!hasOwn(rawProps, key)) {
      delete props[key]
    }
  }

  for (const key in attrs) {
    if (!hasOwn(rawProps, key)) {
      delete attrs[key]
    }
  }
}
