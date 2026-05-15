import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测报告（InspectionReport）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), taskId(string), title(string), reportNo(string), status(enum), generator(string), generateDate(datetime), approveDate(datetime), finalResult(enum)
 */
export const useInspectionReportStore = defineStore('inspectionReport', () => {
  const inspectionReportList = ref([])

  const total = computed(() => inspectionReportList.value.length)

  function findById(id) {
    return inspectionReportList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inspectionReport_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    inspectionReportList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = inspectionReportList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      inspectionReportList.value[idx] = { ...inspectionReportList.value[idx], ...patch }
      return inspectionReportList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = inspectionReportList.value.findIndex(item => item.id === id)
    if (idx >= 0) inspectionReportList.value.splice(idx, 1)
  }

  function clear() {
    inspectionReportList.value = []
  }

  function setAll(items) {
    inspectionReportList.value = Array.isArray(items) ? [...items] : []
  }

  return { inspectionReportList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inspectionReport',
    storage: localStorage
  }
})
