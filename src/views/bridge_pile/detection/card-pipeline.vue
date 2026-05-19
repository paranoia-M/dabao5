<template>
  <div class="flow-container">
    <!-- 顶部操作栏 -->
    <div class="flow-header">
      <h2 class="flow-title">检测流程管理</h2>
      <div class="flow-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增检测记录</el-button>
        <el-button :icon="Refresh" @click="handleRefresh" :loading="refreshing">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="flow-search">
      <el-form :model="searchForm" inline>
        <el-form-item label="桩基编号">
          <el-input v-model="searchForm.pileNo" placeholder="请输入桩基编号" clearable />
        </el-form-item>
        <el-form-item label="当前阶段">
          <el-select v-model="searchForm.stage" placeholder="请选择阶段" clearable>
            <el-option label="钻孔" value="drilling" />
            <el-option label="清孔" value="cleaning" />
            <el-option label="钢筋笼" value="reinforcement" />
            <el-option label="混凝土浇筑" value="concreting" />
            <el-option label="检测" value="testing" />
            <el-option label="完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Filter" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 流水线卡片区域 -->
    <div class="flow-pipeline" v-loading="loading">
      <div class="pipeline-stages">
        <div
          v-for="stage in stages"
          :key="stage.key"
          class="stage-column"
          @dragover.prevent="onDragOver"
          @drop="onDrop(stage.key)"
        >
          <div class="stage-header" :style="{ backgroundColor: stage.color }">
            <span class="stage-icon">
              <component :is="stage.icon" />
            </span>
            <span class="stage-name">{{ stage.label }}</span>
            <el-tag size="small" type="plain" class="stage-count">{{ getStageCards(stage.key).length }}</el-tag>
          </div>
          <div class="stage-cards">
            <div
              v-for="card in getStageCards(stage.key)"
              :key="card.id"
              class="card-item"
              draggable="true"
              @dragstart="onDragStart(card)"
              @dragend="onDragEnd"
            >
              <div class="card-header">
                <span class="card-pile-no">{{ card.pileNo }}</span>
                <el-tag
                  :type="getStageTagType(card.stage)"
                  size="small"
                  class="card-stage-tag"
                >
                  {{ getStageLabel(card.stage) }}
                </el-tag>
              </div>
              <div class="card-body">
                <div class="card-info">
                  <span class="info-label">检测项：</span>
                  <span class="info-value">{{ card.testItem }}</span>
                </div>
                <div class="card-info">
                  <span class="info-label">操作人：</span>
                  <span class="info-value">{{ card.operator }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button
                  type="success"
                  size="small"
                  :icon="ArrowRight"
                  :disabled="card.stage === 'completed'"
                  @click="handleAdvance(card)"
                >
                  推进
                </el-button>
                <el-button
                  size="small"
                  :icon="Edit"
                  @click="handleEdit(card)"
                >
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  :icon="Delete"
                  @click="handleDelete(card)"
                >
                  删除
                </el-button>
              </div>
            </div>
            <div v-if="getStageCards(stage.key).length === 0" class="empty-cards">
              <el-empty description="暂无记录" :image-size="60" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增检测记录' : dialogMode === 'edit' ? '编辑检测记录' : '查看检测记录'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="桩基编号" prop="pileNo">
          <el-input
            v-model="formData.pileNo"
            placeholder="请输入桩基编号"
            :disabled="dialogMode === 'view'"
          />
        </el-form-item>
        <el-form-item label="检测项" prop="testItem">
          <el-input
            v-model="formData.testItem"
            placeholder="请输入检测项"
            :disabled="dialogMode === 'view'"
          />
        </el-form-item>
        <el-form-item label="当前阶段" prop="stage">
          <el-select
            v-model="formData.stage"
            placeholder="请选择阶段"
            :disabled="dialogMode === 'view'"
          >
            <el-option label="钻孔" value="drilling" />
            <el-option label="清孔" value="cleaning" />
            <el-option label="钢筋笼" value="reinforcement" />
            <el-option label="混凝土浇筑" value="concreting" />
            <el-option label="检测" value="testing" />
            <el-option label="完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input
            v-model="formData.operator"
            placeholder="请输入操作人"
            :disabled="dialogMode === 'view'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ dialogMode === 'add' ? '新增' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 推进确认弹窗 -->
    <el-dialog
      v-model="advanceDialogVisible"
      title="推进流程确认"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="advance-confirm">
        <el-icon :size="40" color="#ffc107"><Warning /></el-icon>
        <p class="confirm-text">确认将桩基编号为 <strong>{{ advanceCard?.pileNo }}</strong> 的检测记录推进至下一阶段？</p>
        <p class="confirm-detail">当前阶段：{{ getStageLabel(advanceCard?.stage) }} → 下一阶段：{{ getNextStageLabel(advanceCard?.stage) }}</p>
      </div>
      <template #footer>
        <el-button @click="advanceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="advanceLoading" @click="confirmAdvance">确认推进</el-button>
      </template>
    </el-dialog>

    <!-- 阻塞提示 -->
    <el-dialog
      v-model="blockDialogVisible"
      title="流程阻塞"
      width="400px"
      :close-on-click-modal="false"
    >
      <div class="block-info">
        <el-icon :size="40" color="#e6a23c"><Warning /></el-icon>
        <p class="block-text">当前流程已处于最后阶段，无法继续推进。</p>
        <p class="block-text">如需帮助，请联系运维人员处理。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="blockDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Edit,
  Delete,
  Plus,
  Search,
  Refresh,
  Filter,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Check,
  Close,
  Warning,
  InfoFilled,
  CircleCheck,
  Document,
  Tickets,
  Setting,
  Tools,
  User,
  Avatar,
  Star,
  Download,
  Upload,
  Share,
  Back,
  ArrowLeft,
  CircleClose,
  Lock,
  Unlock,
  Folder,
  Files,
  UserFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 阶段定义
const stages = [
  { key: 'drilling', label: '钻孔', color: '#0066cc', icon: Tools },
  { key: 'cleaning', label: '清孔', color: '#1a7ad9', icon: Document },
  { key: 'reinforcement', label: '钢筋笼', color: '#3388e6', icon: Folder },
  { key: 'concreting', label: '混凝土浇筑', color: '#4d99f2', icon: Files },
  { key: 'testing', label: '检测', color: '#66aaff', icon: Tickets },
  { key: 'completed', label: '完成', color: '#52c41a', icon: CircleCheck }
]

const stageOrder = ['drilling', 'cleaning', 'reinforcement', 'concreting', 'testing', 'completed']

// 假数据
const mockData = [
  { id: 1, pileNo: 'P001', testItem: '孔径检测', stage: 'drilling', operator: '张三' },
  { id: 2, pileNo: 'P002', testItem: '垂直度检测', stage: 'drilling', operator: '李四' },
  { id: 3, pileNo: 'P003', testItem: '沉渣厚度', stage: 'cleaning', operator: '王五' },
  { id: 4, pileNo: 'P004', testItem: '钢筋间距', stage: 'reinforcement', operator: '赵六' },
  { id: 5, pileNo: 'P005', testItem: '混凝土强度', stage: 'concreting', operator: '钱七' },
  { id: 6, pileNo: 'P006', testItem: '完整性检测', stage: 'testing', operator: '孙八' },
  { id: 7, pileNo: 'P007', testItem: '最终验收', stage: 'completed', operator: '周九' },
  { id: 8, pileNo: 'P008', testItem: '孔径检测', stage: 'drilling', operator: '吴十' },
  { id: 9, pileNo: 'P009', testItem: '沉渣厚度', stage: 'cleaning', operator: '郑一' },
  { id: 10, pileNo: 'P010', testItem: '钢筋间距', stage: 'reinforcement', operator: '陈二' }
]

const cards = ref([])
const loading = ref(false)
const refreshing = ref(false)
const searchForm = reactive({
  pileNo: '',
  stage: ''
})

// 弹窗相关
const dialogVisible = ref(false)
const dialogMode = ref('add')
const formData = reactive({
  pileNo: '',
  testItem: '',
  stage: 'drilling',
  operator: ''
})
const formRules = {
  pileNo: [{ required: true, message: '请输入桩基编号', trigger: 'blur' }],
  testItem: [{ required: true, message: '请输入检测项', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择当前阶段', trigger: 'change' }],
  operator: [{ required: true, message: '请输入操作人', trigger: 'blur' }]
}
const submitLoading = ref(false)

// 推进相关
const advanceDialogVisible = ref(false)
const advanceCard = ref(null)
const advanceLoading = ref(false)
const blockDialogVisible = ref(false)

// 拖拽相关
const dragCard = ref(null)

// 初始化
onMounted(() => {
  loadData()
})

function loadData() {
  loading.value = true
  setTimeout(() => {
    cards.value = JSON.parse(JSON.stringify(mockData))
    loading.value = false
  }, 500)
}

function getStageCards(stageKey) {
  let filtered = cards.value.filter(c => c.stage === stageKey)
  if (searchForm.pileNo) {
    filtered = filtered.filter(c => c.pileNo.includes(searchForm.pileNo))
  }
  if (searchForm.stage) {
    filtered = filtered.filter(c => c.stage === searchForm.stage)
  }
  return filtered
}

function getStageLabel(stageKey) {
  const stage = stages.find(s => s.key === stageKey)
  return stage ? stage.label : stageKey
}

function getStageTagType(stageKey) {
  const map = {
    drilling: 'primary',
    cleaning: 'info',
    reinforcement: 'warning',
    concreting: 'danger',
    testing: '',
    completed: 'success'
  }
  return map[stageKey] || 'info'
}

function getNextStageLabel(stageKey) {
  const currentIndex = stageOrder.indexOf(stageKey)
  if (currentIndex < stageOrder.length - 1) {
    return getStageLabel(stageOrder[currentIndex + 1])
  }
  return '无'
}

// 搜索重置
function handleSearch() {
  loadData()
}

function handleReset() {
  searchForm.pileNo = ''
  searchForm.stage = ''
  loadData()
}

function handleRefresh() {
  refreshing.value = true
  setTimeout(() => {
    loadData()
    refreshing.value = false
    ElMessage.success('刷新成功')
  }, 500)
}

// 新增
function handleAdd() {
  dialogMode.value = 'add'
  formData.pileNo = ''
  formData.testItem = ''
  formData.stage = 'drilling'
  formData.operator = ''
  dialogVisible.value = true
}

// 编辑
function handleEdit(card) {
  dialogMode.value = 'edit'
  formData.pileNo = card.pileNo
  formData.testItem = card.testItem
  formData.stage = card.stage
  formData.operator = card.operator
  dialogVisible.value = true
}

// 查看
function handleView(card) {
  dialogMode.value = 'view'
  formData.pileNo = card.pileNo
  formData.testItem = card.testItem
  formData.stage = card.stage
  formData.operator = card.operator
  dialogVisible.value = true
}

// 提交
function handleSubmit() {
  // 手动校验
  let valid = true
  if (!formData.pileNo) {
    ElMessage.warning('请输入桩基编号')
    valid = false
    return
  }
  if (!formData.testItem) {
    ElMessage.warning('请输入检测项')
    valid = false
    return
  }
  if (!formData.stage) {
    ElMessage.warning('请选择当前阶段')
    valid = false
    return
  }
  if (!formData.operator) {
    ElMessage.warning('请输入操作人')
    valid = false
    return
  }
  if (!valid) return

  submitLoading.value = true
  setTimeout(() => {
    if (dialogMode.value === 'add') {
      const newId = cards.value.length > 0 ? Math.max(...cards.value.map(c => c.id)) + 1 : 1
      cards.value.push({
        id: newId,
        pileNo: formData.pileNo,
        testItem: formData.testItem,
        stage: formData.stage,
        operator: formData.operator
      })
      ElMessage.success('新增成功')
    } else if (dialogMode.value === 'edit') {
      const index = cards.value.findIndex(c => c.pileNo === formData.pileNo)
      if (index !== -1) {
        cards.value[index] = {
          ...cards.value[index],
          pileNo: formData.pileNo,
          testItem: formData.testItem,
          stage: formData.stage,
          operator: formData.operator
        }
      }
      ElMessage.success('编辑成功')
    }
    dialogVisible.value = false
    submitLoading.value = false
  }, 500)
}

// 删除
function handleDelete(card) {
  ElMessageBox.confirm(
    `确认删除桩基编号为 "${card.pileNo}" 的检测记录吗？`,
    '删除确认',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = cards.value.findIndex(c => c.id === card.id)
    if (index !== -1) {
      cards.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 推进
function handleAdvance(card) {
  const currentIndex = stageOrder.indexOf(card.stage)
  if (currentIndex >= stageOrder.length - 1) {
    blockDialogVisible.value = true
    return
  }
  advanceCard.value = card
  advanceDialogVisible.value = true
}

function confirmAdvance() {
  if (!advanceCard.value) return
  const currentIndex = stageOrder.indexOf(advanceCard.value.stage)
  if (currentIndex >= stageOrder.length - 1) {
    advanceDialogVisible.value = false
    blockDialogVisible.value = true
    return
  }
  advanceLoading.value = true
  setTimeout(() => {
    const card = cards.value.find(c => c.id === advanceCard.value.id)
    if (card) {
      card.stage = stageOrder[currentIndex + 1]
    }
    advanceDialogVisible.value = false
    advanceLoading.value = false
    advanceCard.value = null
    ElMessage.success('流程推进成功')
  }, 500)
}

// 拖拽
function onDragStart(card) {
  dragCard.value = card
}

function onDragOver(event) {
  event.preventDefault()
}

function onDragEnd() {
  dragCard.value = null
}

function onDrop(targetStage) {
  if (!dragCard.value) return
  const currentIndex = stageOrder.indexOf(dragCard.value.stage)
  const targetIndex = stageOrder.indexOf(targetStage)
  if (targetIndex <= currentIndex) {
    ElMessage.warning('只能拖拽至后续阶段')
    return
  }
  if (targetIndex >= stageOrder.length) {
    ElMessage.warning('目标阶段无效')
    return
  }
  const card = cards.value.find(c => c.id === dragCard.value.id)
  if (card) {
    card.stage = targetStage
    ElMessage.success(`已移至 ${getStageLabel(targetStage)}`)
  }
  dragCard.value = null
}
</script>

<style lang='scss' scoped>
@use './card-pipeline.scss';
</style>
