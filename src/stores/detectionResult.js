import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 检测结果（DetectionResult）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), ruleId(string), executionTime(datetime), score(number), passed(boolean), errorCount(number), errorDetails(array), status(enum)
 */
export const useDetectionResultStore = defineStore('detectionResult', () => {
  const detectionResultList = ref([])

  const total = computed(() => detectionResultList.value.length)

  function findById(id) {
    return detectionResultList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'detectionResult_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    detectionResultList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = detectionResultList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      detectionResultList.value[idx] = { ...detectionResultList.value[idx], ...patch }
      return detectionResultList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = detectionResultList.value.findIndex(item => item.id === id)
    if (idx >= 0) detectionResultList.value.splice(idx, 1)
  }

  function clear() {
    detectionResultList.value = []
  }

  function setAll(items) {
    detectionResultList.value = Array.isArray(items) ? [...items] : []
  }

  return { detectionResultList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-detectionResult',
    storage: localStorage
  }
})
