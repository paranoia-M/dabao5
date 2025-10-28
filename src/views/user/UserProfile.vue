<template>
  <div class="user-profile-container">
    <el-card class="profile-card" shadow="hover">
      <div class="profile-header">
        <el-avatar :size="80" :src="avatarUrl" class="profile-avatar" />
        <div class="profile-info">
          <h2 class="profile-name">{{ userInfo.name }}</h2>
          <p class="profile-position">{{ userInfo.position }} | {{ userInfo.department }}</p>
          <div class="status-indicator" :class="getRiskLevel()">
            {{ getRiskText() }}
          </div>
        </div>
      </div>

      <el-divider class="custom-divider" />

      <div class="profile-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="工号">
            <el-tag size="small">{{ userInfo.employeeId }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            <span class="contact-info">{{ userInfo.email }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            <span class="contact-info">{{ userInfo.phone }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="入职日期">
            <span class="join-date">{{ userInfo.joinDate }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider class="custom-divider" />

      <div class="profile-actions">
        <el-button type="primary" @click="showEditDialog">
          <span class="button-icon">✏️</span> 编辑信息
        </el-button>
        <el-button @click="showResetPasswordDialog">
          <span class="button-icon">🔄</span> 重置密码
        </el-button>
      </div>
    </el-card>

    <el-card class="stats-card" shadow="hover">
      <div class="stats-header">
        <h3>项目统计</h3>
        <el-tooltip content="项目申报进度监控数据" placement="top">
          <span class="stats-tooltip">ℹ️</span>
        </el-tooltip>
      </div>
      
      <div class="stats-grid">
        <div class="stat-item total">
          <div class="stat-value">{{ stats.totalProjects }}</div>
          <div class="stat-label">总项目数</div>
          <div class="stat-trend">
            <span class="trend-icon">📈</span> +2 本月
          </div>
        </div>
        <div class="stat-item ongoing">
          <div class="stat-value">{{ stats.ongoingProjects }}</div>
          <div class="stat-label">进行中</div>
          <div class="stat-trend">
            <span class="trend-icon">⏱️</span> 平均周期: 23天
          </div>
        </div>
        <div class="stat-item completed">
          <div class="stat-value">{{ stats.completedProjects }}</div>
          <div class="stat-label">已完成</div>
          <div class="stat-trend">
            <span class="trend-icon">✅</span> 成功率: 92%
          </div>
        </div>
        <div class="stat-item delayed">
          <div class="stat-value">{{ stats.delayedProjects }}</div>
          <div class="stat-label">已延期</div>
          <div class="stat-trend warning">
            <span class="trend-icon">⚠️</span> 需关注
          </div>
        </div>
      </div>
      
      <div class="risk-indicator">
        <div class="risk-title">项目风险指数</div>
        <el-progress 
          :percentage="calculateRiskPercentage()" 
          :color="customColors" 
          :show-text="false" 
          class="risk-progress"
        />
        <div class="risk-level">
          当前风险等级: <span :class="getRiskLevel()">{{ getRiskText() }}</span>
        </div>
      </div>
    </el-card>

    <!-- 编辑信息弹窗 -->
    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑个人信息" 
      width="500px"
      center
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="editForm.position" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="editForm.department" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveUserInfo">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog 
      v-model="resetPasswordDialogVisible" 
      title="重置密码" 
      width="400px"
      center
    >
      <el-form :model="passwordForm" label-width="100px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input v-model="passwordForm.currentPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="resetPassword">确认重置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟用户数据
const avatarUrl = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png')
const userInfo = reactive({
  name: '张三',
  position: '项目经理',
  department: '研发部',
  employeeId: 'EMP2023001',
  email: 'zhangsan@company.com',
  phone: '13800138000',
  joinDate: '2020-05-10'
})

// 模拟统计数据
const stats = reactive({
  totalProjects: 24,
  ongoingProjects: 8,
  completedProjects: 14,
  delayedProjects: 2
})

// 弹窗控制
const editDialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)

// 编辑表单
const editForm = reactive({
  name: '',
  position: '',
  department: '',
  email: '',
  phone: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()

// 密码验证规则
const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 风险进度条颜色
const customColors = [
  { color: '#67C23A', percentage: 20 },
  { color: '#E6A23C', percentage: 40 },
  { color: '#F56C6C', percentage: 60 }
]

// 计算风险百分比
const calculateRiskPercentage = () => {
  // 基于延期项目比例计算风险
  const riskRatio = (stats.delayedProjects / stats.totalProjects) * 100
  return Math.min(100, Math.max(0, riskRatio * 3)) // 放大风险系数以便显示
}

// 获取风险等级
const getRiskLevel = () => {
  const percentage = calculateRiskPercentage()
  if (percentage < 30) return 'low-risk'
  if (percentage < 60) return 'medium-risk'
  return 'high-risk'
}

// 获取风险文本
const getRiskText = () => {
  const level = getRiskLevel()
  if (level === 'low-risk') return '低风险'
  if (level === 'medium-risk') return '中风险'
  return '高风险'
}

// 显示编辑对话框
const showEditDialog = () => {
  // 填充当前数据到表单
  Object.assign(editForm, userInfo)
  editDialogVisible.value = true
}

// 保存用户信息
const saveUserInfo = () => {
  // 更新用户信息
  Object.assign(userInfo, editForm)
  editDialogVisible.value = false
  ElMessage.success('个人信息更新成功')
  
  // 这里可以添加API调用
  // updateUserInfo(userInfo).then(...)
}

// 显示重置密码对话框
const showResetPasswordDialog = () => {
  // 重置表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
  
  resetPasswordDialogVisible.value = true
}

// 重置密码
const resetPassword = () => {
  if (!passwordFormRef.value) return
  
  passwordFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟API调用
      setTimeout(() => {
        resetPasswordDialogVisible.value = false
        ElMessage.success('密码重置成功')
      }, 1000)
    } else {
      ElMessage.error('请正确填写表单')
    }
  })
}
</script>

<style lang="scss" scoped>

@use './UserProfile.scss';

</style>