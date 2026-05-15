import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测任务（DetectTask）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), sampleId(string), assignee(string), status(enum), priority(enum), createDate(datetime), dueDate(date), remark(string)
 */
export const useDetectTaskStore = defineStore('detectTask', () => {
  const detectTaskList = ref([])

  const total = computed(() => detectTaskList.value.length)

  function findById(id) {
    return detectTaskList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'detectTask_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    detectTaskList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = detectTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      detectTaskList.value[idx] = { ...detectTaskList.value[idx], ...patch }
      return detectTaskList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = detectTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) detectTaskList.value.splice(idx, 1)
  }

  function clear() {
    detectTaskList.value = []
  }

  function setAll(items) {
    detectTaskList.value = Array.isArray(items) ? [...items] : []
  }

  return { detectTaskList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-detectTask',
    storage: localStorage
  }
})
