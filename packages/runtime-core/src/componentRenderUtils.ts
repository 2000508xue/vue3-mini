import {
  setCurrentRenderingInstance,
  unsetCurrentRenderingInstance,
} from './component'

function hasPropsChanged(prevProps, nextProps) {
  const nextKeys = Object.keys(nextProps)
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true
  }

  for (const key of nextKeys) {
    if (nextProps[key] !== prevProps[key]) {
      return true
    }
  }

  return false
}

export const shouldUpdateComponent = (n1, n2) => {
  const { props: prevProps, children: prevChildren } = n1
  const { props: nextProps, children: nextChildren } = n2

  if (prevChildren || nextChildren) {
    return true
  }
  if (!prevProps) {
    return !!nextProps
  }
  if (!nextProps) {
    return true
  }
  return hasPropsChanged(prevProps, nextProps)
}

export function renderComponentRoot(instance) {
  setCurrentRenderingInstance(instance)
  const subTree = instance.render.call(instance.proxy)
  unsetCurrentRenderingInstance()
  return subTree
}
