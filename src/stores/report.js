import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 报告（Report）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), title(string), reportType(enum), generationMethod(enum), status(enum), relatedEntityType(string), relatedEntityId(string), content(object), createTime(datetime), auditBy(string), auditTime(datetime)
 */
export const useReportStore = defineStore('report', () => {
  const reportList = ref([])

  const total = computed(() => reportList.value.length)

  function findById(id) {
    return reportList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'report_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    reportList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = reportList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      reportList.value[idx] = { ...reportList.value[idx], ...patch }
      return reportList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = reportList.value.findIndex(item => item.id === id)
    if (idx >= 0) reportList.value.splice(idx, 1)
  }

  function clear() {
    reportList.value = []
  }

  function setAll(items) {
    reportList.value = Array.isArray(items) ? [...items] : []
  }

  return { reportList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-report',
    storage: localStorage
  }
})
