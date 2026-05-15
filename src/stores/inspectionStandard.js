import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测标准（InspectionStandard）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), itemName(string), minValue(number), maxValue(number), unit(string), productLine(string), effectiveDate(date), status(enum), version(number)
 */
export const useInspectionStandardStore = defineStore('inspectionStandard', () => {
  const inspectionStandardList = ref([])

  const total = computed(() => inspectionStandardList.value.length)

  function findById(id) {
    return inspectionStandardList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inspectionStandard_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    inspectionStandardList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = inspectionStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      inspectionStandardList.value[idx] = { ...inspectionStandardList.value[idx], ...patch }
      return inspectionStandardList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = inspectionStandardList.value.findIndex(item => item.id === id)
    if (idx >= 0) inspectionStandardList.value.splice(idx, 1)
  }

  function clear() {
    inspectionStandardList.value = []
  }

  function setAll(items) {
    inspectionStandardList.value = Array.isArray(items) ? [...items] : []
  }

  return { inspectionStandardList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inspectionStandard',
    storage: localStorage
  }
})
