import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 看板配置（DashboardConfig）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), cardType(enum), position(number), timeRange(enum), settings(object)
 */
export const useDashboardConfigStore = defineStore('dashboardConfig', () => {
  const dashboardConfigList = ref([])

  const total = computed(() => dashboardConfigList.value.length)

  function findById(id) {
    return dashboardConfigList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'dashboardConfig_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    dashboardConfigList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = dashboardConfigList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      dashboardConfigList.value[idx] = { ...dashboardConfigList.value[idx], ...patch }
      return dashboardConfigList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = dashboardConfigList.value.findIndex(item => item.id === id)
    if (idx >= 0) dashboardConfigList.value.splice(idx, 1)
  }

  function clear() {
    dashboardConfigList.value = []
  }

  function setAll(items) {
    dashboardConfigList.value = Array.isArray(items) ? [...items] : []
  }

  return { dashboardConfigList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-dashboardConfig',
    storage: localStorage
  }
})
