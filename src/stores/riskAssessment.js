import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 风险评估（RiskAssessment）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), hazardId(string), equipmentId(string), riskType(enum), assessmentMethod(string), severity(enum), probability(enum), riskLevel(enum), controlMeasures(string), assessmentDate(date), assessor(string), status(enum)
 */
export const useRiskAssessmentStore = defineStore('riskAssessment', () => {
  const riskAssessmentList = ref([])

  const total = computed(() => riskAssessmentList.value.length)

  function findById(id) {
    return riskAssessmentList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'riskAssessment_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    riskAssessmentList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = riskAssessmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      riskAssessmentList.value[idx] = { ...riskAssessmentList.value[idx], ...patch }
      return riskAssessmentList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = riskAssessmentList.value.findIndex(item => item.id === id)
    if (idx >= 0) riskAssessmentList.value.splice(idx, 1)
  }

  function clear() {
    riskAssessmentList.value = []
  }

  function setAll(items) {
    riskAssessmentList.value = Array.isArray(items) ? [...items] : []
  }

  return { riskAssessmentList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-riskAssessment',
    storage: localStorage
  }
})
