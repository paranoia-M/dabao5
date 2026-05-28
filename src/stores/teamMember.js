import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 团队成员（TeamMember）store —— 跨菜单数据流通，所有页面通过本 store 读写数据
 * 字段：id(string), userId(string), name(string), email(string), role(enum), status(enum), joinedAt(datetime), contributionCount(number)
 */
export const useTeamMemberStore = defineStore('teamMember', () => {
  const memberList = ref([])

  const total = computed(() => memberList.value.length)

  function findById(id) {
    return memberList.value.find(item => item.id === id)
  }

  function add(item) {
    if (!item.id) item.id = 'teamMember_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
    memberList.value.push({ ...item })
    return item
  }

  function update(id, patch) {
    const idx = memberList.value.findIndex(item => item.id === id)
    if (idx >= 0) {
      memberList.value[idx] = { ...memberList.value[idx], ...patch }
      return memberList.value[idx]
    }
    return null
  }

  function remove(id) {
    const idx = memberList.value.findIndex(item => item.id === id)
    if (idx >= 0) memberList.value.splice(idx, 1)
  }

  function clear() {
    memberList.value = []
  }

  function setAll(items) {
    memberList.value = Array.isArray(items) ? [...items] : []
  }

  return { memberList, total, findById, add, update, remove, clear, setAll }
}, {
  persist: {
    key: 'sheji-teamMember',
    storage: localStorage
  }
})
