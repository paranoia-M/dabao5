import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测结果（InspectionResult）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), taskId(string), standardId(string), itemName(string), value(string), unit(string), conclusion(enum), resultStatus(enum), testDate(date), remark(string)
 */
export const useInspectionResultStore = defineStore('inspectionResult', () => {
  const inspectionResultList = ref([])

  const total = computed(() => inspectionResultList.value.length)

  function findById(id) {
    return inspectionResultList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inspectionResult_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    inspectionResultList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = inspectionResultList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      inspectionResultList.value[idx] = { ...inspectionResultList.value[idx], ...patch }
      return inspectionResultList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = inspectionResultList.value.findIndex(item => item.id === id)
    if (idx >= 0) inspectionResultList.value.splice(idx, 1)
  }

  function clear() {
    inspectionResultList.value = []
  }

  function setAll(items) {
    inspectionResultList.value = Array.isArray(items) ? [...items] : []
  }

  return { inspectionResultList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inspectionResult',
    storage: localStorage
  }
})
