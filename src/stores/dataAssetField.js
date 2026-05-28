import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 资产字段（DataAssetField）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), assetId(string), fieldName(string), fieldType(string), description(string), sensitivityLevel(enum), isPrimaryKey(boolean), maxLength(number)
 */
export const useDataAssetFieldStore = defineStore('dataAssetField', () => {
  const dataAssetFieldList = ref([])

  const total = computed(() => dataAssetFieldList.value.length)

  function findById(id) {
    return dataAssetFieldList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dataAssetField_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dataAssetFieldList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dataAssetFieldList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dataAssetFieldList.value[idx] = { ...dataAssetFieldList.value[idx], ...patch }
      return dataAssetFieldList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dataAssetFieldList.value.findIndex(item => item.id === id)
    if (idx >= 0) dataAssetFieldList.value.splice(idx, 1)
  }

  function clear() {
    dataAssetFieldList.value = []
  }

  function setAll(items) {
    dataAssetFieldList.value = Array.isArray(items) ? [...items] : []
  }

  return { dataAssetFieldList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dataAssetField',
    storage: localStorage
  }
})
