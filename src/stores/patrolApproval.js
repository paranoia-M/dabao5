import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 巡查任务审批记录（PatrolApproval）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), patrolTaskId(string), action(enum), operator(string), operateTime(datetime), comment(string), previousStatus(string), newStatus(string)
 */
export const usePatrolApprovalStore = defineStore('patrolApproval', () => {
  const patrolApprovalList = ref([])

  const total = computed(() => patrolApprovalList.value.length)

  function findById(id) {
    return patrolApprovalList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'patrolApproval_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    patrolApprovalList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = patrolApprovalList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      patrolApprovalList.value[idx] = { ...patrolApprovalList.value[idx], ...patch }
      return patrolApprovalList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = patrolApprovalList.value.findIndex(item => item.id === id)
    if (idx >= 0) patrolApprovalList.value.splice(idx, 1)
  }

  function clear() {
    patrolApprovalList.value = []
  }

  function setAll(items) {
    patrolApprovalList.value = Array.isArray(items) ? [...items] : []
  }

  return { patrolApprovalList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-patrolApproval',
    storage: localStorage
  }
})
