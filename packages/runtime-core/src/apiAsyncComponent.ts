import { ref } from '@vue/reactivity'
import { h } from './h'
import { isFunction } from '@vue/shared'

export function defineAsyncComponent(options) {
  if (isFunction(options)) {
    options = {
      loader: options,
    }
  }

  const defaultComponent = () => h('span', null, '')

  const {
    loader,
    loadingComponent = defaultComponent,
    errorComponent = defaultComponent,
    timeout,
  } = options

  return {
    setup(props, { attrs, slots }) {
      const component = ref(loadingComponent)

      function loadComponent() {
        return new Promise((resolve, reject) => {
          if (timeout && timeout > 0) {
            setTimeout(() => {
              reject('超时了')
            }, timeout)
          }
          loader().then(resolve, reject)
        })
      }

      loadComponent().then(
        comp => {
          if (comp && comp[Symbol.toStringTag] === 'Module') {
            // @ts-ignore
            component.value = comp.default
          } else {
            component.value = comp
          }
        },
        () => {
          // 加载失败了
          component.value = errorComponent
        },
      )

      return () => {
        return h(
          component.value,
          {
            ...attrs,
            ...props,
          },
          slots,
        )
      }
    },
  }
}
