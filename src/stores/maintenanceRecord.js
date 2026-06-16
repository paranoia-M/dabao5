import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 设备维护记录（MaintenanceRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), deviceId(string), maintenanceType(string), description(string), applicant(string), assignee(string), status(enum), createTime(datetime), finishTime(datetime)
 */
export const useMaintenanceRecordStore = defineStore('maintenanceRecord', () => {
  const maintenanceList = ref([])

  const total = computed(() => maintenanceList.value.length)

  function findById(id) {
    return maintenanceList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'maintenanceRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    maintenanceList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = maintenanceList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      maintenanceList.value[idx] = { ...maintenanceList.value[idx], ...patch }
      return maintenanceList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = maintenanceList.value.findIndex(item => item.id === id)
    if (idx >= 0) maintenanceList.value.splice(idx, 1)
  }

  function clear() {
    maintenanceList.value = []
  }

  function setAll(items) {
    maintenanceList.value = Array.isArray(items) ? [...items] : []
  }

  return { maintenanceList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-maintenanceRecord',
    storage: localStorage
  }
})
