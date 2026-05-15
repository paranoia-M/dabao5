import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 预警记录（AlertRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), alertConfigId(string), resultId(string), sampleId(string), level(enum), description(string), status(enum), createDate(datetime), handledBy(string), handledDate(datetime), remark(string)
 */
export const useAlertRecordStore = defineStore('alertRecord', () => {
  const alertRecordList = ref([])

  const total = computed(() => alertRecordList.value.length)

  function findById(id) {
    return alertRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'alertRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    alertRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = alertRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      alertRecordList.value[idx] = { ...alertRecordList.value[idx], ...patch }
      return alertRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = alertRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) alertRecordList.value.splice(idx, 1)
  }

  function clear() {
    alertRecordList.value = []
  }

  function setAll(items) {
    alertRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { alertRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-alertRecord',
    storage: localStorage
  }
})
