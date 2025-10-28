<template>
  <div class="system-settings">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2><span class="header-icon">⚙️</span>系统设置</h2>
          <el-button type="primary" @click="saveSettings">
            <span class="button-icon">💾</span>保存设置
          </el-button>
        </div>
      </template>
      
      <el-form :model="settingsForm" label-width="180px" :rules="rules">
        <el-divider content-position="left">
          <span class="divider-icon">📋</span>基本设置
        </el-divider>
        
        <el-form-item label="系统名称" prop="systemName">
          <el-input v-model="settingsForm.systemName" placeholder="请输入系统名称" />
          <div class="form-tip">航清智能项目实时追踪及进度提醒软件的名称</div>
        </el-form-item>
        
        <el-form-item label="系统版本" prop="version">
          <el-input v-model="settingsForm.version" placeholder="请输入系统版本号" />
          <div class="form-tip">当前系统版本号，用于标识系统更新状态</div>
        </el-form-item>
        
        <el-form-item label="管理员邮箱" prop="adminEmail">
          <el-input v-model="settingsForm.adminEmail" placeholder="请输入管理员邮箱" />
          <div class="form-tip">用于接收系统预警和进度通知的邮箱</div>
        </el-form-item>
        
        <el-divider content-position="left">
          <span class="divider-icon">🔔</span>通知设置
        </el-divider>
        
        <el-form-item label="启用邮件通知">
          <el-switch v-model="settingsForm.emailNotifications" />
          <div class="form-tip">开启后，系统将发送项目进度和风险预警邮件</div>
        </el-form-item>
        
        <el-form-item label="启用风险预警" v-if="settingsForm.emailNotifications">
          <el-switch v-model="settingsForm.riskAlerts" />
          <div class="form-tip">开启后，系统将监控项目风险并发送预警通知</div>
        </el-form-item>
        
        <el-form-item label="预警阈值" prop="alertThreshold" v-if="settingsForm.emailNotifications && settingsForm.riskAlerts">
          <div class="threshold-container">
            <el-slider v-model="settingsForm.alertThreshold" :min="0" :max="100" :step="5" show-input />
            <div class="threshold-indicator">
              <span :class="['risk-level', 
                settingsForm.alertThreshold <= 30 ? 'low-risk' : 
                settingsForm.alertThreshold <= 70 ? 'medium-risk' : 'high-risk'
              ]">
                {{ settingsForm.alertThreshold <= 30 ? '低风险' : 
                   settingsForm.alertThreshold <= 70 ? '中风险' : '高风险' }}
              </span>
            </div>
          </div>
          <div class="form-tip">设置项目风险预警的阈值，超过此值将触发预警通知</div>
        </el-form-item>
        
        <el-divider content-position="left">
          <span class="divider-icon">🎨</span>显示设置
        </el-divider>
        
        <el-form-item label="每页显示项目数">
          <el-select v-model="settingsForm.itemsPerPage" placeholder="请选择">
            <el-option label="10条" :value="10" />
            <el-option label="20条" :value="20" />
            <el-option label="50条" :value="50" />
          </el-select>
          <div class="form-tip">控制项目列表页面显示的项目数量</div>
        </el-form-item>
        
        <el-form-item label="默认主题">
          <el-radio-group v-model="settingsForm.theme">
            <el-radio label="light">
              <span class="theme-option">🌞 浅色</span>
            </el-radio>
            <el-radio label="auto">
              <span class="theme-option">🔄 自动</span>
            </el-radio>
          </el-radio-group>
          <div class="form-tip">选择系统界面主题风格</div>
        </el-form-item>
        
        <el-form-item label="数据备份">
          <el-button @click="showBackupDialog" type="warning">
            <span class="button-icon">📦</span>立即备份
          </el-button>
          <div class="form-tip">备份系统设置和项目数据，防止数据丢失</div>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 保存成功提示 -->
    <el-dialog
      v-model="saveSuccessVisible"
      title="提示"
      width="30%"
      center
    >
      <div class="success-dialog">
        <div class="success-icon">✅</div>
        <h3>系统设置已成功保存！</h3>
        <p>您的项目监控与预警设置已更新，将应用于整个系统。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveSuccessVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 备份对话框 -->
    <el-dialog
      v-model="backupDialogVisible"
      title="数据备份"
      width="40%"
    >
      <div class="backup-dialog">
        <div class="backup-icon">📦</div>
        <h3>确认备份系统数据？</h3>
        <p>这将备份所有系统设置和项目数据，备份文件将保存在服务器上。</p>
        <el-form label-width="120px">
          <el-form-item label="备份名称">
            <el-input v-model="backupName" placeholder="请输入备份名称" />
          </el-form-item>
          <el-form-item label="包含内容">
            <el-checkbox-group v-model="backupOptions">
              <el-checkbox label="system">系统设置</el-checkbox>
              <el-checkbox label="projects">项目数据</el-checkbox>
              <el-checkbox label="users">用户信息</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="backupDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="performBackup">开始备份</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const settingsForm = reactive({
  systemName: '航清智能项目实时追踪及进度提醒软件',
  version: 'v2.1.0',
  adminEmail: 'admin@example.com',
  emailNotifications: true,
  riskAlerts: true,
  alertThreshold: 70,
  itemsPerPage: 20,
  theme: 'light'
})

// 表单验证规则
const rules = reactive({
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' }
  ],
  version: [
    { required: true, message: '请输入系统版本', trigger: 'blur' }
  ],
  adminEmail: [
    { required: true, message: '请输入管理员邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  alertThreshold: [
    { required: true, message: '请设置预警阈值', trigger: 'change' }
  ]
})

// 保存成功对话框显示状态
const saveSuccessVisible = ref(false)

// 备份对话框相关状态
const backupDialogVisible = ref(false)
const backupName = ref('')
const backupOptions = ref(['system', 'projects', 'users'])

// 显示备份对话框
const showBackupDialog = () => {
  backupName.value = `备份_${new Date().toLocaleDateString().replace(/\//g, '-')}`
  backupDialogVisible.value = true
}

// 执行备份操作
const performBackup = () => {
  // 模拟备份操作
  ElMessage.success(`备份成功: ${backupName.value}`)
  backupDialogVisible.value = false
}

// 保存设置
const saveSettings = () => {
  // 模拟保存操作
  setTimeout(() => {
    saveSuccessVisible.value = true
    ElMessage.success('设置保存成功')
  }, 800)
}

// 模拟加载设置数据
onMounted(() => {
  // 模拟从服务器加载设置数据
  setTimeout(() => {
    // 这里可以添加实际的数据加载逻辑
    console.log('设置数据加载完成')
  }, 500)
})
</script>

<style lang="scss" scoped>

@use './SystemSettings.scss';

</style>