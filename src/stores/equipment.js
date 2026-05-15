import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 设备（Equipment）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), model(string), type(enum), productionLineId(string), status(enum), healthScore(number), installDate(date)
 */
export const useEquipmentStore = defineStore('equipment', () => {
  const equipmentList = ref([])

  const total = computed(() => equipmentList.value.length)

  function findById(id) {
    return equipmentList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'equipment_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    equipmentList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = equipmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      equipmentList.value[idx] = { ...equipmentList.value[idx], ...patch }
      return equipmentList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = equipmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) equipmentList.value.splice(idx, 1)
  }

  function clear() {
    equipmentList.value = []
  }

  function setAll(items) {
    equipmentList.value = Array.isArray(items) ? [...items] : []
  }

  return { equipmentList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-equipment',
    storage: localStorage
  }
})
