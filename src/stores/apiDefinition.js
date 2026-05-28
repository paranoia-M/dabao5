import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * API定义（ApiDefinition）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), path(string), method(enum), requestParams(array), responseFormat(object), status(enum), version(string)
 */
export const useApiDefinitionStore = defineStore('apiDefinition', () => {
  const apiDefinitionList = ref([])

  const total = computed(() => apiDefinitionList.value.length)

  function findById(id) {
    return apiDefinitionList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'apiDefinition_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    apiDefinitionList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = apiDefinitionList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      apiDefinitionList.value[idx] = { ...apiDefinitionList.value[idx], ...patch }
      return apiDefinitionList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = apiDefinitionList.value.findIndex(item => item.id === id)
    if (idx >= 0) apiDefinitionList.value.splice(idx, 1)
  }

  function clear() {
    apiDefinitionList.value = []
  }

  function setAll(items) {
    apiDefinitionList.value = Array.isArray(items) ? [...items] : []
  }

  return { apiDefinitionList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-apiDefinition',
    storage: localStorage
  }
})
