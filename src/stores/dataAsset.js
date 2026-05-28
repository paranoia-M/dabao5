import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 数据资产（DataAsset）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), code(string), domain(string), sourceType(enum), ownerId(string), status(enum), description(string)
 */
export const useDataAssetStore = defineStore('dataAsset', () => {
  const dataAssetList = ref([])

  const total = computed(() => dataAssetList.value.length)

  function findById(id) {
    return dataAssetList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dataAsset_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dataAssetList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dataAssetList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dataAssetList.value[idx] = { ...dataAssetList.value[idx], ...patch }
      return dataAssetList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dataAssetList.value.findIndex(item => item.id === id)
    if (idx >= 0) dataAssetList.value.splice(idx, 1)
  }

  function clear() {
    dataAssetList.value = []
  }

  function setAll(items) {
    dataAssetList.value = Array.isArray(items) ? [...items] : []
  }

  return { dataAssetList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dataAsset',
    storage: localStorage
  }
})
