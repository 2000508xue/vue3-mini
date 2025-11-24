import { ref } from '@vue/reactivity'
import { getCurrentInstance } from './component'

export function useTemplateRef(key) {
  const currentInstance = getCurrentInstance()
  const { refs } = currentInstance
  /**
   * key === string
   * 会 set 到 instance.refs 上面去
   */
  const elRef = ref(null)

  Object.defineProperty(refs, key, {
    get() {
      return elRef.value
    },
    set(value) {
      elRef.value = value
    },
  })

  return elRef
}
