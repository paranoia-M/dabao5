<template>
  <div class="page-alert-record">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-item">
        <el-input
          v-model="keyword"
          placeholder="搜索预警标题"
          clearable
          style="width: 240px"
        />
      </div>
      <div class="filter-item">
        <el-select
          v-model="filterStatus"
          placeholder="预警状态"
          clearable
          style="width: 140px"
        >
          <el-option label="待处理" value="未确认" />
          <el-option label="已确认" value="已确认" />
          <el-option label="已忽略" value="已忽略" />
        </el-select>
      </div>
      <div class="filter-item">
        <el-select
          v-model="filterLevel"
          placeholder="风险等级"
          clearable
          style="width: 140px"
        >
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
      </div>
      <div class="filter-item">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          clearable
          style="width: 280px"
        />
      </div>
      <div class="filter-actions">
        <el-button type="primary" @click="handleAdd">新增预警</el-button>
        <el-button @click="handleExport">导出</el-button>
      </div>
    </div>

    <!-- 主内容区：左气泡图 + 右列表 -->
    <div class="main-content">
      <div class="left-bubble">
        <div class="bubble-card">
          <div class="card-title">预警等级分布</div>
          <svg class="bubble-svg" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            <circle
              v-for="(item, index) in bubbleData"
              :key="item.level"
              :cx="bubblePositions[index].cx"
              :cy="120"
              :r="item.radius"
              :fill="item.color"
              :opacity="selectedLevel && selectedLevel !== item.level ? 0.3 : 0.85"
              :stroke="selectedLevel === item.level ? '#fff' : 'none'"
              :stroke-width="selectedLevel === item.level ? 3 : 0"
              class="bubble-circle"
              @click="toggleLevel(item.level)"
            />
            <text
              v-for="(item, index) in bubbleData"
              :key="'label' + item.level"
              :x="bubblePositions[index].cx"
              :y="130"
              text-anchor="middle"
              fill="#fff"
              font-size="14"
              font-weight="bold"
              pointer-events="none"
            >{{ item.count }}</text>
            <text
              v-for="(item, index) in bubbleData"
              :key="'name' + item.level"
              :x="bubblePositions[index].cx"
              :y="150"
              text-anchor="middle"
              fill="#A0AEC0"
              font-size="12"
              pointer-events="none"
            >{{ item.level }}</text>
          </svg>
        </div>
      </div>
      <div class="right-table">
        <el-table
          :data="paginatedList"
          stripe
          highlight-current-row
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column
            prop="description"
            label="预警标题"
            min-width="160"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span class="alert-title">{{ row.description }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="level" label="风险等级" width="90">
            <template #default="{ row }">
              <el-tag
                :type="row.level === '高' ? 'danger' : row.level === '中' ? 'warning' : 'info'"
                size="small"
              >{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createDate" label="预警时间" width="160" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag
                :type="row.status === '未确认' ? 'warning' : row.status === '已确认' ? 'success' : 'info'"
                size="small"
              >{{ row.status === '未确认' ? '待处理' : row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="handledBy" label="处理人" width="80" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click.stop="handleDetail(row)">详情</el-button>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="row.status !== '未确认'"
                @click.stop="handleProcess(row)"
              >处理</el-button>
              <el-button
                link
                type="danger"
                size="small"
                :disabled="row.status !== '未确认'"
                @click.stop="handleDelete(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredRecords.length"
            layout="total, prev, pager, next"
          />
        </div>
      </div>
    </div>

    <!-- 底部操作日志 -->
    <div class="bottom-log">
      <div class="card-title">近期处理记录</div>
      <el-table :data="recentLogs" stripe style="width: 100%" max-height="200">
        <el-table-column prop="handledBy" label="处理人" width="100" />
        <el-table-column prop="handledDate" label="处理时间" width="180" />
        <el-table-column prop="status" label="处理方式" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.status === '已确认' ? '#67C23A' : '#909399' }">
              {{ row.status === '已确认' ? '确认' : '忽略' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="预警标题" show-overflow-tooltip />
      </el-table>
    </div>

    <!-- 新增预警 dialog -->
    <el-dialog v-model="addDialogVisible" title="新增预警" width="min(640px, 92vw)" top="5vh">
      <el-form ref="addFormRef" :model="addForm" :rules="addRules" label-width="100px">
        <el-form-item label="预警标题" prop="description">
          <el-input v-model="addForm.description" placeholder="请输入预警标题" />
        </el-form-item>
        <el-form-item label="预警类型" prop="alertType">
          <el-select v-model="addForm.alertType" placeholder="请选择预警类型" style="width: 100%">
            <el-option label="检测超标" value="超标预警" />
            <el-option label="标准变更" value="标准变更" />
            <el-option label="风险信号" value="风险监测" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联检测任务" prop="resultId">
          <el-select
            v-model="addForm.resultId"
            filterable
            remote
            :remote-method="remoteSearchResult"
            placeholder="输入检测项目名称搜索"
            style="width: 100%"
          >
            <el-option
              v-for="item in searchResultOptions"
              :key="item.id"
              :label="`${item.itemName} (${item.value}${item.unit})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级" prop="level">
          <el-select v-model="addForm.level" placeholder="请选择风险等级" style="width: 100%">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警描述" prop="remark">
          <el-input v-model="addForm.remark" type="textarea" :rows="3" placeholder="请输入预警描述" />
        </el-form-item>
        <el-form-item label="预警时间" prop="createDate">
          <el-date-picker
            v-model="addForm.createDate"
            type="datetime"
            placeholder="选择预警时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 处理预警 dialog -->
    <el-dialog v-model="processDialogVisible" title="处理预警" width="min(480px, 92vw)">
      <div class="process-info">
        <p><strong>预警标题：</strong>{{ processingRow?.description }}</p>
        <p><strong>当前状态：</strong>
          <el-tag
            :type="processingRow?.status === '未确认' ? 'warning' : 'info'"
            size="small"
          >{{ processingRow?.status === '未确认' ? '待处理' : processingRow?.status }}</el-tag>
        </p>
      </div>
      <el-form ref="processFormRef" :model="processForm" label-width="100px">
        <el-form-item label="处理方式" prop="action">
          <el-radio-group v-model="processForm.action">
            <el-radio value="确认">确认预警</el-radio>
            <el-radio value="忽略">忽略预警</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="processForm.remark" type="textarea" :rows="3" placeholder="请输入处理备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 详情 drawer -->
    <el-drawer v-model="detailDrawerVisible" title="预警详情" size="500px" direction="rtl">
      <template v-if="detailRow">
        <div class="detail-grid">
          <div class="detail-row">
            <span class="detail-label">预警标题</span>
            <span class="detail-value">{{ detailRow.description }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">预警类型</span>
            <span class="detail-value">{{ detailRuleType }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">关联检测任务</span>
            <span class="detail-value">{{ detailResultInfo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">风险等级</span>
            <span class="detail-value">
              <el-tag :type="detailRow.level === '高' ? 'danger' : detailRow.level === '中' ? 'warning' : 'info'" size="small">{{ detailRow.level }}</el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">预警描述</span>
            <span class="detail-value">{{ detailRow.remark || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">预警时间</span>
            <span class="detail-value">{{ detailRow.createDate }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">处理状态</span>
            <span class="detail-value">
              <el-tag :type="detailRow.status === '已确认' ? 'success' : detailRow.status === '已忽略' ? 'info' : 'warning'" size="small">
                {{ detailRow.status === '未确认' ? '待处理' : detailRow.status }}
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">处理人</span>
            <span class="detail-value">{{ detailRow.handledBy || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">处理时间</span>
            <span class="detail-value">{{ detailRow.handledDate || '-' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">处理备注</span>
            <span class="detail-value">{{ detailRow.remark || '-' }}</span>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAlertRecordStore } from '@/stores/alertRecord'
import { useAlertConfigStore } from '@/stores/alertConfig'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useSampleStore } from '@/stores/sample'

// Stores
const alertRecordStore = useAlertRecordStore()
const alertConfigStore = useAlertConfigStore()
const inspectionResultStore = useInspectionResultStore()
const sampleStore = useSampleStore()

// 筛选条件
const keyword = ref('')
const filterStatus = ref(null)
const filterLevel = ref(null)
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = 20

// 气泡数据
const selectedLevel = ref(null)

// computed 过滤列表
const filteredRecords = computed(() => {
  let list = alertRecordStore.alertRecordList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(item => item.description && item.description.toLowerCase().includes(kw))
  }
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (filterLevel.value) {
    list = list.filter(item => item.level === filterLevel.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(item => {
      const d = item.createDate.slice(0, 10)
      return d >= start && d <= end
    })
  }
  if (selectedLevel.value) {
    list = list.filter(item => item.level === selectedLevel.value)
  }
  return list
})

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecords.value.slice(start, start + pageSize)
})

// 气泡图数据
const levelCountMap = computed(() => {
  const map = { 高: 0, 中: 0, 低: 0 }
  alertRecordStore.alertRecordList.forEach(item => {
    if (map[item.level] !== undefined) map[item.level]++
  })
  return map
})
const maxCount = computed(() => Math.max(levelCountMap.value['高'], levelCountMap.value['中'], levelCountMap.value['低'], 1))
const bubbleData = computed(() => {
  const levels = ['高', '中', '低']
  const colors = { '高': '#EF4444', '中': '#F59E0B', '低': '#10B981' }
  return levels.map(level => ({
    level,
    count: levelCountMap.value[level],
    color: colors[level],
    radius: 20 + (Number.isFinite(levelCountMap.value[level]) ? (levelCountMap.value[level] / maxCount.value) * 40 : 0)
  }))
})
const bubblePositions = [
  { cx: 100 }, { cx: 200 }, { cx: 300 }
]

function toggleLevel(level) {
  if (selectedLevel.value === level) {
    selectedLevel.value = null
  } else {
    selectedLevel.value = level
    currentPage.value = 1
  }
}

// 操作日志
const recentLogs = computed(() => {
  const list = alertRecordStore.alertRecordList.filter(item => item.status !== '未确认')
  list.sort((a, b) => {
    if (!a.handledDate && !b.handledDate) return 0
    if (!a.handledDate) return 1
    if (!b.handledDate) return -1
    return b.handledDate.localeCompare(a.handledDate)
  })
  return list.slice(0, 10)
})

// 新增预警
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = ref({
  description: '',
  alertType: '',
  resultId: '',
  level: '',
  remark: '',
  createDate: ''
})
const addRules = {
  description: [{ required: true, message: '请输入预警标题', trigger: 'blur' }],
  alertType: [{ required: true, message: '请选择预警类型', trigger: 'change' }],
  level: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  remark: [{ required: true, message: '请输入预警描述', trigger: 'blur' }],
  createDate: [{ required: true, message: '请选择预警时间', trigger: 'change' }]
}

// 远程搜索关联检测结果
const searchResultOptions = ref([])
function remoteSearchResult(query) {
  if (!query) {
    searchResultOptions.value = inspectionResultStore.inspectionResultList
  } else {
    searchResultOptions.value = inspectionResultStore.inspectionResultList.filter(
      item => item.itemName.toLowerCase().includes(query.toLowerCase())
    )
  }
}

function handleAdd() {
  addForm.value = {
    description: '',
    alertType: '',
    resultId: '',
    level: '',
    remark: '',
    createDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  searchResultOptions.value = inspectionResultStore.inspectionResultList
  addDialogVisible.value = true
}

function submitAdd() {
  addFormRef.value.validate(valid => {
    if (!valid) return
    // 根据选择的预警类型找到对应的 alertConfigId
    const configs = alertConfigStore.alertConfigList.filter(c => c.ruleType === addForm.value.alertType)
    let alertConfigId = ''
    if (configs.length > 0) {
      alertConfigId = configs[0].id
    } else {
      // fallback: 使用第一个配置
      if (alertConfigStore.alertConfigList.length > 0) {
        alertConfigId = alertConfigStore.alertConfigList[0].id
      }
    }
    const newRecord = {
      id: `alertrecord_${Date.now()}`,
      alertConfigId,
      resultId: addForm.value.resultId || '',
      sampleId: '',
      level: addForm.value.level,
      description: addForm.value.description,
      status: '未确认',
      createDate: addForm.value.createDate,
      handledBy: '',
      handledDate: '',
      remark: addForm.value.remark
    }
    alertRecordStore.add(newRecord)
    addDialogVisible.value = false
    ElMessage.success('新增预警成功')
  })
}

// 处理预警
const processDialogVisible = ref(false)
const processingRow = ref(null)
const processFormRef = ref(null)
const processForm = ref({
  action: '确认',
  remark: ''
})

function handleProcess(row) {
  processingRow.value = row
  processForm.value = {
    action: '确认',
    remark: ''
  }
  processDialogVisible.value = true
}

function submitProcess() {
  if (!processingRow.value) return
  const action = processForm.value.action
  const newStatus = action === '确认' ? '已确认' : '已忽略'
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const patch = {
    status: newStatus,
    handledBy: '当前用户',
    handledDate: now,
    remark: processingRow.value.remark
  }
  if (processForm.value.remark) {
    patch.remark = patch.remark ? patch.remark + ' | ' + processForm.value.remark : processForm.value.remark
  }
  alertRecordStore.update(processingRow.value.id, patch)
  processDialogVisible.value = false
  if (action === '确认') {
    ElMessage.success('已确认，生成整改任务')
  } else {
    ElMessage.info('已忽略')
  }
}

// 删除预警
function handleDelete(row) {
  ElMessageBox.confirm(
    '确认删除该预警记录？如果已关联整改任务将无法删除。',
    '删除确认',
    { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    alertRecordStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 详情
const detailDrawerVisible = ref(false)
const detailRow = ref(null)

const detailRuleType = computed(() => {
  if (!detailRow.value) return '-'
  const config = alertConfigStore.findById(detailRow.value.alertConfigId)
  if (config) {
    const typeMap = { '超标预警': '检测超标', '标准变更': '标准变更', '风险监测': '风险信号' }
    return typeMap[config.ruleType] || config.ruleType
  }
  return '-'
})
const detailResultInfo = computed(() => {
  if (!detailRow.value || !detailRow.value.resultId) return '-'
  const result = inspectionResultStore.findById(detailRow.value.resultId)
  if (result) {
    return `${result.itemName} (${result.value}${result.unit})`
  }
  return '-'
})

function handleDetail(row) {
  detailRow.value = row
  detailDrawerVisible.value = true
}

function handleRowClick(row) {
  // 可以选做
}

// 导出
function handleExport() {
  const records = filteredRecords.value
  if (records.length === 0) {
    ElMessage.warning('没有可导出的记录')
    return
  }
  const headers = ['预警标题', '风险等级', '预警时间', '状态', '处理人', '处理时间']
  const csvRows = [headers.join(',')]
  records.forEach(r => {
    const row = [
      `"${r.description || ''}"`,
      r.level,
      r.createDate,
      r.status,
      r.handledBy || '',
      r.handledDate || ''
    ]
    csvRows.push(row.join(','))
  })
  const csvString = csvRows.join('\n')
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `预警记录_${new Date().toISOString().slice(0,10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}
</script>

<style scoped lang="scss">
@use './AlertRecord.scss' as *;
</style>