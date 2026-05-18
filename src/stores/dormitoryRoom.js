import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 宿舍房间（DormitoryRoom）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), blockId(string), roomNumber(string), categoryId(string), floor(number), capacity(number), currentOccupancy(number), status(enum)
 */
export const useDormitoryRoomStore = defineStore('dormitoryRoom', () => {
  const dormitoryRoomList = ref([])

  const total = computed(() => dormitoryRoomList.value.length)

  function findById(id) {
    return dormitoryRoomList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dormitoryRoom_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dormitoryRoomList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dormitoryRoomList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dormitoryRoomList.value[idx] = { ...dormitoryRoomList.value[idx], ...patch }
      return dormitoryRoomList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dormitoryRoomList.value.findIndex(item => item.id === id)
    if (idx >= 0) dormitoryRoomList.value.splice(idx, 1)
  }

  function clear() {
    dormitoryRoomList.value = []
  }

  function setAll(items) {
    dormitoryRoomList.value = Array.isArray(items) ? [...items] : []
  }

  return { dormitoryRoomList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dormitoryRoom',
    storage: localStorage
  }
})
