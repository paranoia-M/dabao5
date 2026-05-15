import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 维护计划（MaintenancePlan）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), equipmentId(string), planType(enum), planTime(datetime), responsible(string), status(enum), description(string)
 */
export const useMaintenancePlanStore = defineStore('maintenancePlan', () => {
  const maintenancePlanList = ref([])

  const total = computed(() => maintenancePlanList.value.length)

  function findById(id) {
    return maintenancePlanList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'maintenancePlan_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    maintenancePlanList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = maintenancePlanList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      maintenancePlanList.value[idx] = { ...maintenancePlanList.value[idx], ...patch }
      return maintenancePlanList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = maintenancePlanList.value.findIndex(item => item.id === id)
    if (idx >= 0) maintenancePlanList.value.splice(idx, 1)
  }

  function clear() {
    maintenancePlanList.value = []
  }

  function setAll(items) {
    maintenancePlanList.value = Array.isArray(items) ? [...items] : []
  }

  return { maintenancePlanList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-maintenancePlan',
    storage: localStorage
  }
})
