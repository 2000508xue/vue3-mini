export function patchAttr(el, key, value) {
  if (value !== undefined) {
    el.setAttribute(key, value)
  } else {
    el.removeAttribute(key)
  }
}
