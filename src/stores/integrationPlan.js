import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 集成计划（IntegrationPlan）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), taskType(enum), cronExpression(string), dependencies(array), retryPolicy(object), status(enum), description(string)
 */
export const useIntegrationPlanStore = defineStore('integrationPlan', () => {
  const integrationPlanList = ref([])

  const total = computed(() => integrationPlanList.value.length)

  function findById(id) {
    return integrationPlanList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'integrationPlan_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    integrationPlanList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = integrationPlanList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      integrationPlanList.value[idx] = { ...integrationPlanList.value[idx], ...patch }
      return integrationPlanList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = integrationPlanList.value.findIndex(item => item.id === id)
    if (idx >= 0) integrationPlanList.value.splice(idx, 1)
  }

  function clear() {
    integrationPlanList.value = []
  }

  function setAll(items) {
    integrationPlanList.value = Array.isArray(items) ? [...items] : []
  }

  return { integrationPlanList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-integrationPlan',
    storage: localStorage
  }
})
