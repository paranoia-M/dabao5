import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 导出记录（ExportRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), module(string), fileName(string), fileSize(number), status(enum), createdAt(datetime)
 */
export const useExportRecordStore = defineStore('exportRecord', () => {
  const exportRecordList = ref([])

  const total = computed(() => exportRecordList.value.length)

  function findById(id) {
    return exportRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'exportRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    exportRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = exportRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      exportRecordList.value[idx] = { ...exportRecordList.value[idx], ...patch }
      return exportRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = exportRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) exportRecordList.value.splice(idx, 1)
  }

  function clear() {
    exportRecordList.value = []
  }

  function setAll(items) {
    exportRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { exportRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-exportRecord',
    storage: localStorage
  }
})
