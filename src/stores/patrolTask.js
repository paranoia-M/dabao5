import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 巡查任务（PatrolTask）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), taskName(string), patrolRoute(string), startTime(datetime), endTime(datetime), assignedPerson(string), status(enum), area(string)
 */
export const usePatrolTaskStore = defineStore('patrolTask', () => {
  const patrolTaskList = ref([])

  const total = computed(() => patrolTaskList.value.length)

  function findById(id) {
    return patrolTaskList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'patrolTask_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    patrolTaskList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = patrolTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      patrolTaskList.value[idx] = { ...patrolTaskList.value[idx], ...patch }
      return patrolTaskList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = patrolTaskList.value.findIndex(item => item.id === id)
    if (idx >= 0) patrolTaskList.value.splice(idx, 1)
  }

  function clear() {
    patrolTaskList.value = []
  }

  function setAll(items) {
    patrolTaskList.value = Array.isArray(items) ? [...items] : []
  }

  return { patrolTaskList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-patrolTask',
    storage: localStorage
  }
})
