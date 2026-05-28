import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 模型版本（ModelVersion）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), modelId(string), versionNumber(string), filePath(string), fileSize(number), notes(string), uploaderId(string), createdAt(datetime), isCurrent(boolean)
 */
export const useModelVersionStore = defineStore('modelVersion', () => {
  const versionList = ref([])

  const total = computed(() => versionList.value.length)

  function findById(id) {
    return versionList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'modelVersion_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    versionList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = versionList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      versionList.value[idx] = { ...versionList.value[idx], ...patch }
      return versionList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = versionList.value.findIndex(item => item.id === id)
    if (idx >= 0) versionList.value.splice(idx, 1)
  }

  function clear() {
    versionList.value = []
  }

  function setAll(items) {
    versionList.value = Array.isArray(items) ? [...items] : []
  }

  return { versionList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-modelVersion',
    storage: localStorage
  }
})
