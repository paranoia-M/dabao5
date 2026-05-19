<template>
  <div class="bridge-pile-detail">
    <!-- 主表批次选择区域 -->
    <div class="batch-select-area">
      <div class="batch-header">
        <h3 class="section-title">
          <el-icon><Tickets /></el-icon>
          桩基批次选择
        </h3>
        <div class="batch-actions">
          <el-button type="primary" size="small" @click="handleRefreshBatches">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
      <div class="batch-filter">
        <el-input
          v-model="batchFilter.keyword"
          placeholder="搜索批次编号/桩基名称"
          clearable
          size="small"
          style="width: 240px"
          @input="handleBatchFilter"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="warning" size="small" @click="resetBatchFilter">
          <el-icon><Filter /></el-icon>
          重置
        </el-button>
      </div>
      <el-table
        ref="batchTableRef"
        :data="filteredBatches"
        highlight-current-row
        @row-click="handleBatchSelect"
        v-loading="batchLoading"
        class="batch-table"
        height="180"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="batchNo" label="批次编号" min-width="120" />
        <el-table-column prop="projectName" label="项目名称" min-width="150" />
        <el-table-column prop="pileCount" label="桩基数量" width="100" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '进行中' ? 'warning' : 'success'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 横向阶段卡尺 -->
    <div class="stage-ruler-area">
      <div class="ruler-header">
        <h3 class="section-title">
          <el-icon><ArrowRight /></el-icon>
          检测阶段进度
        </h3>
        <div class="ruler-info">
          <span class="info-item">
            当前批次：<strong>{{ currentBatch?.batchNo || '未选择' }}</strong>
          </span>
          <span class="info-item">
            已选桩基：<strong>{{ selectedPiles.length }}</strong> 根
          </span>
        </div>
      </div>
      <div class="stage-ruler" v-loading="rulerLoading">
        <div class="ruler-track">
          <div
            v-for="(stage, index) in stageList"
            :key="stage.key"
            class="ruler-step"
            :class="{ active: stage.active, completed: stage.completed }"
            :style="{ width: `${100 / stageList.length}%` }"
          >
            <div class="step-indicator">
              <el-icon v-if="stage.completed"><CircleCheck /></el-icon>
              <el-icon v-else-if="stage.active"><Star /></el-icon>
              <span v-else class="step-dot"></span>
            </div>
            <div class="step-label">{{ stage.label }}</div>
            <div class="step-date">{{ stage.date }}</div>
            <div class="step-progress">
              <el-progress
                :percentage="stage.progress"
                :stroke-width="6"
                :color="stage.completed ? '#0cc' : '#0a4'"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 批量勾选与操作区域 -->
    <div class="batch-operation-area">
      <div class="operation-header">
        <h3 class="section-title">
          <el-icon><Check /></el-icon>
          桩基检测数据
        </h3>
        <div class="operation-actions">
          <el-button
            type="success"
            size="small"
            :disabled="selectedPiles.length === 0"
            @click="handleBatchSubmit"
            :loading="submitLoading"
          >
            <el-icon><Upload /></el-icon>
            批量提交检测
          </el-button>
          <el-button
            type="danger"
            size="small"
            :disabled="selectedPiles.length === 0"
            @click="handleBatchDelete"
            :loading="deleteLoading"
          >
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button type="primary" size="small" @click="handleAddRecord">
            <el-icon><Plus /></el-icon>
            新增记录
          </el-button>
        </div>
      </div>

      <!-- 树状汇总表 -->
      <div class="tree-table-area" v-loading="tableLoading">
        <el-table
          ref="pileTableRef"
          :data="treeTableData"
          row-key="id"
          default-expand-all
          :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          @selection-change="handleSelectionChange"
          border
          stripe
          height="360"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="pileNo" label="桩号" width="120" />
          <el-table-column prop="checkItem" label="检测项" width="140" />
          <el-table-column prop="stage" label="阶段" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getStageTagType(row.stage)" size="small">
                {{ row.stage }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsiblePerson" label="责任人" width="120" />
          <el-table-column prop="checkDate" label="检测日期" width="140" />
          <el-table-column prop="result" label="检测结果" min-width="160">
            <template #default="{ row }">
              <div class="result-cell">
                <el-icon v-if="row.result === '合格'" style="color: #0a4"><CircleCheck /></el-icon>
                <el-icon v-else-if="row.result === '不合格'" style="color: #f44"><CircleClose /></el-icon>
                <el-icon v-else style="color: #fa0"><Warning /></el-icon>
                <span :class="'result-text result-' + row.result">{{ row.result }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleView(row)">
                <el-icon><Document /></el-icon> 查看
              </el-button>
              <el-button type="warning" link size="small" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.current"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑/查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="dialogMode === 'view' ? '600px' : '700px'"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
        class="dialog-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="桩号" prop="pileNo">
              <el-input v-model="formData.pileNo" placeholder="请输入桩号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测项" prop="checkItem">
              <el-select v-model="formData.checkItem" placeholder="请选择检测项" style="width: 100%">
                <el-option label="孔径检测" value="孔径检测" />
                <el-option label="孔深检测" value="孔深检测" />
                <el-option label="垂直度检测" value="垂直度检测" />
                <el-option label="沉渣厚度检测" value="沉渣厚度检测" />
                <el-option label="泥浆指标检测" value="泥浆指标检测" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="阶段" prop="stage">
              <el-select v-model="formData.stage" placeholder="请选择阶段" style="width: 100%">
                <el-option label="成孔阶段" value="成孔阶段" />
                <el-option label="清孔阶段" value="清孔阶段" />
                <el-option label="钢筋笼安装" value="钢筋笼安装" />
                <el-option label="混凝土浇筑" value="混凝土浇筑" />
                <el-option label="检测验收" value="检测验收" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="responsiblePerson">
              <el-input v-model="formData.responsiblePerson" placeholder="请输入责任人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测日期" prop="checkDate">
              <el-date-picker
                v-model="formData.checkDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测结果" prop="result">
              <el-select v-model="formData.result" placeholder="请选择结果" style="width: 100%">
                <el-option label="合格" value="合格" />
                <el-option label="不合格" value="不合格" />
                <el-option label="待判定" value="待判定" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注说明" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="dialogMode !== 'view'"
            type="primary"
            @click="handleFormSubmit"
            :loading="formLoading"
          >
            {{ dialogMode === 'add' ? '新增' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Tickets, Refresh, Search, Filter, ArrowRight, CircleCheck, Star,
  Check, Upload, Delete, Plus, Document, Edit, Warning, CircleClose
} from '@element-plus/icons-vue'

// ========== 数据定义 ==========
const batchLoading = ref(false)
const rulerLoading = ref(false)
const tableLoading = ref(false)
const submitLoading = ref(false)
const deleteLoading = ref(false)
const formLoading = ref(false)

const currentBatch = ref(null)
const selectedPiles = ref([])
const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogTitle = ref('新增检测记录')

const batchFilter = reactive({
  keyword: ''
})

const pagination = reactive({
  current: 1,
  pageSize: 20,
  total: 0
})

// 批次列表假数据
const batchList = ref([
  { id: 1, batchNo: 'BATCH-2024-001', projectName: '跨江大桥桩基检测', pileCount: 24, createTime: '2024-01-15 09:30', status: '进行中' },
  { id: 2, batchNo: 'BATCH-2024-002', projectName: '高速互通立交桩基', pileCount: 36, createTime: '2024-02-20 14:00', status: '进行中' },
  { id: 3, batchNo: 'BATCH-2024-003', projectName: '城市高架桥桩基', pileCount: 18, createTime: '2024-03-10 10:15', status: '已完成' },
  { id: 4, batchNo: 'BATCH-2024-004', projectName: '地铁站桩基检测', pileCount: 42, createTime: '2024-04-05 16:45', status: '进行中' },
  { id: 5, batchNo: 'BATCH-2024-005', projectName: '铁路桥桩基检测', pileCount: 30, createTime: '2024-05-12 08:30', status: '已完成' }
])

// 阶段列表
const stageList = ref([
  { key: 'drilling', label: '钻孔阶段', date: '2024-06-01', progress: 100, completed: true, active: false },
  { key: 'cleaning', label: '清孔阶段', date: '2024-06-05', progress: 100, completed: true, active: false },
  { key: 'reinforcement', label: '钢筋笼安装', date: '2024-06-10', progress: 75, completed: false, active: true },
  { key: 'concreting', label: '混凝土浇筑', date: '2024-06-15', progress: 30, completed: false, active: false },
  { key: 'inspection', label: '检测验收', date: '2024-06-20', progress: 0, completed: false, active: false }
])

// 树状表格数据
const treeTableData = ref([])
const allRecords = ref([])

// 表单数据
const formData = reactive({
  pileNo: '',
  checkItem: '',
  stage: '',
  responsiblePerson: '',
  checkDate: '',
  result: '',
  remark: ''
})

// 表单校验规则
const formRules = {
  pileNo: [{ required: true, message: '请输入桩号', trigger: 'blur' }],
  checkItem: [{ required: true, message: '请选择检测项', trigger: 'change' }],
  stage: [{ required: true, message: '请选择阶段', trigger: 'change' }],
  responsiblePerson: [{ required: true, message: '请输入责任人', trigger: 'blur' }],
  checkDate: [{ required: true, message: '请选择检测日期', trigger: 'change' }],
  result: [{ required: true, message: '请选择检测结果', trigger: 'change' }]
}

// ========== 计算属性 ==========
const filteredBatches = computed(() => {
  if (!batchFilter.keyword) return batchList.value
  const kw = batchFilter.keyword.toLowerCase()
  return batchList.value.filter(item =>
    item.batchNo.toLowerCase().includes(kw) ||
    item.projectName.toLowerCase().includes(kw)
  )
})

// ========== 方法定义 ==========
const initData = () => {
  batchLoading.value = true
  setTimeout(() => {
    batchLoading.value = false
    if (batchList.value.length > 0) {
      currentBatch.value = batchList.value[0]
      loadPileData()
    }
  }, 500)
}

const loadPileData = () => {
  tableLoading.value = true
  setTimeout(() => {
    const mockData = generateMockData()
    allRecords.value = mockData
    pagination.total = mockData.length
    updateTreeTable()
    tableLoading.value = false
  }, 600)
}

const generateMockData = () => {
  const piles = []
  const pileNos = ['Z1-01', 'Z1-02', 'Z1-03', 'Z2-01', 'Z2-02', 'Z3-01', 'Z3-02', 'Z3-03', 'Z4-01', 'Z4-02']
  const checkItems = ['孔径检测', '孔深检测', '垂直度检测', '沉渣厚度检测', '泥浆指标检测']
  const stages = ['成孔阶段', '清孔阶段', '钢筋笼安装', '混凝土浇筑', '检测验收']
  const persons = ['张三', '李四', '王五', '赵六', '钱七']
  const results = ['合格', '不合格', '待判定']

  let id = 1
  pileNos.forEach(pileNo => {
    const itemCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < itemCount; i++) {
      piles.push({
        id: id++,
        pileNo: pileNo,
        checkItem: checkItems[Math.floor(Math.random() * checkItems.length)],
        stage: stages[Math.floor(Math.random() * stages.length)],
        responsiblePerson: persons[Math.floor(Math.random() * persons.length)],
        checkDate: `2024-06-${String(Math.floor(Math.random() * 20) + 1).padStart(2, '0')}`,
        result: results[Math.floor(Math.random() * results.length)],
        remark: Math.random() > 0.7 ? '需复检确认' : ''
      })
    }
  })
  return piles
}

const updateTreeTable = () => {
  const start = (pagination.current - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  const pageData = allRecords.value.slice(start, end)

  const groupMap = {}
  pageData.forEach(item => {
    if (!groupMap[item.pileNo]) {
      groupMap[item.pileNo] = {
        id: item.pileNo,
        pileNo: item.pileNo,
        checkItem: '汇总',
        stage: '-',
        responsiblePerson: '-',
        checkDate: '-',
        result: '-',
        hasChildren: true,
        children: []
      }
    }
    groupMap[item.pileNo].children.push({ ...item, hasChildren: false })
  })

  treeTableData.value = Object.values(groupMap)
}

const handleBatchFilter = () => {
  // 过滤逻辑已由computed处理
}

const resetBatchFilter = () => {
  batchFilter.keyword = ''
}

const handleRefreshBatches = () => {
  batchLoading.value = true
  setTimeout(() => {
    batchLoading.value = false
    ElMessage.success('批次列表已刷新')
  }, 400)
}

const handleBatchSelect = (row) => {
  currentBatch.value = row
  loadPileData()
  ElMessage.info(`已选择批次: ${row.batchNo}`)
}

const handleSelectionChange = (selection) => {
  selectedPiles.value = selection
}

const handleBatchSubmit = () => {
  if (selectedPiles.value.length === 0) {
    ElMessage.warning('请先勾选需要提交的桩基')
    return
  }
  submitLoading.value = true
  setTimeout(() => {
    submitLoading.value = false
    ElMessage.success(`成功提交 ${selectedPiles.value.length} 条检测记录`)
    selectedPiles.value = []
    loadPileData()
  }, 800)
}

const handleBatchDelete = () => {
  if (selectedPiles.value.length === 0) {
    ElMessage.warning('请先勾选需要删除的桩基')
    return
  }
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedPiles.value.length} 条记录吗？`,
    '批量删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    deleteLoading.value = true
    setTimeout(() => {
      const idsToDelete = selectedPiles.value.map(item => item.id)
      allRecords.value = allRecords.value.filter(item => !idsToDelete.includes(item.id))
      pagination.total = allRecords.value.length
      updateTreeTable()
      deleteLoading.value = false
      selectedPiles.value = []
      ElMessage.success('批量删除成功')
    }, 600)
  }).catch(() => {})
}

const handleAddRecord = () => {
  dialogMode.value = 'add'
  dialogTitle.value = '新增检测记录'
  resetFormData()
  dialogVisible.value = true
}

const handleView = (row) => {
  dialogMode.value = 'view'
  dialogTitle.value = '查看检测记录'
  fillFormData(row)
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogMode.value = 'edit'
  dialogTitle.value = '编辑检测记录'
  fillFormData(row)
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除桩号 ${row.pileNo} 的检测记录吗？`,
    '删除确认',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    setTimeout(() => {
      allRecords.value = allRecords.value.filter(item => item.id !== row.id)
      pagination.total = allRecords.value.length
      updateTreeTable()
      ElMessage.success('删除成功')
    }, 400)
  }).catch(() => {})
}

