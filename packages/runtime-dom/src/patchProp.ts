import { isOn } from '@vue/shared'
import { patchClass } from './modules/patchClass'
import { patchStyle } from './modules/patchStyle'
import { patchEvent } from './modules/patchEvent'
import { patchAttr } from './modules/patchAttr'

export function patchProp(el, key, preValue, nextValue) {
  if (key === 'class') {
    return patchClass(el, nextValue)
  }
  if (key === 'style') {
    return patchStyle(el, preValue, nextValue)
  }
  if (isOn(key)) {
    return patchEvent(el, key, nextValue)
  }

  patchAttr(el, key, nextValue)
}
