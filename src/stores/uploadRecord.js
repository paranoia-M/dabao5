import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 上传记录（UploadRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), inmateId(string), fileName(string), fileUrl(string), fileSize(number), uploadTime(datetime), uploader(string)
 */
export const useUploadRecordStore = defineStore('uploadRecord', () => {
  const uploadList = ref([])

  const total = computed(() => uploadList.value.length)

  function findById(id) {
    return uploadList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'uploadRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    uploadList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = uploadList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      uploadList.value[idx] = { ...uploadList.value[idx], ...patch }
      return uploadList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = uploadList.value.findIndex(item => item.id === id)
    if (idx >= 0) uploadList.value.splice(idx, 1)
  }

  function clear() {
    uploadList.value = []
  }

  function setAll(items) {
    uploadList.value = Array.isArray(items) ? [...items] : []
  }

  return { uploadList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-uploadRecord',
    storage: localStorage
  }
})
