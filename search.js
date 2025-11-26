class LRUCache {
  cache = new Map()
  constructor(max) {
    this.max = max
  }
  get(key) {
    if (!this.cache.has(key)) return

    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }
  set(key, value) {
    // 之前有 先删掉 把最新的放到最后面
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else {
      if (this.cache.size >= this.max) {
        const firstKey = this.cache.keys().next().value
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, value)
  }
}
