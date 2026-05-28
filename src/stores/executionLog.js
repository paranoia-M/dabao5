import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 执行日志（ExecutionLog）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), planId(string), startTime(datetime), endTime(datetime), status(enum), logContent(string)
 */
export const useExecutionLogStore = defineStore('executionLog', () => {
  const executionLogList = ref([])

  const total = computed(() => executionLogList.value.length)

  function findById(id) {
    return executionLogList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'executionLog_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    executionLogList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = executionLogList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      executionLogList.value[idx] = { ...executionLogList.value[idx], ...patch }
      return executionLogList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = executionLogList.value.findIndex(item => item.id === id)
    if (idx >= 0) executionLogList.value.splice(idx, 1)
  }

  function clear() {
    executionLogList.value = []
  }

  function setAll(items) {
    executionLogList.value = Array.isArray(items) ? [...items] : []
  }

  return { executionLogList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-executionLog',
    storage: localStorage
  }
})
