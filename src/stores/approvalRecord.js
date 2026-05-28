import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 审批记录（ApprovalRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), shareRequestId(string), approverId(string), action(enum), comment(string), createdAt(datetime)
 */
export const useApprovalRecordStore = defineStore('approvalRecord', () => {
  const approvalRecordList = ref([])

  const total = computed(() => approvalRecordList.value.length)

  function findById(id) {
    return approvalRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'approvalRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    approvalRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = approvalRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      approvalRecordList.value[idx] = { ...approvalRecordList.value[idx], ...patch }
      return approvalRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = approvalRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) approvalRecordList.value.splice(idx, 1)
  }

  function clear() {
    approvalRecordList.value = []
  }

  function setAll(items) {
    approvalRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { approvalRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-approvalRecord',
    storage: localStorage
  }
})
