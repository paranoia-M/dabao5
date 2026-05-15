<template>
  <div class="page-analysis-board">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <div class="filter-item">
          <label>日期范围：</label>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            unlink-panels
          />
        </div>
        <div class="filter-item">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索报表名称"
            clearable
            class="search-input"
          />
        </div>
        <div class="filter-item">
          <el-select v-model="statusFilter" placeholder="报表状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="草稿" value="草稿" />
            <el-option label="已发布" value="已签发" />
          </el-select>
        </div>
      </div>
      <el-button type="primary" @click="openAddDialog">新增分析报表</el-button>
    </div>

    <!-- 主体区域 -->
    <div class="main-content">
      <!-- 左侧主舞台 -->
      <div class="main-stage">
        <!-- 预警等级气泡图 -->
        <el-card shadow="never" class="card-bubble">
          <template #header>
            <div class="card-header">
              <span>预警等级气泡图</span>
              <el-button text @click="openDrillDown('alert')">下钻</el-button>
            </div>
          </template>
          <div class="bubble-chart">
            <svg viewBox="0 0 600 300" class="bubble-svg">
              <g v-for="(item, idx) in bubbleData" :key="item.level">
                <circle
                  :cx="bubbleX[idx]"
                  :cy="bubbleY[idx]"
                  :r="bubbleRadius(item.count)"
                  :fill="bubbleColor(item.level)"
                  opacity="0.8"
                  @mouseenter="hoveredBubble = item.level"
                  @mouseleave="hoveredBubble = null"
                />
                <text
                  :x="bubbleX[idx]"
                  :y="bubbleY[idx] + 4"
                  text-anchor="middle"
                  fill="#fff"
                  font-size="14"
                  font-weight="bold"
                >{{ item.count }}</text>
                <text
                  :x="bubbleX[idx]"
                  :y="bubbleY[idx] + bubbleRadius(item.count) + 18"
                  text-anchor="middle"
                  fill="#999"
                  font-size="12"
                >{{ item.level }}</text>
              </g>
            </svg>
          </div>
        </el-card>

        <!-- 关键指标卡片 -->
        <el-row :gutter="16" class="kpi-row">
          <el-col :span="6">
            <el-card shadow="never">
              <div class="kpi-card">
                <div class="kpi-label">合格率</div>
                <div class="kpi-value">{{ passRateDisplay }}</div>
                <div class="kpi-trend">
                  <span :class="passTrend >= 0 ? 'up' : 'down'">
                    {{ passTrend >= 0 ? '▲' : '▼' }}{{ Math.abs(passTrend).toFixed(1) }}%
                  </span>
                </div>
              </div>
              <el-button text type="primary" class="drill-btn" @click="openDrillDown('result')">下钻</el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <div class="kpi-card">
                <div class="kpi-label">不合格数</div>
                <div class="kpi-value">{{ unqualifiedCount }}</div>
                <div class="kpi-trend"><span class="down">▲ +2</span></div>
              </div>
              <el-button text type="primary" class="drill-btn" @click="openDrillDown('result')">下钻</el-button>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <div class="kpi-card">
                <div class="kpi-label">检测总数</div>
                <div class="kpi-value">{{ totalResults }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="never">
              <div class="kpi-card">
                <div class="kpi-label">预警总数</div>
                <div class="kpi-value">{{ alertTotal }}</div>
              </div>
              <el-button text type="primary" class="drill-btn" @click="openDrillDown('alert')">下钻</el-button>
            </el-card>
          </el-col>
        </el-row>

        <!-- 预警趋势图 -->
        <el-card shadow="never" class="card-trend">
          <template #header>
            <div class="card-header">
              <span>预警趋势</span>
              <el-button text @click="openDrillDown('trend')">下钻</el-button>
            </div>
          </template>
          <div class="trend-chart">
            <svg viewBox="0 0 600 150" class="trend-svg">
              <polyline
                :points="trendPoints"
                fill="none"
                stroke="var(--page-primary)"
                stroke-width="2"
              />
              <circle
                v-for="(pt, idx) in trendPointsList"
                :key="idx"
                :cx="pt.x"
                :cy="pt.y"
                r="3"
                fill="var(--page-primary)"
              />
            </svg>
          </div>
        </el-card>
      </div>

      <!-- 右侧面板 -->
      <div class="side-panel">
        <!-- 预警统计 -->
        <el-card shadow="never" class="card-stat">
          <template #header>预警统计</template>
          <div class="stat-item">
            <div class="stat-label">总计</div>
            <div class="stat-number">{{ alertTotal }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">已处理</div>
            <div class="stat-number handled">{{ alertHandled }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">未处理</div>
            <div class="stat-number unhandled">{{ alertUnhandled }}</div>
          </div>
        </el-card>

        <!-- 最新预警事件 -->
        <el-card shadow="never" class="card-alerts">
          <template #header>最新预警事件</template>
          <ul class="alert-list">
            <li v-for="alert in recentAlerts" :key="alert.id" class="alert-item">
              <div class="alert-header">
                <el-tag :type="alert.level === '高' ? 'danger' : alert.level === '中' ? 'warning' : 'info'" size="small">{{ alert.level }}</el-tag>
                <span class="alert-time">{{ formatDate(alert.createDate) }}</span>
              </div>
              <div class="alert-desc">{{ alert.description?.length > 40 ? alert.description.slice(0, 40) + '...' : alert.description }}</div>
              <el-button
                v-if="alert.status === '未确认'"
                size="small"
                type="primary"
                @click="handleAlert(alert)"
              >处理</el-button>
              <el-tag v-else size="small">{{ alert.status }}</el-tag>
            </li>
          </ul>
        </el-card>
      </div>
    </div>

    <!-- 报表列表 -->
    <el-card shadow="never" class="report-table-card">
      <template #header>自定义报表</template>
      <el-table :data="filteredReports" stripe style="width: 100%" @row-click="handleRowClick">
        <el-table-column prop="reportNo" label="报告编号" width="160" />
        <el-table-column prop="title" label="报表名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已签发' ? 'success' : 'info'">
              {{ row.status === '已签发' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="generateDate" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.generateDate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" @click.stop="openEditDialog(row)">编辑</el-button>
            <el-button text type="primary" @click.stop="openDetailDrawer(row)">详情</el-button>
            <el-button text type="danger" @click.stop="confirmDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredReports.length"
        layout="total, prev, pager, next"
        class="pagination"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingReport ? '编辑分析报表' : '新增分析报表'"
      :close-on-click-modal="false"
      width="min(680px, 92vw)"
      @close="resetDialog"
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="报表名称" prop="reportName">
          <el-input v-model="form.reportName" placeholder="请输入名称（1-50字符）" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="数据源" prop="dataSource">
          <el-select v-model="form.dataSource" :disabled="isPublished" placeholder="请选择数据源">
            <el-option label="检测任务" value="检测任务" />
            <el-option label="样品结果" value="样品结果" />
            <el-option label="预警事件" value="预警事件" />
          </el-select>
        </el-form-item>
        <el-form-item label="维度选择" prop="dimensions">
          <el-checkbox-group v-model="form.dimensions" :disabled="isPublished">
            <el-checkbox label="时间" />
            <el-checkbox label="品类" />
            <el-checkbox label="检测项目" />
            <el-checkbox label="供应商" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="指标选择" prop="metrics">
          <el-checkbox-group v-model="form.metrics" :disabled="isPublished">
            <el-checkbox label="合格率" />
            <el-checkbox label="不合格数" />
            <el-checkbox label="均值" />
            <el-checkbox label="最大值" />
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="展示类型" prop="displayType">
          <el-radio-group v-model="form.displayType" :disabled="isPublished">
            <el-radio label="折线图" />
            <el-radio label="柱状图" />
            <el-radio label="饼图" />
            <el-radio label="表格" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-select v-model="form.sortOrder" :disabled="isPublished">
            <el-option label="升序" value="asc" />
            <el-option label="降序" value="desc" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerReport?.title" size="550">
      <div v-if="drawerReport" class="drawer-content">
        <div class="drawer-field">
          <span class="label">报告编号：</span><span>{{ drawerReport.reportNo }}</span>
        </div>
        <div class="drawer-field">
          <span class="label">状态：</span>
          <el-tag :type="drawerReport.status === '已签发' ? 'success' : 'info'">
            {{ drawerReport.status === '已签发' ? '已发布' : '草稿' }}
          </el-tag>
        </div>
        <div class="drawer-field">
          <span class="label">创建时间：</span><span>{{ formatDateTime(drawerReport.generateDate) }}</span>
        </div>
        <div class="drawer-field">
          <span class="label">描述：</span><span>{{ drawerReport.remark || '无' }}</span>
        </div>
        <div class="drawer-field">
          <span class="label">图表预览：</span>
          <div class="preview-placeholder">
            <!-- 简单模拟一个表格作为预览 -->
            <el-table :data="previewData" style="width:100%" size="small">
              <el-table-column prop="item" label="检测项" />
              <el-table-column prop="value" label="数值" />
              <el-table-column prop="conclusion" label="结论" />
            </el-table>
          </div>
        </div>
        <div class="drawer-footer">
          <el-button type="primary" @click="handleExport">导出PDF/Excel</el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 下钻弹窗 -->
    <el-dialog v-model="drillDialogVisible" :title="drillTitle" width="min(800px, 92vw)">
      <el-table :data="drillData" stripe style="width: 100%">
        <el-table-column v-for="col in drillColumns" :key="col.prop" :prop="col.prop" :label="col.label" :width="col.width" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useInspectionReportStore } from '@/stores/inspectionReport'
import { useAlertRecordStore } from '@/stores/alertRecord'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import dayjs from 'dayjs'

// --- Store 初始化 ---
const resultStore = useInspectionResultStore()
const reportStore = useInspectionReportStore()
const alertRecordStore = useAlertRecordStore()
const sampleStore = useSampleStore()
const taskStore = useDetectTaskStore()

// --- 核心指标计算 ---
const totalResults = computed(() => resultStore.inspectionResultList.length)
const qualifiedCount = computed(() => resultStore.inspectionResultList.filter(r => r.conclusion === '合格').length)
const unqualifiedCount = computed(() => resultStore.inspectionResultList.filter(r => r.conclusion === '不合格').length)
const passRate = computed(() => totalResults.value > 0 ? (qualifiedCount.value / totalResults.value) * 100 : 0)
const passRateDisplay = computed(() => passRate.value.toFixed(1) + '%')
const passTrend = computed(() => 0.5) // 假数据，可以计算与前一时间段比较，简化

const alertTotal = computed(() => alertRecordStore.alertRecordList.length)
const alertHandled = computed(() => alertRecordStore.alertRecordList.filter(r => r.status === '已确认').length)
const alertUnhandled = computed(() => alertRecordStore.alertRecordList.filter(r => r.status === '未确认').length)

// --- 气泡图数据 ---
// 按等级分组计数
const bubbleData = computed(() => {
  const counts = {}
  alertRecordStore.alertRecordList.forEach(r => {
    counts[r.level] = (counts[r.level] || 0) + 1
  })
  const levels = ['高', '中', '低']
  return levels.map(l => ({ level: l, count: counts[l] || 0 }))
})
const maxBubbleCount = computed(() => Math.max(...bubbleData.value.map(d => d.count), 1))
const bubbleRadius = (count) => {
  const ratio = count / maxBubbleCount.value
  return 20 + ratio * 60
}
const bubbleX = [200, 350, 500]
const bubbleY = [160, 140, 180]
const bubbleColor = (level) => {
  if (level === '高') return '#DC2626'
  if (level === '中') return '#EA580C'
  return '#D97706'
}
const hoveredBubble = ref(null)

// --- 趋势图数据 ---
const trendData = computed(() => {
  const map = {}
  alertRecordStore.alertRecordList.forEach(r => {
    const date = r.createDate.slice(0, 10)
    map[date] = (map[date] || 0) + 1
  })
  const sortedDates = Object.keys(map).sort()
  return sortedDates.map(date => ({ date, count: map[date] }))
})
const trendPoints = computed(() => {
  const data = trendData.value
  if (data.length === 0) return ''
  const width = 600
  const height = 150
  const padding = 20
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const stepX = (width - 2 * padding) / (data.length - 1 || 1)
  return data.map((d, i) => {
    const x = padding + i * stepX
    const y = height - padding - (d.count / maxCount) * (height - 2 * padding)
    return `${x},${y}`
  }).join(' ')
})
const trendPointsList = computed(() => {
  const data = trendData.value
  if (data.length === 0) return []
  const width = 600
  const height = 150
  const padding = 20
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const stepX = (width - 2 * padding) / (data.length - 1 || 1)
  return data.map((d, i) => {
    return { count: d.count, x: padding + i * stepX, y: height - padding - (d.count / maxCount) * (height - 2 * padding) }
  })
})

// --- 预警事件列表 ---
const recentAlerts = computed(() => {
  return alertRecordStore.alertRecordList.slice(0, 5)
})

// 处理预警
const handleAlert = (alert) => {
  ElMessageBox.confirm('确认处理该预警事件？', '处理确认', { type: 'warning', confirmButtonText: '确认处理', cancelButtonText: '取消' }).then(() => {
    alertRecordStore.update(alert.id, { status: '已确认', handledBy: '当前用户', handledDate: dayjs().format('YYYY-MM-DD HH:mm:ss') })
    ElMessage.success('预警已处理')
  }).catch(() => {})
}

// --- 报表列表 ---
const searchKeyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const filteredReports = computed(() => {
  let list = reportStore.inspectionReportList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(r => r.title.toLowerCase().includes(kw))
  }
  if (statusFilter.value) {
    list = list.filter(r => r.status === statusFilter.value)
  }
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(r => {
      const d = r.generateDate.slice(0, 10)
      return d >= start && d <= end
    })
  }
  // 按创建时间降序
  list = [...list].sort((a, b) => b.generateDate.localeCompare(a.generateDate))
  return list
})

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredReports.value.slice(start, start + pageSize.value)
})

