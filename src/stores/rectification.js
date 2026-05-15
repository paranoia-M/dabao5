import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 整改记录（Rectification）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), hazardId(string), rectificationPlan(string), implementer(string), startDate(date), endDate(date), actualEndDate(date), status(enum), approvalStatus(enum), evidence(array), remarks(string)
 */
export const useRectificationStore = defineStore('rectification', () => {
  const rectificationList = ref([])

  const total = computed(() => rectificationList.value.length)

  function findById(id) {
    return rectificationList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'rectification_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    rectificationList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = rectificationList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      rectificationList.value[idx] = { ...rectificationList.value[idx], ...patch }
      return rectificationList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = rectificationList.value.findIndex(item => item.id === id)
    if (idx >= 0) rectificationList.value.splice(idx, 1)
  }

  function clear() {
    rectificationList.value = []
  }

  function setAll(items) {
    rectificationList.value = Array.isArray(items) ? [...items] : []
  }

  return { rectificationList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-rectification',
    storage: localStorage
  }
})
