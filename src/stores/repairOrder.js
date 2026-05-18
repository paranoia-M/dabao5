import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 维修工单（RepairOrder）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), title(string), description(string), userId(string), roomId(string), assignedUserId(string), status(enum), priority(enum), createdAt(datetime), completedAt(datetime)
 */
export const useRepairOrderStore = defineStore('repairOrder', () => {
  const repairOrderList = ref([])

  const total = computed(() => repairOrderList.value.length)

  function findById(id) {
    return repairOrderList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'repairOrder_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    repairOrderList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = repairOrderList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      repairOrderList.value[idx] = { ...repairOrderList.value[idx], ...patch }
      return repairOrderList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = repairOrderList.value.findIndex(item => item.id === id)
    if (idx >= 0) repairOrderList.value.splice(idx, 1)
  }

  function clear() {
    repairOrderList.value = []
  }

  function setAll(items) {
    repairOrderList.value = Array.isArray(items) ? [...items] : []
  }

  return { repairOrderList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-repairOrder',
    storage: localStorage
  }
})
