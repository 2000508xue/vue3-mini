export function isObject(value) {
  return value !== null && typeof value === 'object'
}

export function hasChanged(newValue, oldValue) {
  return !Object.is(newValue, oldValue)
}

export function isString(value) {
  return typeof value === 'string'
}

export function isFunction(value) {
  return typeof value === 'function'
}

export function isOn(value) {
  return /^on[A-Z]/.test(value)
}

export function isNumber(value) {
  return typeof value === 'number'
}

export const isArray = Array.isArray
