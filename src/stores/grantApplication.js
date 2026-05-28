import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 授权申请（GrantApplication）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), applicantId(string), apiId(string), reason(string), status(enum), createdAt(datetime), updatedAt(datetime)
 */
export const useGrantApplicationStore = defineStore('grantApplication', () => {
  const grantApplicationList = ref([])

  const total = computed(() => grantApplicationList.value.length)

  function findById(id) {
    return grantApplicationList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'grantApplication_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    grantApplicationList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = grantApplicationList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      grantApplicationList.value[idx] = { ...grantApplicationList.value[idx], ...patch }
      return grantApplicationList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = grantApplicationList.value.findIndex(item => item.id === id)
    if (idx >= 0) grantApplicationList.value.splice(idx, 1)
  }

  function clear() {
    grantApplicationList.value = []
  }

  function setAll(items) {
    grantApplicationList.value = Array.isArray(items) ? [...items] : []
  }

  return { grantApplicationList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-grantApplication',
    storage: localStorage
  }
})