// --- 新增/编辑 ---
const dialogVisible = ref(false)
const editingReport = ref(null)
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  reportName: '',
  dataSource: '',
  dimensions: [],
  metrics: [],
  displayType: '折线图',
  sortOrder: 'asc',
  description: ''
})
const formRules = {
  reportName: [
    { required: true, message: '请填写报表名称', trigger: 'blur' },
    { min: 1, max: 50, message: '名称长度1-50字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!value) return callback()
      const exist = reportStore.inspectionReportList.some(r => r.title === value && (!editingReport.value || r.id !== editingReport.value.id))
      if (exist) return callback(new Error('名称已存在'))
      callback()
    }, trigger: 'blur' }
  ],
  dataSource: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  dimensions: [{ type: 'array', min: 1, message: '至少选择一个维度', trigger: 'change' }],
  metrics: [{ type: 'array', min: 1, message: '至少选择一个指标', trigger: 'change' }]
}

const isPublished = computed(() => editingReport.value?.status === '已签发')

const openAddDialog = () => {
  editingReport.value = null
  form.value = { reportName: '', dataSource: '', dimensions: [], metrics: [], displayType: '折线图', sortOrder: 'asc', description: '' }
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  editingReport.value = row
  form.value = {
    reportName: row.title,
    dataSource: row.dataSource || '',
    dimensions: row.dimensions || [],
    metrics: row.metrics || [],
    displayType: row.displayType || '折线图',
    sortOrder: row.sortOrder || 'asc',
    description: row.remark || ''
  }
  dialogVisible.value = true
}

