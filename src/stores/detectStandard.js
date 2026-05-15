import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测标准（DetectStandard）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), standardCode(string), category(enum), itemName(string), limitValue(string), source(string), status(boolean), effectiveDate(date), remark(string)
 */
export const useDetectStandardStore = defineStore('detectStandard', () => {
  const detectStandardList = ref([])

  const total = computed(() => detectStandardList.value.length)

  function findById(id) {
    return detectStandardList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'detectStandard_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    detectStandardList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = detectStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      detectStandardList.value[idx] = { ...detectStandardList.value[idx], ...patch }
      return detectStandardList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = detectStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) detectStandardList.value.splice(idx, 1)
  }

  function clear() {
    detectStandardList.value = []
  }

  function setAll(items) {
    detectStandardList.value = Array.isArray(items) ? [...items] : []
  }

  return { detectStandardList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-detectStandard',
    storage: localStorage
  }
})
