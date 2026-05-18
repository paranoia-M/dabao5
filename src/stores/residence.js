import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 住宿记录（Residence）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), roomId(string), bedNumber(number), moveInDate(date), moveOutDate(date), status(enum)
 */
export const useResidenceStore = defineStore('residence', () => {
  const residenceList = ref([])

  const total = computed(() => residenceList.value.length)

  function findById(id) {
    return residenceList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'residence_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    residenceList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = residenceList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      residenceList.value[idx] = { ...residenceList.value[idx], ...patch }
      return residenceList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = residenceList.value.findIndex(item => item.id === id)
    if (idx >= 0) residenceList.value.splice(idx, 1)
  }

  function clear() {
    residenceList.value = []
  }

  function setAll(items) {
    residenceList.value = Array.isArray(items) ? [...items] : []
  }

  return { residenceList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-residence',
    storage: localStorage
  }
})
