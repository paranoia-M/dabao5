import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 隐患记录（HazardRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), inspectionTaskId(string), equipmentId(string), hazardType(enum), description(string), severity(enum), probability(enum), riskLevel(enum), status(enum), discoveredDate(date), assignedTo(string), rectificationDeadline(date)
 */
export const useHazardRecordStore = defineStore('hazardRecord', () => {
  const hazardRecordList = ref([])

  const total = computed(() => hazardRecordList.value.length)

  function findById(id) {
    return hazardRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'hazardRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    hazardRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = hazardRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      hazardRecordList.value[idx] = { ...hazardRecordList.value[idx], ...patch }
      return hazardRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = hazardRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) hazardRecordList.value.splice(idx, 1)
  }

  function clear() {
    hazardRecordList.value = []
  }

  function setAll(items) {
    hazardRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { hazardRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-hazardRecord',
    storage: localStorage
  }
})
