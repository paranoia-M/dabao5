
<template>
  <el-card shadow="hover" class="stat-card" :style="{ borderLeft: `4px solid ${color}` }">
    <div class="card-content">
      <div class="icon-container" :style="{ backgroundColor: color + '20' }">
        <component :is="icon" :style="{ color: color }" />
      </div>
      <div class="text-container">
        <div class="title">{{ title }}</div>
        <div class="value">{{ value }}</div>
        <el-button 
          v-if="showAction" 
          type="text" 
          @click="handleAction"
          class="action-btn"
        >
          查看详情
        </el-button>
      </div>
    </div>
    
    <el-dialog
      v-model="dialogVisible"
      :title="`${title}详情`"
      width="50%"
      center
    >
      <div class="security-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(value)">{{ value }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最后检测时间">{{ lastCheckTime }}</el-descriptions-item>
          <el-descriptions-item label="安全建议">{{ securityAdvice }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSecurityFix">立即修复</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  icon: {
    type: Object,
    required: true
  },
  color: {
    type: String,
    default: '#409EFF'
  },
  showAction: {
    type: Boolean,
    default: true
  }
})

const dialogVisible = ref(false)
const lastCheckTime = ref(new Date().toLocaleString())
const securityAdvice = computed(() => {
  if (typeof props.value === 'number') {
    return props.value > 80 
      ? '当前安全状态良好，建议定期检查' 
      : '存在安全隐患，建议立即处理'
  }
  return '请根据实际情况进行安全配置检查'
})

const getStatusType = (value) => {
  if (typeof value === 'number') {
    return value > 80 ? 'success' : 'warning'
  }
  return 'info'
}

const handleAction = () => {
  dialogVisible.value = true
  console.log(`查看${props.title}详情`)
}

const handleSecurityFix = () => {
  ElMessage.success(`正在修复${props.title}安全问题...`)
  setTimeout(() => {
    ElMessage.success(`${props.title}安全问题已修复`)
    dialogVisible.value = false
  }, 1500)
}
</script>

<style lang="scss" scoped>

@use './Dashboard.scss';

</style>
    