import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 报警事件（AlertEvent）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), deviceId(string), eventType(enum), level(enum), description(string), occurTime(datetime), status(enum), handler(string), confirmTime(datetime)
 */
export const useAlertEventStore = defineStore('alertEvent', () => {
  const alertEventList = ref([])

  const total = computed(() => alertEventList.value.length)

  function findById(id) {
    return alertEventList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'alertEvent_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    alertEventList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = alertEventList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      alertEventList.value[idx] = { ...alertEventList.value[idx], ...patch }
      return alertEventList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = alertEventList.value.findIndex(item => item.id === id)
    if (idx >= 0) alertEventList.value.splice(idx, 1)
  }

  function clear() {
    alertEventList.value = []
  }

  function setAll(items) {
    alertEventList.value = Array.isArray(items) ? [...items] : []
  }

  return { alertEventList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-alertEvent',
    storage: localStorage
  }
})
