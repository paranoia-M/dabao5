import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 任务设备关联（TaskEquipment）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), taskId(string), equipmentId(string)
 */
export const useTaskEquipmentStore = defineStore('taskEquipment', () => {
  const taskEquipmentList = ref([])

  const total = computed(() => taskEquipmentList.value.length)

  function findById(id) {
    return taskEquipmentList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'taskEquipment_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    taskEquipmentList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = taskEquipmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      taskEquipmentList.value[idx] = { ...taskEquipmentList.value[idx], ...patch }
      return taskEquipmentList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = taskEquipmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) taskEquipmentList.value.splice(idx, 1)
  }

  function clear() {
    taskEquipmentList.value = []
  }

  function setAll(items) {
    taskEquipmentList.value = Array.isArray(items) ? [...items] : []
  }

  return { taskEquipmentList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-taskEquipment',
    storage: localStorage
  }
})