const resetFormData = () => {
  formData.pileNo = 'Z1-01'
  formData.checkItem = '孔径检测'
  formData.stage = '成孔阶段'
  formData.responsiblePerson = '张三'
  formData.checkDate = '2024-06-15'
  formData.result = '合格'
  formData.remark = ''
}

const fillFormData = (row) => {
  formData.pileNo = row.pileNo
  formData.checkItem = row.checkItem
  formData.stage = row.stage
  formData.responsiblePerson = row.responsiblePerson
  formData.checkDate = row.checkDate
  formData.result = row.result
  formData.remark = row.remark || ''
}

const handleFormSubmit = () => {
  // 手动校验
  const errors = []
  if (!formData.pileNo) errors.push('桩号')
  if (!formData.checkItem) errors.push('检测项')
  if (!formData.stage) errors.push('阶段')
  if (!formData.responsiblePerson) errors.push('责任人')
  if (!formData.checkDate) errors.push('检测日期')
  if (!formData.result) errors.push('检测结果')

  if (errors.length > 0) {
    ElMessage.warning(`请填写完整信息: ${errors.join(', ')}`)
    return
  }

  formLoading.value = true
  setTimeout(() => {
    if (dialogMode.value === 'add') {
      const newRecord = {
        id: Date.now(),
        pileNo: formData.pileNo,
        checkItem: formData.checkItem,
        stage: formData.stage,
        responsiblePerson: formData.responsiblePerson,
        checkDate: formData.checkDate,
        result: formData.result,
        remark: formData.remark
      }
      allRecords.value.unshift(newRecord)
      pagination.total = allRecords.value.length
      updateTreeTable()
      ElMessage.success('新增成功')
    } else {
      const index = allRecords.value.findIndex(item => item.id === formData.id)
      if (index !== -1) {
        allRecords.value[index] = { ...allRecords.value[index], ...formData }
        updateTreeTable()
        ElMessage.success('编辑成功')
      }
    }
    formLoading.value = false
    dialogVisible.value = false
  }, 500)
}

const handlePageChange = (page) => {
  pagination.current = page
  updateTreeTable()
}

const handlePageSizeChange = (size) => {
  pagination.pageSize = size
  pagination.current = 1
  updateTreeTable()
}

const getStageTagType = (stage) => {
  const map = {
    '成孔阶段': 'primary',
    '清孔阶段': 'success',
    '钢筋笼安装': 'warning',
    '混凝土浇筑': 'danger',
    '检测验收': 'info'
  }
  return map[stage] || 'info'
}

// ========== 生命周期 ==========
onMounted(() => {
  initData()
})
</script>

<style lang='scss' scoped>
@use './master-detail.scss';
</style>
