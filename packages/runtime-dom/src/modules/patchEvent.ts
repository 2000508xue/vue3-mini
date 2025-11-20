const veiKey = Symbol('_vei')

function createInvoker(value) {
  /**
   * 创建一个事件处理函数 内部调用 invoker
   * 如果需要更新事件，那后面直接修改 invoker.value 即可
   * @param e
   */
  const invoker = e => {
    invoker.value(e)
  }
  invoker.value = value
  return invoker
}

export function patchEvent(el, rawName, nextValue) {
  const name = rawName.slice(2).toLowerCase()
  const invokers = (el[veiKey] ??= {})

  const existingInvoker = invokers[rawName]
  if (nextValue) {
    if (existingInvoker) {
      existingInvoker.value = nextValue
      return
    }
    const invoker = createInvoker(nextValue)
    invokers[rawName] = invoker
    el.addEventListener(name, invoker)
  } else {
    if (!nextValue && existingInvoker) {
      el.removeEventListener(name, existingInvoker)
      invokers[rawName] = undefined
    }
  }
}
