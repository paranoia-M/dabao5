<template>
  <div class="page-detect-task">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="filter-area">
        <el-input
          v-model="keyword"
          placeholder="搜索任务编号/样品名称"
          clearable
          class="filter-item"
          @input="handleSearch"
        />
        <el-select
          v-model="filterStatus"
          placeholder="任务状态"
          clearable
          class="filter-item"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option
            v-for="s in statusOptions"
            :key="s.value"
            :label="s.label"
            :value="s.value"
          />
        </el-select>
        <el-select
          v-model="filterPriority"
          placeholder="优先级"
          clearable
          class="filter-item"
          @change="handleSearch"
        >
          <el-option label="全部" value="" />
          <el-option label="高" value="高" />
          <el-option label="中" value="中" />
          <el-option label="低" value="低" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="创建日期起"
          end-placeholder="创建日期止"
          value-format="YYYY-MM-DD"
          class="filter-item"
          @change="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
      </div>
      <div class="action-group">
        <el-button type="primary" :icon="Plus" @click="showCreateDialog">新增任务</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="User" @click="showBatchAssign">批量分配</el-button>
      </div>
    </div>

    <!-- KPI 状态分布卡片 -->
    <div class="kpi-row">
      <div
        v-for="item in kpiList"
        :key="item.key"
        class="kpi-card"
        :style="{ '--kpi-color': item.color }"
        @click="filterStatus = item.key; handleSearch()"
      >
        <span class="kpi-label">{{ item.label }}</span>
        <span class="kpi-value">{{ item.count }}</span>
        <span class="kpi-bar" :style="{ width: item.ratio + '%' }" />
      </div>
    </div>

    <!-- 主内容区：瀑布图 + 详情面板 -->
    <div class="content-section">
      <div class="waterfall-wrapper">
        <svg
          ref="svgRef"
          :width="svgWidth"
          :height="svgHeight"
          class="waterfall-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 连接线 -->
          <path
            v-for="(line, li) in connectLines"
            :key="'line-' + li"
            :d="line.path"
            fill="none"
            stroke="#9CA3AF"
            stroke-width="2"
            stroke-dasharray="4,3"
          />
          <circle
            v-for="(line, li) in connectLines"
            :key="'dot-' + li"
            :cx="line.x2"
            :cy="line.y2"
            r="4"
            fill="#9CA3AF"
          />

          <!-- 任务节点 -->
          <g
            v-for="(task, ti) in sortedTasks"
            :key="task.id"
            :transform="`translate(${nodeX}, ${nodeY(ti)})`"
            class="task-node"
            :class="{ 'is-selected': selectedTask?.id === task.id }"
            @click="selectTask(task)"
          >
            <!-- 优先级色条 -->
            <rect
              x="0"
              y="0"
              width="6"
              height="70"
              :fill="priorityColor(task.priority)"
              rx="3"
            />
            <!-- 卡片背景 -->
            <rect
              x="6"
              y="0"
              :width="cardWidth"
              height="70"
              :fill="selectedTask?.id === task.id ? '#F3F4F6' : '#FFFFFF'"
              stroke="#E5E7EB"
              stroke-width="1"
              rx="6"
              class="card-bg"
            />
            <!-- 任务编号 -->
            <text
              x="20"
              y="22"
              font-size="14"
              font-weight="600"
              fill="#1F2937"
              class="task-id-text"
            >
              {{ task.id }}
            </text>
            <!-- 样品名 -->
            <text
              x="20"
              y="44"
              font-size="13"
              fill="#4B5563"
            >
              {{ getSampleName(task) }}
            </text>
            <!-- 截止日期 -->
            <text
              :x="20 + cardWidth - 80"
              y="22"
              font-size="12"
              fill="#9CA3AF"
              text-anchor="end"
            >
              {{ formatDate(task.dueDate) }}
            </text>
            <!-- 状态标签 -->
            <rect
              :x="20 + cardWidth - 70"
              y="30"
              width="60"
              height="22"
              :fill="statusTagColor(task.status).bg"
              rx="11"
            />
            <text
              :x="20 + cardWidth - 40"
              y="44"
              font-size="11"
              :fill="statusTagColor(task.status).fg"
              text-anchor="middle"
              font-weight="500"
            >
              {{ task.status }}
            </text>
            <!-- 优先级标识 -->
            <text
              x="20"
              y="62"
              font-size="11"
              :fill="priorityColor(task.priority)"
            >
              {{ task.priority === '高' ? '⚡' : task.priority === '中' ? '●' : '○' }} {{ task.priority }}
            </text>
          </g>
        </svg>
        <div v-if="sortedTasks.length === 0" class="empty-waterfall">
          <el-empty description="暂无检测任务数据" />
        </div>
      </div>

      <!-- 右侧详情面板 -->
      <div class="detail-panel">
        <div v-if="selectedTask" class="detail-inner">
          <div class="detail-header">
            <h3>{{ selectedTask.id }}</h3>
            <el-tag
              :type="statusTagType(selectedTask.status)"
              size="small"
            >
              {{ selectedTask.status }}
            </el-tag>
          </div>
          <el-divider />
          <div class="detail-body">
            <div class="detail-row">
              <span class="label">样品名称</span>
              <span class="value">{{ getSampleName(selectedTask) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">样品来源</span>
              <span class="value">{{ getSampleSource(selectedTask) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">检测人员</span>
              <span class="value">{{ selectedTask.assignee || '未分配' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">优先级</span>
              <span class="value" :style="{ color: priorityColor(selectedTask.priority) }">
                {{ selectedTask.priority }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">创建时间</span>
              <span class="value">{{ selectedTask.createDate }}</span>
            </div>
            <div class="detail-row">
              <span class="label">计划完成</span>
              <span class="value">{{ formatDate(selectedTask.dueDate) }}</span>
            </div>
            <div class="detail-row detail-remark">
              <span class="label">备注</span>
              <span class="value">{{ selectedTask.remark || '无' }}</span>
            </div>
            <div class="detail-row detail-items">
              <span class="label">检测项目</span>
              <span class="value">{{ getTaskItems(selectedTask) }}</span>
            </div>
          </div>
          <el-divider />
          <!-- 状态流转操作区 -->
          <div class="detail-actions">
            <template v-if="selectedTask.status === '待分配'">
              <el-button type="primary" size="small" @click="handleAssign(selectedTask)">
                分配任务
              </el-button>
              <el-button size="small" @click="showEditDialog(selectedTask)">
                编辑
              </el-button>
              <el-button size="small" type="danger" plain @click="handleDelete(selectedTask)">
                删除
              </el-button>
            </template>
            <template v-else-if="selectedTask.status === '已分配'">
              <el-button type="success" size="small" @click="handleStartDetect(selectedTask)">
                开始检测
              </el-button>
            </template>
            <template v-else-if="selectedTask.status === '检测中'">
              <el-button type="primary" size="small" @click="handleComplete(selectedTask)">
                完成检测
              </el-button>
              <el-button size="small" @click="handleViewResult(selectedTask)">
                查看结果
              </el-button>
            </template>
            <template v-else-if="selectedTask.status === '已完成'">
              <el-button type="warning" size="small" @click="handleReview(selectedTask)">
                审核通过
              </el-button>
              <el-button size="small" @click="handleViewResult(selectedTask)">
                查看结果
              </el-button>
            </template>
            <template v-else-if="selectedTask.status === '已审核'">
              <el-tag type="success" effect="dark">已完结</el-tag>
              <el-button size="small" @click="handleViewReport(selectedTask)">
                查看报告
              </el-button>
            </template>
            <el-button
              v-if="selectedTask.status !== '已审核' && selectedTask.status !== '已完成'"
              size="small"
              type="info"
              plain
              @click="handleCancel(selectedTask)"
            >
              取消任务
            </el-button>
          </div>
        </div>
        <div v-else class="detail-empty">
          <el-empty description="点击左侧任务节点查看详情" />
        </div>
      </div>
    </div>

    <!-- 底部统计 -->
    <div class="bottom-stats">
      <span>任务总数：<strong>{{ detectTaskStore.detectTaskList.length }}</strong></span>
      <span>待分配：<strong>{{ statusCount['待分配'] }}</strong></span>
      <span>已分配：<strong>{{ statusCount['已分配'] }}</strong></span>
      <span>检测中：<strong>{{ statusCount['检测中'] }}</strong></span>
      <span>已完成：<strong>{{ statusCount['已完成'] }}</strong></span>
      <span>已审核：<strong>{{ statusCount['已审核'] }}</strong></span>
      <span>今日创建：<strong>{{ todayCount }}</strong></span>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑检测任务' : '新增检测任务'"
      :width="min(720, 92) + 'vw'"
      top="5vh"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
        label-position="right"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务编号" prop="id">
              <el-input v-model="form.id" :disabled="isEdit" placeholder="自动生成或手动输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="样品名称" prop="sampleId">
              <el-select
                v-model="form.sampleId"
                placeholder="选择样品"
                filterable
                clearable
                style="width:100%"
              >
                <el-option
                  v-for="s in sampleStore.sampleList"
                  :key="s.id"
                  :label="s.name + ' (' + s.source + ')'"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="样品来源" prop="source">
              <el-select v-model="form.source" placeholder="选择来源" style="width:100%">
                <el-option label="市场抽检" value="市场抽检" />
                <el-option label="企业送检" value="企业送检" />
                <el-option label="委托检测" value="委托检测" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测项目" prop="items">
              <el-select
                v-model="form.items"
                multiple
                filterable
                placeholder="选择检测项目（至少1项）"
                style="width:100%"
                @change="onItemsChange"
              >
                <el-option
                  v-for="std in standardOptions"
                  :key="std.itemName"
                  :label="std.itemName + ' (' + std.standardCode + ')'"
                  :value="std.itemName"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="检测标准" prop="standardId">
              <el-select
                v-model="form.standardId"
                placeholder="随检测项目联动"
                filterable
                style="width:100%"
                :disabled="form.items.length === 0"
              >
                <el-option
                  v-for="std in filteredStandards"
                  :key="std.id"
                  :label="std.name + ' (' + std.standardCode + ')'"
                  :value="std.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="检测人员" prop="assignee">
              <el-select v-model="form.assignee" placeholder="选填" clearable style="width:100%">
                <el-option
                  v-for="p in personList"
                  :key="p"
                  :label="p"
                  :value="p"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划完成日期" prop="dueDate">
              <el-date-picker
                v-model="form.dueDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width:100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="选择优先级" style="width:100%">
                <el-option label="普通" value="中" />
                <el-option label="紧急" value="高" />
                <el-option label="加急" value="高" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="备注信息（选填）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmForm">
          {{ isEdit ? '保存修改' : '创建任务' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 分配人员弹窗 -->
    <el-dialog
      v-model="assignVisible"
      title="分配检测人员"
      width="480px"
      :close-on-click-modal="false"
    >
      <div v-if="assignMode === 'single'" class="assign-body">
        <p>为任务 <strong>{{ assignTarget?.id }}</strong> 分配检测人员：</p>
        <el-select v-model="assignPerson" placeholder="选择检测人员" style="width:100%" filterable>
          <el-option
            v-for="p in personList"
            :key="p"
            :label="p"
            :value="p"
          />
        </el-select>
      </div>
      <div v-else class="assign-body">
        <p>已选择 <strong>{{ batchSelected.length }}</strong> 个任务，请选择要分配的检测人员：</p>
        <el-select v-model="assignPerson" placeholder="选择检测人员" style="width:100%" filterable>
          <el-option
            v-for="p in personList"
            :key="p"
            :label="p"
            :value="p"
          />
        </el-select>
        <el-table
          :data="batchSelected"
          style="margin-top:16px;max-height:200px;overflow-y:auto"
          size="small"
          border
        >
          <el-table-column prop="id" label="任务编号" width="160" />
          <el-table-column prop="status" label="状态" width="80" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!assignPerson" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="drawerTask?.id || '任务详情'"
      size="500px"
      direction="rtl"
    >
      <div v-if="drawerTask" class="drawer-body">
        <div class="drawer-section">
          <h4>基本信息</h4>
          <div class="drawer-grid">
            <div class="drawer-item">
              <span class="d-label">任务编号</span>
              <span class="d-value">{{ drawerTask.id }}</span>
            </div>
            <div class="drawer-item">
              <span class="d-label">任务状态</span>
              <el-tag :type="statusTagType(drawerTask.status)" size="small">{{ drawerTask.status }}</el-tag>
            </div>
            <div class="drawer-item">
              <span class="d-label">创建人</span>
              <span class="d-value">{{ drawerTask.assignee || '系统' }}</span>
            </div>
            <div class="drawer-item">
              <span class="d-label">创建时间</span>
              <span class="d-value">{{ drawerTask.createDate }}</span>
            </div>
            <div class="drawer-item">
              <span class="d-label">计划完成</span>
              <span class="d-value">{{ formatDate(drawerTask.dueDate) }}</span>
            </div>
            <div class="drawer-item">
              <span class="d-label">优先级</span>
              <span class="d-value" :style="{ color: priorityColor(drawerTask.priority) }">{{ drawerTask.priority }}</span>
            </div>
          </div>
        </div>
        <el-divider />
        <div class="drawer-section">
          <h4>样品信息</h4>
          <el-table :data="sampleInfoRows" size="small" border style="width:100%">
            <el-table-column prop="label" label="属性" width="80" />
            <el-table-column prop="value" label="值" />
          </el-table>
        </div>
        <el-divider />
        <div class="drawer-section">
          <h4>检测项目与结果</h4>
          <div v-if="taskResults.length === 0" class="no-result">暂无检测结果记录</div>
          <el-table v-else :data="taskResults" size="small" border style="width:100%">
            <el-table-column prop="itemName" label="检测项目" />
            <el-table-column prop="value" label="检测值" width="80" />
            <el-table-column prop="unit" label="单位" width="60" />
            <el-table-column prop="conclusion" label="结论" width="70">
              <template #default="{ row }">
                <el-tag :type="row.conclusion === '合格' ? 'success' : row.conclusion === '不合格' ? 'danger' : 'warning'" size="small">
                  {{ row.conclusion }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <el-divider />
        <div class="drawer-section">
          <h4>预警标记</h4>
          <div v-if="taskAlerts.length === 0" class="no-result">无预警</div>
          <div v-else>
            <el-tag
              v-for="a in taskAlerts"
              :key="a.id"
              :type="a.level === '高' ? 'danger' : a.level === '中' ? 'warning' : 'info'"
              style="margin-right:8px;margin-bottom:8px"
            >
              {{ a.level }}: {{ a.description.slice(0, 20) }}...
            </el-tag>
          </div>
        </div>
      </div>
    </el-drawer>

    <!-- 查看结果弹窗 -->
    <el-dialog
      v-model="resultVisible"
      title="检测结果"
      width="640px"
    >
      <el-table v-if="taskResults.length > 0" :data="taskResults" border size="small" style="width:100%">
        <el-table-column prop="itemName" label="检测项目" />
        <el-table-column prop="value" label="检测值" />
        <el-table-column prop="unit" label="单位" />
        <el-table-column prop="conclusion" label="结论">
          <template #default="{ row }">
            <el-tag :type="row.conclusion === '合格' ? 'success' : row.conclusion === '不合格' ? 'danger' : 'warning'" size="small">
              {{ row.conclusion }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="testDate" label="检测日期" width="100" />
      </el-table>
      <el-empty v-else description="暂无检测结果数据" />
      <template #footer>
        <el-button @click="resultVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Download,
  Search,
  User
} from '@element-plus/icons-vue'
import { useSampleStore } from '@/stores/sample'
import { useDetectTaskStore } from '@/stores/detectTask'
import { useInspectionResultStore } from '@/stores/inspectionResult'
import { useInspectionReportStore } from '@/stores/inspectionReport'
import { useDetectStandardStore } from '@/stores/detectStandard'
import { useAlertRecordStore } from '@/stores/alertRecord'

const min = (a, b) => a < b ? a : b

/* ========== store ========== */
const sampleStore = useSampleStore()
const detectTaskStore = useDetectTaskStore()
const inspectionResultStore = useInspectionResultStore()
const inspectionReportStore = useInspectionReportStore()
const detectStandardStore = useDetectStandardStore()
const alertRecordStore = useAlertRecordStore()

/* ========== 常量 ========== */
const statusOptions = [
  { label: '待分配', value: '待分配' },
  { label: '已分配', value: '已分配' },
  { label: '检测中', value: '检测中' },
  { label: '已完成', value: '已完成' },
  { label: '已审核', value: '已审核' }
]

const personList = ['张伟', '李娜', '王芳', '刘洋', '陈静', '赵鑫', '孙丽', '周磊', '吴敏']

const statusColorMap = {
  '待分配': { bg: '#FEF3C7', fg: '#92400E' },
  '已分配': { bg: '#DBEAFE', fg: '#1E40AF' },
  '检测中': { bg: '#E0E7FF', fg: '#3730A3' },
  '已完成': { bg: '#D1FAE5', fg: '#065F46' },
  '已审核': { bg: '#ECFDF5', fg: '#047857' }
}

/* ========== 筛选状态 ========== */
const keyword = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const dateRange = ref([])
const filteredList = computed(() => {
  let list = detectTaskStore.detectTaskList
  if (keyword.value) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(t =>
      t.id.toLowerCase().includes(kw) ||
      getSampleName(t).toLowerCase().includes(kw)
    )
  }
  if (filterStatus.value) {
    list = list.filter(t => t.status === filterStatus.value)
  }
  if (filterPriority.value) {
    list = list.filter(t => t.priority === filterPriority.value)
  }
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = dateRange.value[0]
    const end = dateRange.value[1]
    list = list.filter(t => {
      const d = t.createDate.slice(0, 10)
      return d >= start && d <= end
    })
  }
  return list.slice().sort((a, b) => b.createDate.localeCompare(a.createDate))
})

/* ========== 排序（按状态流程排列） ========== */
const statusOrder = ['待分配', '已分配', '检测中', '已完成', '已审核']
const sortedTasks = computed(() => {
  const list = [...filteredList.value]
  list.sort((a, b) => {
    const oa = statusOrder.indexOf(a.status)
    const ob = statusOrder.indexOf(b.status)
    if (oa !== ob) return oa - ob
    return b.createDate.localeCompare(a.createDate)
  })
  return list
})

/* ========== KPI ========== */
const statusCount = computed(() => {
  const map = { '待分配': 0, '已分配': 0, '检测中': 0, '已完成': 0, '已审核': 0 }
  detectTaskStore.detectTaskList.forEach(t => {
    if (map[t.status] !== undefined) map[t.status]++
  })
  return map
})
const totalTasks = computed(() => detectTaskStore.detectTaskList.length)
const todayCount = computed(() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  const prefix = `${y}-${m}-${d}`
  return detectTaskStore.detectTaskList.filter(t => t.createDate.startsWith(prefix)).length
})
const kpiList = computed(() => {
  const total = totalTasks.value || 1
  return statusOptions.map(s => ({
    key: s.value,
    label: s.label,
    count: statusCount.value[s.value] || 0,
    ratio: ((statusCount.value[s.value] || 0) / total) * 100,
    color: statusColorMap[s.value]?.bg || '#E5E7EB'
  }))
})

/* ========== 工具函数 ========== */
const getSampleName = (task) => {
  if (!task?.sampleId) return '未知样品'
  const s = sampleStore.findById(task.sampleId)
  return s ? s.name : '未知样品'
}
const getSampleSource = (task) => {
  if (!task?.sampleId) return '—'
  const s = sampleStore.findById(task.sampleId)
  return s ? s.source : '—'
}
const getTaskItems = (task) => {
  if (!task) return '—'
  if (task.remark && task.remark.startsWith('{')) {
    try {
      const parsed = JSON.parse(task.remark)
      if (Array.isArray(parsed.items)) {
        return parsed.items.map(i => i.name).join('、') || '—'
      }
    } catch (_) {}
  }
  const results = inspectionResultStore.inspectionResultList.filter(r => r.taskId === task.id)
  if (results.length > 0) {
    return results.map(r => r.itemName).join('、')
  }
  return '—'
}
const formatDate = (d) => {
  if (!d) return '—'
  return d.slice(0, 10)
}
const priorityColor = (p) => {
  if (p === '高') return '#DC2626'
  if (p === '中') return '#D97706'
  return '#3B82F6'
}
const statusTagColor = (s) => {
  return statusColorMap[s] || { bg: '#F3F4F6', fg: '#4B5563' }
}
const statusTagType = (s) => {
  const map = { '待分配': 'warning', '已分配': 'primary', '检测中': '', '已完成': 'success', '已审核': 'success' }
  return map[s] || 'info'
}

/* ========== 瀑布图SVG ========== */
const svgRef = ref(null)
const cardWidth = 280
const nodeX = 40
const nodeGap = 20
const nodeHeight = 70
const svgWidth = computed(() => nodeX * 2 + cardWidth + 60)
const svgHeight = computed(() => {
  const len = sortedTasks.value.length
  if (len === 0) return 120
  return len * (nodeHeight + nodeGap) + 40
})
const nodeY = (i) => 20 + i * (nodeHeight + nodeGap)

const connectLines = computed(() => {
  const lines = []
  const len = sortedTasks.value.length
  for (let i = 0; i < len - 1; i++) {
    const y1 = nodeY(i) + nodeHeight
    const y2 = nodeY(i + 1)
    const cx = nodeX + cardWidth / 2
    lines.push({
      path: `M${cx},${y1} C${cx},${(y1 + y2) / 2} ${cx},${(y1 + y2) / 2} ${cx},${y2}`,
      x2: cx,
      y2
    })
  }
  return lines
})

/* ========== 选中任务 ========== */
const selectedTask = ref(null)
const selectTask = (task) => {
  selectedTask.value = task
}

/* ========== 搜索 ========== */
const handleSearch = () => {
  selectedTask.value = null
}

/* ========== 新增/编辑 ========== */
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const form = ref({
  id: '',
  sampleId: '',
  source: '',
  items: [],
  standardId: '',
  assignee: '',
  dueDate: '',
  priority: '中',
  remark: ''
})

const standardOptions = computed(() => {
  const map = new Map()
  detectStandardStore.detectStandardList.forEach(s => {
    if (s.status !== false) {
      map.set(s.itemName, s)
    }
  })
  return Array.from(map.values())
})

const filteredStandards = computed(() => {
  if (form.value.items.length === 0) return []
  return detectStandardStore.detectStandardList.filter(s =>
    form.value.items.includes(s.itemName) && s.status !== false
  )
})

const generateTaskId = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const prefix = `RQ${y}${m}${d}`
  const existing = detectTaskStore.detectTaskList.filter(t => t.id.startsWith(prefix))
  const seq = existing.length + 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

const formRules = {
  sampleId: [{ required: true, message: '请选择样品', trigger: 'change' }],
  source: [{ required: true, message: '请选择样品来源', trigger: 'change' }],
  items: [{ required: true, message: '请至少选择一个检测项目', trigger: 'change' }],
  dueDate: [{ required: true, message: '请选择计划完成日期', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
}

const onItemsChange = (val) => {
  form.value.standardId = ''
  if (val.length > 0 && filteredStandards.value.length > 0) {
    form.value.standardId = filteredStandards.value[0].id
  }
}

const showCreateDialog = () => {
  isEdit.value = false
  form.value = {
    id: generateTaskId(),
    sampleId: '',
    source: '',
    items: [],
    standardId: '',
    assignee: '',
    dueDate: '',
    priority: '中',
    remark: ''
  }
  // 如果有样品列表，默认第一个
  if (sampleStore.sampleList.length > 0) {
    // 不默认选中，让用户自己选
  }
  dialogVisible.value = true
}

const showEditDialog = (task) => {
  if (task.status !== '待分配') {
    ElMessage.warning('仅待分配状态的任务可编辑')
    return
  }
  isEdit.value = true
  const sample = task.sampleId ? sampleStore.findById(task.sampleId) : null
  let items = []
  let standardId = ''
  if (task.remark && task.remark.startsWith('{')) {
    try {
      const parsed = JSON.parse(task.remark)
      if (Array.isArray(parsed.items)) {
        items = parsed.items.map(i => i.name)
        standardId = parsed.items[0]?.standardId || ''
      }
    } catch (_) {}
  }
  form.value = {
    id: task.id,
    sampleId: task.sampleId || '',
    source: sample?.source || '市场抽检',
    items: items,
    standardId: standardId,
    assignee: task.assignee || '',
    dueDate: task.dueDate || '',
    priority: task.priority || '中',
    remark: task.remark || ''
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const confirmForm = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  if (form.value.items.length === 0) {
    ElMessage.warning('请至少选择一项检测项目')
    return
  }
  if (!form.value.standardId && filteredStandards.value.length > 0) {
    ElMessage.warning('请选择检测标准')
    return
  }
  submitting.value = true
  try {
    const now = new Date()
    const createDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    // 构造任务数据
    const taskData = {
      id: form.value.id,
      sampleId: form.value.sampleId,
      assignee: form.value.assignee || '',
      status: '待分配',
      priority: form.value.priority,
      createDate: createDate,
      dueDate: form.value.dueDate,
      remark: JSON.stringify({
        items: form.value.items.map(name => ({
          name,
          standardId: form.value.standardId || ''
        })),
        source: form.value.source
      })
    }

    if (isEdit.value) {
      // 编辑：更新任务
      detectTaskStore.update(form.value.id, taskData)
      ElMessage.success('任务已更新')
    } else {
      // 新增
      detectTaskStore.add(taskData)
      ElMessage.success('任务创建成功')
    }

    dialogVisible.value = false
    selectedTask.value = null
    // 强制刷新视图
    await nextTick()
    // 自动选中新创建/编辑的任务
    const updated = detectTaskStore.findById(form.value.id)
    if (updated) selectedTask.value = updated
  } catch (e) {
    ElMessage.error('操作失败：' + (e.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

/* ========== 删除 ========== */
const handleDelete = async (task) => {
  if (!task) return
  // 检查是否关联检测结果
  const hasResult = inspectionResultStore.inspectionResultList.some(r => r.taskId === task.id)
  if (hasResult) {
    ElMessage.warning('任务已有检测结果，无法删除，请先清除结果')
    return
  }
  let msg = `确定删除任务「${task.id}」吗？`
  if (task.assignee) {
    msg = '该任务已分配，删除将同时取消分配，是否继续？'
  }
  try {
    await ElMessageBox.confirm(msg, '删除确认', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    detectTaskStore.remove(task.id)
    ElMessage.success('任务已删除')
    if (selectedTask.value?.id === task.id) {
      selectedTask.value = null
    }
  } catch (_) {}
}

/* ========== 分配 ========== */
const assignVisible = ref(false)
const assignMode = ref('single')
const assignTarget = ref(null)
const assignPerson = ref('')
const batchSelected = ref([])

const handleAssign = (task) => {
  assignMode.value = 'single'
  assignTarget.value = task
  assignPerson.value = ''
  assignVisible.value = true
}

const showBatchAssign = () => {
  const available = filteredList.value.filter(t => t.status === '待分配')
  if (available.length === 0) {
    ElMessage.info('没有可分配的待分配任务')
    return
  }
  assignMode.value = 'batch'
  batchSelected.value = available
  assignPerson.value = ''
  assignVisible.value = true
}

const confirmAssign = () => {
  if (!assignPerson.value) {
    ElMessage.warning('请选择检测人员')
    return
  }
  if (assignMode.value === 'single' && assignTarget.value) {
    detectTaskStore.update(assignTarget.value.id, {
      assignee: assignPerson.value,
      status: '已分配'
    })
    ElMessage.success(`已分配至 ${assignPerson.value}`)
  } else if (assignMode.value === 'batch') {
    batchSelected.value.forEach(t => {
      detectTaskStore.update(t.id, {
        assignee: assignPerson.value,
        status: '已分配'
      })
    })
    ElMessage.success(`已批量分配 ${batchSelected.value.length} 个任务`)
  }
  assignVisible.value = false
  selectedTask.value = null
}

/* ========== 状态流转 ========== */
const handleStartDetect = (task) => {
  detectTaskStore.update(task.id, { status: '检测中' })
  ElMessage.success('任务已开始检测')
  selectedTask.value = detectTaskStore.findById(task.id)
}

const handleComplete = (task) => {
  detectTaskStore.update(task.id, { status: '已完成' })
  ElMessage.success('任务已完成')
  selectedTask.value = detectTaskStore.findById(task.id)
}

const handleReview = (task) => {
  detectTaskStore.update(task.id, { status: '已审核' })
  ElMessage.success('任务已审核通过')
  selectedTask.value = detectTaskStore.findById(task.id)
}

const handleCancel = (task) => {
  if (task.status === '已审核' || task.status === '已完成') {
    ElMessage.warning('该状态不可取消')
    return
  }
  detectTaskStore.update(task.id, { status: '已取消' })
  ElMessage.success('任务已取消')
  selectedTask.value = detectTaskStore.findById(task.id)
}

/* ========== 查看结果 ========== */
const resultVisible = ref(false)
const taskResults = computed(() => {
  if (!selectedTask.value) return []
  return inspectionResultStore.inspectionResultList.filter(r => r.taskId === selectedTask.value.id)
})

const handleViewResult = (task) => {
  selectedTask.value = task
  if (taskResults.value.length === 0) {
    ElMessage.info('该任务暂无检测结果')
    return
  }
  resultVisible.value = true
}

/* ========== 查看报告 ========== */
const handleViewReport = (task) => {
  const report = inspectionReportStore.inspectionReportList.find(r => r.taskId === task.id)
  if (report) {
    ElMessage.info(`报告编号：${report.reportNo}，状态：${report.status}，结论：${report.finalResult}`)
  } else {
    ElMessage.info('暂未生成检测报告')
  }
}

/* ========== 详情抽屉 ========== */
const drawerVisible = ref(false)
const drawerTask = ref(null)

const handleViewDetail = (task) => {
  drawerTask.value = task
  drawerVisible.value = true
}

// 在详情面板中点击"..."更多时触发
const sampleInfoRows = computed(() => {
  if (!drawerTask.value) return []
  const sample = drawerTask.value.sampleId ? sampleStore.findById(drawerTask.value.sampleId) : null
  if (!sample) return [{ label: '样品', value: '未知' }]
  return [
    { label: '名称', value: sample.name },
    { label: '类型', value: sample.type },
    { label: '来源', value: sample.source },
    { label: '数量', value: String(sample.quantity) },
    { label: '状态', value: sample.status },
    { label: '收样日期', value: sample.receiveDate }
  ]
})

const taskAlerts = computed(() => {
  if (!drawerTask.value) return []
  const sampleId = drawerTask.value.sampleId
  if (!sampleId) return []
  return alertRecordStore.alertRecordList.filter(a => a.sampleId === sampleId)
})

// 在瀑布图节点上双击打开详情抽屉
const onNodeDblClick = (task) => {
  handleViewDetail(task)
}

/* ========== 导出 ========== */
const handleExport = () => {
  const data = filteredList.value
  if (data.length === 0) {
    ElMessage.info('没有可导出的数据')
    return
  }
  // 模拟导出：生成CSV并下载
  let csv = '任务编号,状态,样品名称,检测人员,优先级,创建时间,计划完成,备注\n'
  data.forEach(t => {
    const sampleName = getSampleName(t).replace(/,/g, '，')
    const remark = (t.remark || '').replace(/,/g, '，').replace(/\n/g, ' ')
    csv += `${t.id},${t.status},${sampleName},${t.assignee || ''},${t.priority},${t.createDate},${t.dueDate || ''},${remark}\n`
  })
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `检测任务清单_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success(`已导出 ${data.length} 条任务数据`)
}

// 监听选中任务变化，自动同步到抽屉目标
watch(selectedTask, (val) => {
  if (val) drawerTask.value = val
})
</script>

<style scoped lang="scss">
@use './DetectTask.scss' as *;
</style>