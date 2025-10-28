<template>
  <div class="project-edit-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <h2><i class="header-icon">📝</i>政策项目申报材料编辑</h2>
          <el-button type="primary" @click="saveDraft">
            <i class="btn-icon">💾</i>保存草稿
          </el-button>
        </div>
      </template>
      
      <el-form :model="formData" :rules="formRules" label-width="120px" label-position="top">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="项目名称" prop="name" class="form-item-enhanced">
              <el-input v-model="formData.name" placeholder="请输入项目名称" />
              <div class="form-tip">请填写准确的项目名称，便于后续审核</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="申报类型" prop="type" class="form-item-enhanced">
              <el-select v-model="formData.type" placeholder="请选择申报类型">
                <el-option 
                  v-for="item in projectTypes" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
              <div class="form-tip">选择最符合项目特点的申报类型</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="项目描述" prop="description" class="form-item-enhanced">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入项目详细描述，包括项目背景、目标、实施方案等" 
          />
          <div class="form-tip">详细描述有助于提高申报成功率，建议不少于200字</div>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-form-item label="开始日期" prop="startDate" class="form-item-enhanced">
              <el-date-picker 
                v-model="formData.startDate" 
                type="date" 
                placeholder="选择开始日期" 
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="结束日期" prop="endDate" class="form-item-enhanced">
              <el-date-picker 
                v-model="formData.endDate" 
                type="date" 
                placeholder="选择结束日期" 
                style="width: 100%" 
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="预算(万元)" prop="budget" class="form-item-enhanced">
              <el-input-number 
                v-model="formData.budget" 
                :min="0" 
                :step="0.1" 
                controls-position="right" 
                style="width: 100%" 
              />
              <div class="form-tip">请根据实际需求合理规划预算</div>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="项目负责人" prop="leader" class="form-item-enhanced">
          <el-input v-model="formData.leader" placeholder="请输入项目负责人姓名" />
          <div class="form-tip">负责人将作为项目主要联系人</div>
        </el-form-item>
        
        <el-form-item label="团队成员" prop="teamMembers" class="form-item-enhanced">
          <el-select 
            v-model="formData.teamMembers" 
            multiple 
            filterable 
            allow-create 
            default-first-option 
            placeholder="请输入团队成员姓名" 
          >
            <el-option 
              v-for="item in teamOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
          <div class="form-tip">可输入姓名后按回车添加，或从下拉列表选择</div>
        </el-form-item>
        
        <el-form-item label="上传申报材料" prop="materials" class="form-item-enhanced">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            multiple
          >
            <el-button type="primary"><i class="btn-icon">📎</i>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持PDF、Word、Excel文档，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
          <div class="form-tip">建议上传项目计划书、预算明细表等相关材料</div>
        </el-form-item>
        
        <el-form-item class="action-buttons">
          <el-button type="primary" @click="submitForm" class="submit-btn">
            <i class="btn-icon">🚀</i>提交申报
          </el-button>
          <el-button @click="showResetConfirm" class="reset-btn">
            <i class="btn-icon">🔄</i>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <!-- 保存成功提示 -->
    <el-dialog
      v-model="saveSuccessVisible"
      title="提示"
      width="30%"
      center
      class="success-dialog"
    >
      <div class="dialog-content">
        <div class="success-icon">✅</div>
        <span class="success-text">草稿保存成功！</span>
        <p class="success-tip">您可以在"我的草稿"中继续编辑此项目</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="saveSuccessVisible = false" class="dialog-btn">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 提交成功提示 -->
    <el-dialog
      v-model="submitSuccessVisible"
      title="申报提交成功"
      width="35%"
      center
      class="submit-success-dialog"
    >
      <div class="dialog-content">
        <div class="success-icon">🎉</div>
        <span class="success-text">项目申报已成功提交！</span>
        <div class="submit-info">
          <p>项目编号：{{ projectNumber }}</p>
          <p>预计审核时间：3-5个工作日</p>
          <p>您可以在"申报进度"中查看审核状态</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="handleSubmitSuccess" class="dialog-btn">查看申报进度</el-button>
          <el-button @click="submitSuccessVisible = false" class="dialog-btn-secondary">继续编辑</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重置确认对话框 -->
    <el-dialog
      v-model="resetConfirmVisible"
      title="确认重置"
      width="30%"
      center
      class="reset-dialog"
    >
      <div class="dialog-content">
        <div class="warning-icon">⚠️</div>
        <span>确定要重置所有表单内容吗？</span>
        <p class="warning-tip">此操作将清除所有已填写的内容</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetConfirmVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmReset">确定重置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表单数据
