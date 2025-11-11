export function isObject(value) {
  return value !== null && typeof value === 'object'
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue)
}

export function isFunction(value) {
  return typeof value === 'function'
}
