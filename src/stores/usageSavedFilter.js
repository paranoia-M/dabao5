import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 使用统计保存筛选（UsageSavedFilter）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), name(string), timeRange(string), dimension(string), config(object), createdAt(datetime)
 */
export const useUsageSavedFilterStore = defineStore('usageSavedFilter', () => {
  const savedFilterList = ref([])

  const total = computed(() => savedFilterList.value.length)

  function findById(id) {
    return savedFilterList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'usageSavedFilter_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    savedFilterList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = savedFilterList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      savedFilterList.value[idx] = { ...savedFilterList.value[idx], ...patch }
      return savedFilterList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = savedFilterList.value.findIndex(item => item.id === id)
    if (idx >= 0) savedFilterList.value.splice(idx, 1)
  }

  function clear() {
    savedFilterList.value = []
  }

  function setAll(items) {
    savedFilterList.value = Array.isArray(items) ? [...items] : []
  }

  return { savedFilterList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-usageSavedFilter',
    storage: localStorage
  }
})
