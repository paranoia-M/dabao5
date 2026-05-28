import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 数据标准（DataStandard）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), standardCode(string), standardName(string), dataType(string), length(number), enumValues(array), businessDomain(string), status(enum)
 */
export const useDataStandardStore = defineStore('dataStandard', () => {
  const dataStandardList = ref([])

  const total = computed(() => dataStandardList.value.length)

  function findById(id) {
    return dataStandardList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dataStandard_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dataStandardList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dataStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dataStandardList.value[idx] = { ...dataStandardList.value[idx], ...patch }
      return dataStandardList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dataStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) dataStandardList.value.splice(idx, 1)
  }

  function clear() {
    dataStandardList.value = []
  }

  function setAll(items) {
    dataStandardList.value = Array.isArray(items) ? [...items] : []
  }

  return { dataStandardList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dataStandard',
    storage: localStorage
  }
})
