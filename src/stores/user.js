import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户（User）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), username(string), realName(string), email(string), phone(string), role(string), status(enum)
 */
export const useUserStore = defineStore('user', () => {
  const userList = ref([])

  const total = computed(() => userList.value.length)

  function findById(id) {
    return userList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'user_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    userList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = userList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      userList.value[idx] = { ...userList.value[idx], ...patch }
      return userList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = userList.value.findIndex(item => item.id === id)
    if (idx >= 0) userList.value.splice(idx, 1)
  }

  function clear() {
    userList.value = []
  }

  function setAll(items) {
    userList.value = Array.isArray(items) ? [...items] : []
  }

  return { userList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-user',
    storage: localStorage
  }
})
