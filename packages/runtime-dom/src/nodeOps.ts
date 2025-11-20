// 封装DOM节点操作的API
export const nodeOps = {
  createElement(type) {
    return document.createElement(type)
  },
  insert(el, parent, anchor) {
    parent.insertBefore(el, anchor || null)
  },
  remove(el) {
    const parent = el.parentNode
    if (parent) {
      parent.removeChild(el)
    }
  },
  setElementText(el, text) {
    el.textContent = text
  },
  createText(text) {
    return document.createTextNode(text)
  },
  setText(node, text) {
    node.nodeValue = text
  },
  parentNode(el) {
    return el.parentNode
  },
  nextSibling(el) {
    return el.nextSibling
  },
  querySelector(selector) {
    return document.querySelector(selector)
  },
}
