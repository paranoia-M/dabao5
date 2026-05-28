import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 收藏资产（DataAssetFavorite）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), assetId(string), createdAt(datetime)
 */
export const useDataAssetFavoriteStore = defineStore('dataAssetFavorite', () => {
  const favoriteList = ref([])

  const total = computed(() => favoriteList.value.length)

  function findById(id) {
    return favoriteList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dataAssetFavorite_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    favoriteList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = favoriteList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      favoriteList.value[idx] = { ...favoriteList.value[idx], ...patch }
      return favoriteList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = favoriteList.value.findIndex(item => item.id === id)
    if (idx >= 0) favoriteList.value.splice(idx, 1)
  }

  function clear() {
    favoriteList.value = []
  }

  function setAll(items) {
    favoriteList.value = Array.isArray(items) ? [...items] : []
  }

  return { favoriteList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dataAssetFavorite',
    storage: localStorage
  }
})
