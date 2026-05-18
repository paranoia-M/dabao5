import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 宿舍楼栋（DormitoryBlock）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), code(string), floorCount(number), roomsPerFloor(number), enabled(boolean), createdAt(datetime), updatedAt(datetime)
 */
export const useDormitoryBlockStore = defineStore('dormitoryBlock', () => {
  const dormitoryBlockList = ref([])

  const total = computed(() => dormitoryBlockList.value.length)

  function findById(id) {
    return dormitoryBlockList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dormitoryBlock_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dormitoryBlockList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dormitoryBlockList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dormitoryBlockList.value[idx] = { ...dormitoryBlockList.value[idx], ...patch }
      return dormitoryBlockList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dormitoryBlockList.value.findIndex(item => item.id === id)
    if (idx >= 0) dormitoryBlockList.value.splice(idx, 1)
  }

  function clear() {
    dormitoryBlockList.value = []
  }

  function setAll(items) {
    dormitoryBlockList.value = Array.isArray(items) ? [...items] : []
  }

  return { dormitoryBlockList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dormitoryBlock',
    storage: localStorage
  }
})
