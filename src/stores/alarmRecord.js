import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 报警记录（AlarmRecord）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), equipmentId(string), alarmType(enum), severity(enum), description(string), status(enum), handler(string), handleMethod(string), remark(string), triggerTime(datetime), handledTime(datetime)
 */
export const useAlarmRecordStore = defineStore('alarmRecord', () => {
  const alarmRecordList = ref([])

  const total = computed(() => alarmRecordList.value.length)

  function findById(id) {
    return alarmRecordList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'alarmRecord_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    alarmRecordList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = alarmRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      alarmRecordList.value[idx] = { ...alarmRecordList.value[idx], ...patch }
      return alarmRecordList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = alarmRecordList.value.findIndex(item => item.id === id)
    if (idx >= 0) alarmRecordList.value.splice(idx, 1)
  }

  function clear() {
    alarmRecordList.value = []
  }

  function setAll(items) {
    alarmRecordList.value = Array.isArray(items) ? [...items] : []
  }

  return { alarmRecordList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-alarmRecord',
    storage: localStorage
  }
})
