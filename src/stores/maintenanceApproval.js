import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 设备维护审批记录（MaintenanceApproval）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), maintenanceId(string), action(enum), operator(string), operateTime(datetime), comment(string), previousStatus(string), newStatus(string)
 */
export const useMaintenanceApprovalStore = defineStore('maintenanceApproval', () => {
  const maintenanceApprovalList = ref([])

  const total = computed(() => maintenanceApprovalList.value.length)

  function findById(id) {
    return maintenanceApprovalList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'maintenanceApproval_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    maintenanceApprovalList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = maintenanceApprovalList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      maintenanceApprovalList.value[idx] = { ...maintenanceApprovalList.value[idx], ...patch }
      return maintenanceApprovalList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = maintenanceApprovalList.value.findIndex(item => item.id === id)
    if (idx >= 0) maintenanceApprovalList.value.splice(idx, 1)
  }

  function clear() {
    maintenanceApprovalList.value = []
  }

  function setAll(items) {
    maintenanceApprovalList.value = Array.isArray(items) ? [...items] : []
  }

  return { maintenanceApprovalList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-maintenanceApproval',
    storage: localStorage
  }
})
