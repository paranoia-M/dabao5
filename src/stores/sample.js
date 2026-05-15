import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 样品（Sample）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), source(string), type(enum), quantity(number), status(enum), receiveDate(date), description(string)
 */
export const useSampleStore = defineStore('sample', () => {
  const sampleList = ref([])

  const total = computed(() => sampleList.value.length)

  function findById(id) {
    return sampleList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'sample_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    sampleList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = sampleList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      sampleList.value[idx] = { ...sampleList.value[idx], ...patch }
      return sampleList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = sampleList.value.findIndex(item => item.id === id)
    if (idx >= 0) sampleList.value.splice(idx, 1)
  }

  function clear() {
    sampleList.value = []
  }

  function setAll(items) {
    sampleList.value = Array.isArray(items) ? [...items] : []
  }

  return { sampleList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-sample',
    storage: localStorage
  }
})