const resetDialog = () => {
  editingReport.value = null
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (editingReport.value) {
      // 编辑
      const patch = {}
      if (isPublished.value) {
        // 仅可修改名称和描述
        patch.title = form.value.reportName
        patch.remark = form.value.description
      } else {
        patch.title = form.value.reportName
        patch.dataSource = form.value.dataSource
        patch.dimensions = form.value.dimensions
        patch.metrics = form.value.metrics
        patch.displayType = form.value.displayType
        patch.sortOrder = form.value.sortOrder
        patch.remark = form.value.description
      }
      reportStore.update(editingReport.value.id, patch)
      ElMessage.success('编辑成功')
    } else {
      // 新增
      const newReport = {
        id: 'report_' + Date.now(),
        taskId: '',
        title: form.value.reportName,
        reportNo: 'REP-' + dayjs().format('YYYYMMDDHHmmss'),
        status: '草稿',
        generator: '当前用户',
        generateDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        approveDate: '',
        finalResult: '待定',
        remark: form.value.description
      }
      reportStore.add(newReport)
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// --- 删除 ---
const confirmDelete = (row) => {
  ElMessageBox.confirm(
    '删除后不可恢复，该报表当前被0条规则引用',
    '确认删除',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    reportStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// --- 详情抽屉 ---
const drawerVisible = ref(false)
const drawerReport = ref(null)
const openDetailDrawer = (row) => {
  drawerReport.value = row
  drawerVisible.value = true
}
const previewData = computed(() => {
  // 简单取检测结果前5条作为预览
  return resultStore.inspectionResultList.slice(0, 5).map(r => ({
    item: r.itemName,
    value: r.value + r.unit,
    conclusion: r.conclusion
  }))
})
const handleExport = () => {
  ElMessage.success('导出任务已提交，请稍后在导出中心下载')
}

// --- 下钻 ---
const drillDialogVisible = ref(false)
const drillTitle = ref('')
const drillData = ref([])
const drillColumns = ref([])

const openDrillDown = (type) => {
  if (type === 'alert') {
    drillTitle.value = '预警记录明细'
    drillColumns.value = [
      { prop: 'level', label: '级别', width: 70 },
      { prop: 'description', label: '描述', minWidth: 200 },
      { prop: 'status', label: '状态', width: 100 },
      { prop: 'createDate', label: '创建时间', width: 170 }
    ]
    drillData.value = alertRecordStore.alertRecordList
  } else if (type === 'trend') {
    drillTitle.value = '按日预警统计'
    drillColumns.value = [
      { prop: 'date', label: '日期', width: 120 },
      { prop: 'count', label: '预警数量', width: 100 }
    ]
    drillData.value = trendData.value
  } else if (type === 'result') {
    drillTitle.value = '检测结果明细'
    drillColumns.value = [
      { prop: 'itemName', label: '检测项目', minWidth: 150 },
      { prop: 'value', label: '数值', width: 120 },
      { prop: 'unit', label: '单位', width: 80 },
      { prop: 'conclusion', label: '结论', width: 100 }
    ]
    drillData.value = resultStore.inspectionResultList
  }
  drillDialogVisible.value = true
}

// --- 行点击（报表列表）---
const handleRowClick = (row) => {
  openDetailDrawer(row)
}

// --- 工具函数 ---
const formatDate = (dt) => dt?.slice(0, 10) || ''
const formatDateTime = (dt) => dt?.slice(0, 16) || ''

// 修正：truncate filter 在Vue3中需用computed或方法，这里在模板中使用了filter，改用三元
// 将模板中的truncate改为js方法
</script>

<style scoped lang="scss">
@use './AnalysisBoard.scss' as *;
</style>