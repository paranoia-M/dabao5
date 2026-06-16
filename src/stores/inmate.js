import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 在押人员（Inmate）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), name(string), gender(enum), age(number), idCard(string), caseType(string), status(enum), admissionDate(date), cellNumber(string), photoUrl(string)
 */
export const useInmateStore = defineStore('inmate', () => {
  const inmateList = ref([])

  const total = computed(() => inmateList.value.length)

  function findById(id) {
    return inmateList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'inmate_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    inmateList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = inmateList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      inmateList.value[idx] = { ...inmateList.value[idx], ...patch }
      return inmateList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = inmateList.value.findIndex(item => item.id === id)
    if (idx >= 0) inmateList.value.splice(idx, 1)
  }

  function clear() {
    inmateList.value = []
  }

  function setAll(items) {
    inmateList.value = Array.isArray(items) ? [...items] : []
  }

  return { inmateList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-inmate',
    storage: localStorage
  }
})
