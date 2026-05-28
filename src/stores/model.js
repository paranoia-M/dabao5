import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 模型（Model）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), code(string), categoryId(string), format(enum), status(enum), tags(array), description(string), fileSize(number), uploaderId(string), createdAt(datetime), updatedAt(datetime)
 */
export const useModelStore = defineStore('model', () => {
  const modelList = ref([])

  const total = computed(() => modelList.value.length)

  function findById(id) {
    return modelList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'model_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    modelList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = modelList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      modelList.value[idx] = { ...modelList.value[idx], ...patch }
      return modelList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = modelList.value.findIndex(item => item.id === id)
    if (idx >= 0) modelList.value.splice(idx, 1)
  }

  function clear() {
    modelList.value = []
  }

  function setAll(items) {
    modelList.value = Array.isArray(items) ? [...items] : []
  }

  return { modelList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-model',
    storage: localStorage
  }
})
