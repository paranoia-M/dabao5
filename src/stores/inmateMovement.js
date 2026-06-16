import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 人员出入登记（InmateMovement）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), inmateId(string), movementType(enum), direction(enum), recordTime(datetime), status(enum), operator(string)
 */
export const useInmateMovementStore = defineStore('inmateMovement', () => {
  const movementList = ref([])

  const total = computed(() => movementList.value.length)

  function findById(id) {
    return movementList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inmateMovement_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    movementList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = movementList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      movementList.value[idx] = { ...movementList.value[idx], ...patch }
      return movementList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = movementList.value.findIndex(item => item.id === id)
    if (idx >= 0) movementList.value.splice(idx, 1)
  }

  function clear() {
    movementList.value = []
  }

  function setAll(items) {
    movementList.value = Array.isArray(items) ? [...items] : []
  }

  return { movementList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inmateMovement',
    storage: localStorage
  }
})
