export function patchStyle(el, preValue, nextValue) {
  const style = el.style
  if (nextValue) {
    for (const key in nextValue) {
      style[key] = nextValue[key]
    }
  }
  if (preValue) {
    for (const key in preValue) {
      if (!(key in nextValue)) {
        style[key] = null
      }
    }
  }
}
