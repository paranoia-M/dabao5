import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 模型分类（ModelCategory）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), code(string), parentId(string), sortOrder(number), status(enum), description(string)
 */
export const useModelCategoryStore = defineStore('modelCategory', () => {
  const categoryList = ref([])

  const total = computed(() => categoryList.value.length)

  function findById(id) {
    return categoryList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'modelCategory_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    categoryList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = categoryList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      categoryList.value[idx] = { ...categoryList.value[idx], ...patch }
      return categoryList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = categoryList.value.findIndex(item => item.id === id)
    if (idx >= 0) categoryList.value.splice(idx, 1)
  }

  function clear() {
    categoryList.value = []
  }

  function setAll(items) {
    categoryList.value = Array.isArray(items) ? [...items] : []
  }

  return { categoryList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-modelCategory',
    storage: localStorage
  }
})
