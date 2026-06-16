import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 设备（Device）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), deviceName(string), deviceType(enum), location(string), status(enum), manufacturer(string), installDate(date), lastMaintenanceDate(date)
 */
export const useDeviceStore = defineStore('device', () => {
  const deviceList = ref([])

  const total = computed(() => deviceList.value.length)

  function findById(id) {
    return deviceList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'device_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    deviceList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = deviceList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      deviceList.value[idx] = { ...deviceList.value[idx], ...patch }
      return deviceList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = deviceList.value.findIndex(item => item.id === id)
    if (idx >= 0) deviceList.value.splice(idx, 1)
  }

  function clear() {
    deviceList.value = []
  }

  function setAll(items) {
    deviceList.value = Array.isArray(items) ? [...items] : []
  }

  return { deviceList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-device',
    storage: localStorage
  }
})
