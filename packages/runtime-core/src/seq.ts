export function seq(arr) {
  const res = [0]
  const length = arr.length
  const p = arr.slice()
  for (let i = 0; i < length; i++) {
    const arrItem = arr[i]
    if (arrItem !== 0) {
      const resLastIndex = res[res.length - 1]
      if (arrItem > arr[resLastIndex]) {
        p[i] = res[res.length - 1]
        res.push(i)
        continue
      }

      let start = 0
      let end = res.length - 1
      let middle
      while (start < end) {
        middle = start + ((end - start) >> 1)
        if (arrItem > arr[res[middle]]) {
          start = middle + 1
        } else {
          end = middle
        }
      }
      if (arrItem < arr[res[start]]) {
        p[i] = res[start - 1]
        res[start] = i
      }
    }
  }

  let l = res.length
  let last = res[l - 1]
  while (l-- > 0) {
    res[l] = last
    last = p[last]
  }

  return res
}

// console.log(getSequence([2, 3, 1, 5, 6, 8, 7, 9, 4]))

// 2
// 2 3
// 1 3
// 1 3 5 6 8
// 1 3 5 6 7 9
// 1 3 4 6 7 9
