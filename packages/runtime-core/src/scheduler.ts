const resolvePromise = Promise.resolve()

export function nextTick(fn) {
  return resolvePromise.then(() => fn.call(this))
}

export function queueJob(job) {
  resolvePromise.then(() => {
    job()
  })
}