const formData = reactive({
  name: '',
  type: '',
  description: '',
  startDate: '',
  endDate: '',
  budget: 0,
  leader: '',
  teamMembers: [],
  materials: []
})

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择申报类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { min: 10, message: '至少输入 10 个字符', trigger: 'blur' }
  ],
  startDate: [
    { required: true, message: '请选择开始日期', trigger: 'change' }
  ],
  endDate: [
    { required: true, message: '请选择结束日期', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || !formData.startDate) {
          callback()
          return
        }
        if (new Date(value) < new Date(formData.startDate)) {
          callback(new Error('结束日期不能早于开始日期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  budget: [
    { required: true, message: '请输入预算金额', trigger: 'blur' },
    { type: 'number', min: 0, message: '预算不能为负数', trigger: 'blur' }
  ],
  leader: [
    { required: true, message: '请输入项目负责人', trigger: 'blur' }
  ]
})

// 下拉选项数据
const projectTypes = ref([
  { value: 'innovation', label: '科技创新项目' },
  { value: 'culture', label: '文化发展项目' },
  { value: 'education', label: '教育扶持项目' },
  { value: 'environment', label: '环境保护项目' },
  { value: 'other', label: '其他类型项目' }
])

const teamOptions = ref([
  { value: '张三', label: '张三' },
  { value: '李四', label: '李四' },
  { value: '王五', label: '王五' },
  { value: '赵六', label: '赵六' }
])

const fileList = ref([])
const saveSuccessVisible = ref(false)
const submitSuccessVisible = ref(false)
const resetConfirmVisible = ref(false)
const projectNumber = ref('PRJ-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'))

// 文件上传处理
const handleFileChange = (file, files) => {
  const isLimit = file.size / 1024 / 1024 < 10
  if (!isLimit) {
    ElMessage.error('文件大小不能超过10MB')
    return false
  }
  
  // 更新文件列表
  fileList.value = files
  formData.materials = files.map(f => f.name)
  
  ElMessage.success(`文件"${file.name}"添加成功`)
}

// 保存草稿
const saveDraft = () => {
  // 验证必填字段
  if (!formData.name || !formData.type) {
    ElMessage.warning('请至少填写项目名称和申报类型后再保存草稿')
    return
  }
  
  // 模拟保存草稿到服务器
  ElMessage.info('正在保存草稿...')
  
  setTimeout(() => {
    saveSuccessVisible.value = true
    
    // 模拟保存成功后的操作
    const draftData = {
      id: Date.now(),
      name: formData.name,
      type: formData.type,
      saveTime: new Date().toLocaleString()
    }
    
    // 这里可以添加实际保存草稿的逻辑
    console.log('草稿保存成功:', draftData)
  }, 800)
}

// 提交表单
const submitForm = async () => {
  try {
    // 表单验证
    let isValid = true
    const rules = formRules
    
    for (const key in rules) {
      if (rules[key][0].required && !formData[key]) {
        ElMessage.error(`${rules[key][0].message}`)
        isValid = false
        break
      }
    }
    
    if (!isValid) return
    
    // 验证结束日期是否早于开始日期
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        ElMessage.error('结束日期不能早于开始日期')
        return
      }
    }
    
    // 确认提交
    await ElMessageBox.confirm('确定提交项目申报材料吗？提交后将进入审核流程。', '确认提交', {
      confirmButtonText: '确定提交',
      cancelButtonText: '再检查一下',
      type: 'warning',
      customClass: 'submit-confirm-dialog'
    })
    
    // 模拟API调用
    ElMessage.info('正在提交申报材料...')
    
    setTimeout(() => {
      // 生成新的项目编号
      projectNumber.value = 'PRJ-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      
      // 显示提交成功对话框
      submitSuccessVisible.value = true
      
      // 记录提交历史
      const submitHistory = {
        projectId: projectNumber.value,
        projectName: formData.name,
        submitTime: new Date().toLocaleString(),
        status: '审核中'
      }
      
      console.log('项目申报提交成功:', submitHistory)
    }, 1200)
    
  } catch (error) {
    ElMessage.info('已取消提交')
  }
}

// 处理提交成功操作
const handleSubmitSuccess = () => {
  submitSuccessVisible.value = false
  
  // 这里可以添加跳转到申报进度页面的逻辑
  ElMessage.info('跳转到申报进度页面')
  
  // 重置表单
  resetForm()
}

// 显示重置确认对话框
const showResetConfirm = () => {
  if (formData.name || formData.description || formData.teamMembers.length > 0) {
    resetConfirmVisible.value = true
  } else {
    ElMessage.info('表单已是初始状态')
  }
}

// 确认重置表单
const confirmReset = () => {
  resetForm()
  resetConfirmVisible.value = false
  ElMessage.success('表单已重置')
}

// 重置表单
const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (Array.isArray(formData[key])) {
      formData[key] = []
    } else if (typeof formData[key] === 'number') {
      formData[key] = 0
    } else {
      formData[key] = ''
    }
  })
  fileList.value = []
}

// 模拟组件挂载时加载数据
onMounted(() => {
  // 模拟从服务器加载草稿数据
  ElMessage.info('正在加载数据...')
  
  setTimeout(() => {
    // 模拟已保存的草稿数据
    Object.assign(formData, {
      name: '智慧城市大数据分析平台',
      type: 'innovation',
      description: '本项目旨在通过大数据技术分析城市运行数据，为城市管理提供决策支持。项目将整合多源数据，建立数据分析模型，提供可视化展示界面。',
      budget: 120.5,
      leader: '张主任',
      teamMembers: ['张三', '李四']
    })
    
    ElMessage.success('已加载保存的草稿')
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './ProjectEdit.scss';

</style>