import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 质量规则（QualityRule）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), ruleType(enum), targetAssetId(string), status(enum), cronExpression(string), description(string)
 */
export const useQualityRuleStore = defineStore('qualityRule', () => {
  const qualityRuleList = ref([])

  const total = computed(() => qualityRuleList.value.length)

  function findById(id) {
    return qualityRuleList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'qualityRule_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    qualityRuleList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = qualityRuleList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      qualityRuleList.value[idx] = { ...qualityRuleList.value[idx], ...patch }
      return qualityRuleList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = qualityRuleList.value.findIndex(item => item.id === id)
    if (idx >= 0) qualityRuleList.value.splice(idx, 1)
  }

  function clear() {
    qualityRuleList.value = []
  }

  function setAll(items) {
    qualityRuleList.value = Array.isArray(items) ? [...items] : []
  }

  return { qualityRuleList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-qualityRule',
    storage: localStorage
  }
})
