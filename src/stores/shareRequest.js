import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 共享请求（ShareRequest）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), modelId(string), applicantId(string), applicantName(string), reason(string), status(enum), approverId(string), approvedAt(datetime), createdAt(datetime)
 */
export const useShareRequestStore = defineStore('shareRequest', () => {
  const shareRequestList = ref([])

  const total = computed(() => shareRequestList.value.length)

  function findById(id) {
    return shareRequestList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'shareRequest_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    shareRequestList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = shareRequestList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      shareRequestList.value[idx] = { ...shareRequestList.value[idx], ...patch }
      return shareRequestList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = shareRequestList.value.findIndex(item => item.id === id)
    if (idx >= 0) shareRequestList.value.splice(idx, 1)
  }

  function clear() {
    shareRequestList.value = []
  }

  function setAll(items) {
    shareRequestList.value = Array.isArray(items) ? [...items] : []
  }

  return { shareRequestList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-shareRequest',
    storage: localStorage
  }
})
