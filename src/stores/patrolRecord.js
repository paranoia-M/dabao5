import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 巡查记录（PatrolRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), taskId(string), patrolPerson(string), patrolTime(datetime), area(string), abnormal(boolean), description(string), status(enum)
 */
export const usePatrolRecordStore = defineStore('patrolRecord', () => {
  const patrolRecordList = ref([])

  const total = computed(() => patrolRecordList.value.length)

  function findById(id) {
    return patrolRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'patrolRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    patrolRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = patrolRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      patrolRecordList.value[idx] = { ...patrolRecordList.value[idx], ...patch }
      return patrolRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = patrolRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) patrolRecordList.value.splice(idx, 1)
  }

  function clear() {
    patrolRecordList.value = []
  }

  function setAll(items) {
    patrolRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { patrolRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-patrolRecord',
    storage: localStorage
  }
})
