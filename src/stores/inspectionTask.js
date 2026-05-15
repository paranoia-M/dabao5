import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 排查任务（InspectionTask）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), title(string), description(string), taskType(enum), status(enum), startDate(date), endDate(date), assignee(string), createdBy(string), createTime(datetime)
 */
export const useInspectionTaskStore = defineStore('inspectionTask', () => {
  const inspectionTaskList = ref([])

  const total = computed(() => inspectionTaskList.value.length)

  function findById(id) {
    return inspectionTaskList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inspectionTask_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    inspectionTaskList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = inspectionTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      inspectionTaskList.value[idx] = { ...inspectionTaskList.value[idx], ...patch }
      return inspectionTaskList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = inspectionTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) inspectionTaskList.value.splice(idx, 1)
  }

  function clear() {
    inspectionTaskList.value = []
  }

  function setAll(items) {
    inspectionTaskList.value = Array.isArray(items) ? [...items] : []
  }

  return { inspectionTaskList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inspectionTask',
    storage: localStorage
  }
})
