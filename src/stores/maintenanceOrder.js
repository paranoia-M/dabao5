import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 维护工单（MaintenanceOrder）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), planId(string), equipmentId(string), orderType(enum), priority(enum), status(enum), assignee(string), handler(string), description(string), completeTime(datetime), remark(string)
 */
export const useMaintenanceOrderStore = defineStore('maintenanceOrder', () => {
  const maintenanceOrderList = ref([])

  const total = computed(() => maintenanceOrderList.value.length)

  function findById(id) {
    return maintenanceOrderList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'maintenanceOrder_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    maintenanceOrderList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = maintenanceOrderList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      maintenanceOrderList.value[idx] = { ...maintenanceOrderList.value[idx], ...patch }
      return maintenanceOrderList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = maintenanceOrderList.value.findIndex(item => item.id === id)
    if (idx >= 0) maintenanceOrderList.value.splice(idx, 1)
  }

  function clear() {
    maintenanceOrderList.value = []
  }

  function setAll(items) {
    maintenanceOrderList.value = Array.isArray(items) ? [...items] : []
  }

  return { maintenanceOrderList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-maintenanceOrder',
    storage: localStorage
  }
})
