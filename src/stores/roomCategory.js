import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 房间类型（RoomCategory）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), capacity(number), status(enum), description(string)
 */
export const useRoomCategoryStore = defineStore('roomCategory', () => {
  const roomCategoryList = ref([])

  const total = computed(() => roomCategoryList.value.length)

  function findById(id) {
    return roomCategoryList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'roomCategory_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    roomCategoryList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = roomCategoryList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      roomCategoryList.value[idx] = { ...roomCategoryList.value[idx], ...patch }
      return roomCategoryList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = roomCategoryList.value.findIndex(item => item.id === id)
    if (idx >= 0) roomCategoryList.value.splice(idx, 1)
  }

  function clear() {
    roomCategoryList.value = []
  }

  function setAll(items) {
    roomCategoryList.value = Array.isArray(items) ? [...items] : []
  }

  return { roomCategoryList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-roomCategory',
    storage: localStorage
  }
})
