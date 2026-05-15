import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 预警配置（AlertConfig）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), standardId(string), ruleType(enum), threshold(string), status(boolean), description(string), createDate(datetime), updateDate(datetime)
 */
export const useAlertConfigStore = defineStore('alertConfig', () => {
  const alertConfigList = ref([])

  const total = computed(() => alertConfigList.value.length)

  function findById(id) {
    return alertConfigList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'alertConfig_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    alertConfigList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = alertConfigList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      alertConfigList.value[idx] = { ...alertConfigList.value[idx], ...patch }
      return alertConfigList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = alertConfigList.value.findIndex(item => item.id === id)
    if (idx >= 0) alertConfigList.value.splice(idx, 1)
  }

  function clear() {
    alertConfigList.value = []
  }

  function setAll(items) {
    alertConfigList.value = Array.isArray(items) ? [...items] : []
  }

  return { alertConfigList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-alertConfig',
    storage: localStorage
  }
})
