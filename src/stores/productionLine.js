import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 生产线（ProductionLine）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), status(enum), location(string), manager(string), description(string)
 */
export const useProductionLineStore = defineStore('productionLine', () => {
  const productionLineList = ref([])

  const total = computed(() => productionLineList.value.length)

  function findById(id) {
    return productionLineList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'productionLine_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    productionLineList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = productionLineList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      productionLineList.value[idx] = { ...productionLineList.value[idx], ...patch }
      return productionLineList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = productionLineList.value.findIndex(item => item.id === id)
    if (idx >= 0) productionLineList.value.splice(idx, 1)
  }

  function clear() {
    productionLineList.value = []
  }

  function setAll(items) {
    productionLineList.value = Array.isArray(items) ? [...items] : []
  }

  return { productionLineList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-productionLine',
    storage: localStorage
  }
})
