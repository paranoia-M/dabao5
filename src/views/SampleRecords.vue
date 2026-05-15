<template>
  <div class="page-sample-records">
    <!-- 顶部筛选与操作区 -->
    <div class="sr-header">
      <div class="sr-header-left">
        <el-input
          v-model="keyword"
          placeholder="搜索样品编号/名称/来源"
          clearable
          style="width:260px"
          @input="onFilterChange"
        />
        <el-select v-model="statusFilter" placeholder="状态" clearable style="width:140px" @change="onFilterChange">
          <el-option label="全部" value="" />
          <el-option label="待检" value="待检" />
          <el-option label="检测中" value="检测中" />
          <el-option label="已完成" value="已完成" />
          <el-option label="不合格" value="不合格" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="接收日期起"
          end-placeholder="接收日期止"
          value-format="YYYY-MM-DD"
          style="width:260px"
          @change="onDateRangeChange"
        />
      </div>
      <div class="sr-header-right">
        <el-button type="primary" :disabled="!canAssign" @click="openAssignDialog">
          <el-icon style="vertical-align:-0.15em;margin-right:4px"><Plus /></el-icon>
          分配检测任务
        </el-button>
        <el-button type="primary" @click="openAddDialog">
          <el-icon style="vertical-align:-0.15em;margin-right:4px"><Plus /></el-icon>
          新增样品
        </el-button>
        <el-button @click="handleExport">导出样品列表</el-button>
      </div>
    </div>

    <!-- 主舞台：左侧日历热力图 (60%) + 右侧来源Top5 (30%) -->
    <div class="sr-main">
      <div class="sr-left">
        <el-card class="cal-card" shadow="never">
          <template #header>
            <div class="cal-header">
              <el-button text @click="prevMonth">&lt;</el-button>
              <span class="cal-month-title">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</span>
              <el-button text @click="nextMonth">&gt;</el-button>
            </div>
          </template>
          <div class="cal-heatmap">
            <div class="cal-weekday" v-for="w in weekdays" :key="w">{{ w }}</div>
            <div
              v-for="(day, idx) in calendarDays"
              :key="idx"
              class="cal-day"
              :class="{
                'is-selected': selectedDay === day.date,
                'is-other-month': !day.isCurrentMonth,
                'has-sample': day.quantity > 0
              }"
              :style="{ background: getDayBg(day.quantity) }"
              @click="selectDay(day.date)"
            >
              <span class="cal-day-num">{{ day.day }}</span>
              <span v-if="day.quantity > 0" class="cal-day-qty">{{ day.quantity }}</span>
            </div>
          </div>
        </el-card>
      </div>
      <div class="sr-right">
        <el-card class="top5-card" shadow="never">
          <template #header>
            <span>样品来源 Top5</span>
            <span v-if="selectedDay" class="top5-date">（{{ selectedDay }}）</span>
          </template>
          <div class="top5-list">
            <div v-for="(item, idx) in top5Sources" :key="idx" class="top5-item">
              <span class="top5-label">{{ item.source }}</span>
              <span class="top5-bar-wrap">
                <span
                  class="top5-bar"
                  :style="{ width: (item.quantity / maxQty) * 100 + '%' }"
                ></span>
              </span>
              <span class="top5-value">{{ item.quantity }}</span>
            </div>
            <el-empty v-if="top5Sources.length === 0" description="暂无来源数据" :image-size="60" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 底部样品列表表格 -->
    <div class="sr-table">
      <el-table
        :data="filteredSamples"
        style="width:100%"
        stripe
        highlight-current-row
        @selection-change="onSelectionChange"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="selection" width="44" :selectable="checkSelectable" />
        <el-table-column prop="id" label="样品编号" min-width="130" />
        <el-table-column prop="name" label="样品名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="source" label="来源" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="90" />
        <el-table-column prop="quantity" label="数量" width="80" align="right" />
        <el-table-column prop="receiveDate" label="接收日期" width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === '待检'"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === '待检'"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="sr-pagination">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredSamples.length"
          layout="total, prev, pager, next"
          small
        />
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑样品' : '新增样品'"
      :width="min(640, windowInnerWidth - 40) + 'px'"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="样品编号" prop="id">
          <el-input v-model="form.id" disabled />
        </el-form-item>
        <el-form-item label="样品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入样品名称" />
        </el-form-item>
        <el-form-item label="样品来源" prop="source">
          <el-input v-model="form.source" placeholder="请输入样品来源，如山东寿光" />
        </el-form-item>
        <el-form-item label="样品类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择食品大类" style="width:100%">
            <el-option label="蔬菜" value="蔬菜" />
            <el-option label="水果" value="水果" />
            <el-option label="肉类" value="肉类" />
            <el-option label="乳制品" value="乳制品" />
            <el-option label="水产品" value="水产品" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="样品数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" :max="99999" style="width:100%" />
        </el-form-item>
        <el-form-item label="接收日期" prop="receiveDate">
          <el-date-picker v-model="form.receiveDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="备注信息（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailDrawer" title="样品详情" size="500px">
      <template v-if="detailItem">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">样品编号</span>
            <span class="detail-value">{{ detailItem.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">样品名称</span>
            <span class="detail-value">{{ detailItem.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">来源</span>
            <span class="detail-value">{{ detailItem.source }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">类型</span>
            <span class="detail-value">{{ detailItem.type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">数量</span>
            <span class="detail-value">{{ detailItem.quantity }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">接收日期</span>
            <span class="detail-value">{{ detailItem.receiveDate }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">状态</span>
            <span class="detail-value">
              <el-tag :type="statusTag(detailItem.status)" size="small">{{ detailItem.status }}</el-tag>
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">备注</span>
            <span class="detail-value">{{ detailItem.description || '无' }}</span>
          </div>
        </div>
        <el-divider />
        <h4>关联检测任务</h4>
        <el-table :data="detailTasks" stripe style="width:100%" size="small" v-if="detailTasks.length > 0">
          <el-table-column prop="id" label="任务编号" min-width="100" />
          <el-table-column prop="assignee" label="检测人" width="80" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="taskStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="截止日期" width="100" />
        </el-table>
        <el-empty v-else description="暂无关联检测任务" :image-size="50" />
        <el-divider />
        <h4>检测结果概要</h4>
        <el-table :data="detailResults" stripe style="width:100%" size="small" v-if="detailResults.length > 0">
          <el-table-column prop="itemName" label="检测项目" min-width="120" />
          <el-table-column prop="value" label="数值" width="80" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="conclusion" label="结论" width="80">
            <template #default="{ row }">
              <el-tag :type="row.conclusion === '合格' ? 'success' : row.conclusion === '不合格' ? 'danger' : 'warning'" size="small">{{ row.conclusion }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无检测结果" :image-size="50" />
      </template>
    </el-drawer>

    <!-- 分配检测任务弹窗 -->
    <el-dialog
      v-model="assignDialog"
      title="分配检测任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedSamples.length > 0">
        <p>已选样品（{{ selectedSamples.length }} 个）：</p>
        <el-tag v-for="s in selectedSamples" :key="s.id" closable @close="removeSelectedSample(s)" style="margin:4px">{{ s.name }}</el-tag>
      </div>
      <el-form label-width="100px" style="margin-top:16px">
        <el-form-item label="检测项目" prop="assignItems">
          <el-select v-model="assignItems" multiple placeholder="请选择检测项目" style="width:100%">
            <el-option v-for="item in detectItemOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测人" prop="assignee">
          <el-select v-model="assignee" placeholder="请选择检测人" style="width:100%">
            <el-option label="张伟" value="张伟" />
            <el-option label="李娜" value="李娜" />
            <el-option label="王芳" value="王芳" />
            <el-option label="刘洋" value="刘洋" />
            <el-option label="陈静" value="陈静" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!assignItems.length || !assignee" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, inject } from 'vue'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useDetectStandardStore } from '@/stores/detectStandard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const sampleStore = useSampleStore()
const detectTaskStore = useDetectTaskStore()
const inspectionResultStore = useInspectionResultStore()
const detectStandardStore = useDetectStandardStore()

// 筛选
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = 20

// 选中行
const selectedSamples = ref([])

// 日历
const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const selectedDay = ref('') // YYYY-MM-DD

// 表单
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  id: '',
  name: '',
  source: '',
  type: '',
  quantity: 1,
  receiveDate: '',
  description: ''
})
const formRules = {
  name: [{ required: true, message: '请输入样品名称', trigger: 'blur' }],
  source: [{ required: true, message: '请输入样品来源', trigger: 'blur' }],
  type: [{ required: true, message: '请选择样品类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  receiveDate: [{ required: true, message: '请选择接收日期', trigger: 'change' }]
}

// 详情
const detailDrawer = ref(false)
const detailItem = ref(null)
const detailTasks = ref([])
const detailResults = ref([])

// 分配任务
const assignDialog = ref(false)
const assignItems = ref([])
const assignee = ref('')
const detectItemOptions = ref([])

onMounted(() => {
  // 初始化日历基于样品数据中的月份
  const dates = sampleStore.sampleList.map(s => s.receiveDate).filter(Boolean)
  if (dates.length > 0) {
    const maxDate = dates.reduce((a, b) => (a > b ? a : b))
    const d = dayjs(maxDate)
    currentYear.value = d.year()
    currentMonth.value = d.month()
  }
  // 加载检测标准项目作为检测选项
  const items = detectStandardStore.detectStandardList.map(s => s.itemName).filter((v, i, a) => a.indexOf(v) === i)
  detectItemOptions.value = items.length > 0 ? items : ['菌落总数', '大肠菌群', '重金属']
})

// 日历天数
const calendarDays = computed(() => {
  const firstDay = dayjs(new Date(currentYear.value, currentMonth.value, 1))
  const lastDay = firstDay.endOf('month')
  const days = []
  // 补全前面空白天数（星期一开始）
  const startWeekday = firstDay.day() === 0 ? 6 : firstDay.day() - 1 // 周一=0 周日=6
  for (let i = 0; i < startWeekday; i++) {
    const prev = firstDay.subtract(startWeekday - i, 'day')
    days.push({
      day: prev.date(),
      date: prev.format('YYYY-MM-DD'),
      isCurrentMonth: false,
      quantity: 0
    })
  }
  for (let d = 1; d <= lastDay.date(); d++) {
    const dateStr = dayjs(new Date(currentYear.value, currentMonth.value, d)).format('YYYY-MM-DD')
    const qty = dailyQuantities.value[dateStr] || 0
    days.push({
      day: d,
      date: dateStr,
      isCurrentMonth: true,
      quantity: qty
    })
  }
  // 补全最后空格，使总格子数为7的倍数
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    const next = lastDay.add(i, 'day')
    days.push({
      day: next.date(),
      date: next.format('YYYY-MM-DD'),
      isCurrentMonth: false,
      quantity: 0
    })
  }
  return days
})

const dailyQuantities = computed(() => {
  const map = {}
  sampleStore.sampleList.forEach(s => {
    if (s.receiveDate) {
      map[s.receiveDate] = (map[s.receiveDate] || 0) + s.quantity
    }
  })
  return map
})

function getDayBg(qty) {
  if (qty === 0) return 'transparent'
  const max = Math.max(...Object.values(dailyQuantities.value), 1)
  const intensity = Math.min(qty / max, 1)
  const r = Math.round(220 - intensity * 180)
  const g = Math.round(240 - intensity * 150)
  const b = Math.round(255 - intensity * 100)
  return `rgba(${r}, ${g}, ${b}, 0.7)`
}

function selectDay(date) {
  selectedDay.value = date
  // 同步日期范围选择器为单日
  dateRange.value = [date, date]
  currentPage.value = 1
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDay.value = ''
  dateRange.value = []
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDay.value = ''
  dateRange.value = []
}

// 来源 top5
const top5Sources = computed(() => {
  let list = sampleStore.sampleList
  if (selectedDay.value) {
    list = list.filter(s => s.receiveDate === selectedDay.value)
  } else {
    // 当月数据
    const monthStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`
    list = list.filter(s => s.receiveDate && s.receiveDate.startsWith(monthStr))
  }
  const countMap = {}
  list.forEach(s => {
    const src = s.source || '未知'
    countMap[src] = (countMap[src] || 0) + s.quantity
  })
  const sorted = Object.entries(countMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return sorted.map(([source, quantity]) => ({ source, quantity }))
})

const maxQty = computed(() => {
  if (top5Sources.value.length === 0) return 1
  return Math.max(...top5Sources.value.map(i => i.quantity), 1)
})

// 筛选后样品
const filteredSamples = computed(() => {
  let list = sampleStore.sampleList
  // 关键词
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(s =>
      (s.id && s.id.toLowerCase().includes(kw)) ||
      (s.name && s.name.toLowerCase().includes(kw)) ||
      (s.source && s.source.toLowerCase().includes(kw))
    )
  }
  // 状态
  if (statusFilter.value) {
    list = list.filter(s => s.status === statusFilter.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(s => s.receiveDate >= start && s.receiveDate <= end)
  }
  // 返回按接收日期降序
  return list.slice().sort((a, b) => (b.receiveDate || '').localeCompare(a.receiveDate || ''))
})

// 分页数据
const pagedSamples = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredSamples.value.slice(start, start + pageSize)
})

// 表格多选
function checkSelectable(row) {
  return row.status === '待检'
}

function onSelectionChange(selection) {
  selectedSamples.value = selection
}

const canAssign = computed(() => selectedSamples.value.length > 0)

function onFilterChange() {
  currentPage.value = 1
}

function onDateRangeChange(val) {
  if (val && val.length === 2 && val[0] && val[1]) {
    if (val[0] === val[1]) {
      selectedDay.value = val[0]
    } else {
      selectedDay.value = ''
    }
  } else {
    selectedDay.value = ''
  }
  currentPage.value = 1
}

// 新增
function openAddDialog() {
  isEdit.value = false
  const maxId = sampleStore.sampleList.reduce((max, s) => {
    const num = parseInt((s.id || 'sample_0').replace('sample_', ''), 10)
    return isNaN(num) ? max : Math.max(max, num)
  }, 1000)
  form.value = {
    id: `sample_${maxId + 1}`,
    name: '',
    source: '',
    type: '',
    quantity: 1,
    receiveDate: '',
    description: ''
  }
  dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

function submitForm() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    if (isEdit.value) {
      sampleStore.update(form.value.id, { ...form.value })
      ElMessage.success('样品已更新')
    } else {
      sampleStore.add({ ...form.value })
      ElMessage.success('样品已添加')
    }
    dialogVisible.value = false
  })
}

function resetForm() {
  formRef.value?.resetFields()
  form.value = {
    id: '',
    name: '',
    source: '',
    type: '',
    quantity: 1,
    receiveDate: '',
    description: ''
  }
}

// 删除
function handleDelete(row) {
  ElMessageBox.confirm(`确定删除样品 "${row.name}"？删除后不可恢复。`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    sampleStore.remove(row.id)
    ElMessage.success('样品已删除')
  }).catch(() => {})
}

// 详情
function handleDetail(row) {
  detailItem.value = row
  // 关联任务
  detailTasks.value = detectTaskStore.detectTaskList.filter(t => t.sampleId === row.id)
  // 关联结果
  const taskIds = detailTasks.value.map(t => t.id)
  if (taskIds.length > 0) {
    detailResults.value = inspectionResultStore.inspectionResultList.filter(r => taskIds.includes(r.taskId))
  } else {
    detailResults.value = []
  }
  detailDrawer.value = true
}

// 分配任务
function openAssignDialog() {
  assignItems.value = []
  assignee.value = ''
  assignDialog.value = true
}

function removeSelectedSample(s) {
  selectedSamples.value = selectedSamples.value.filter(x => x.id !== s.id)
  if (selectedSamples.value.length === 0) {
    assignDialog.value = false
  }
}

function confirmAssign() {
  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const due = dayjs().add(7, 'day').format('YYYY-MM-DD')
  const itemStr = assignItems.value.join('、')
  selectedSamples.value.forEach(s => {
    // 创建任务
    const maxTaskId = detectTaskStore.detectTaskList.reduce((max, t) => {
      const num = parseInt((t.id || 'detecttask_0').replace('detecttask_', ''), 10)
      return isNaN(num) ? max : Math.max(max, num)
    }, 1000)
    const task = {
      id: `detecttask_${maxTaskId + 1}`,
      sampleId: s.id,
      assignee: assignee.value,
      status: '已分配',
      priority: '中',
      createDate: now,
      dueDate: due,
      remark: `检测项目：${itemStr}`
    }
    detectTaskStore.add(task)
    // 更新样品状态为检测中
    sampleStore.update(s.id, { status: '检测中' })
  })
  ElMessage.success(`已为 ${selectedSamples.value.length} 个样品分配检测任务`)
  assignDialog.value = false
  selectedSamples.value = []
}

// 导出
function handleExport() {
  const rows = filteredSamples.value
  if (rows.length === 0) {
    ElMessage.info('没有可导出的数据')
    return
  }
  const headers = ['样品编号', '样品名称', '来源', '类型', '数量', '接收日期', '状态', '备注']
  const csv = rows.map(row =>
    headers.map(h => {
      let val = ''
      if (h === '样品编号') val = row.id
      else if (h === '样品名称') val = row.name
      else if (h === '来源') val = row.source
      else if (h === '类型') val = row.type
      else if (h === '数量') val = row.quantity
      else if (h === '接收日期') val = row.receiveDate
      else if (h === '状态') val = row.status
      else if (h === '备注') val = row.description || ''
      return `"${String(val).replace(/"/g, '""')}"`
    }).join(',')
  ).join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `样品列表_${dayjs().format('YYYYMMDD')}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

// 状态标签映射
function statusTag(status) {
  const map = {
    '待检': 'info',
    '检测中': 'warning',
    '已完成': 'success',
    '不合格': 'danger'
  }
  return map[status] || 'info'
}

function taskStatusTag(status) {
  const map = {
    '待分配': 'info',
    '已分配': 'warning',
    '执行中': 'primary',
    '已完成': 'success',
    '已取消': 'info'
  }
  return map[status] || 'info'
}

function tableRowClassName({ row }) {
  return row.status === '待检' ? 'row-pending' : ''
}

// 工具
function min(a, b) { return a < b ? a : b }
const windowInnerWidth = inject('windowInnerWidth', ref(window.innerWidth))
</script>

<style scoped lang="scss">
@use './SampleRecords.scss' as *;
</style>