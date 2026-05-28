import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 上传记录（UploadRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), modelId(string), userId(string), fileName(string), fileSize(number), format(string), status(enum), versionNumber(string), createdAt(datetime)
 */
export const useUploadRecordStore = defineStore('uploadRecord', () => {
  const uploadRecordList = ref([])

  const total = computed(() => uploadRecordList.value.length)

  function findById(id) {
    return uploadRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'uploadRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    uploadRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = uploadRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      uploadRecordList.value[idx] = { ...uploadRecordList.value[idx], ...patch }
      return uploadRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = uploadRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) uploadRecordList.value.splice(idx, 1)
  }

  function clear() {
    uploadRecordList.value = []
  }

  function setAll(items) {
    uploadRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { uploadRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-uploadRecord',
    storage: localStorage
  }
})
