<template>
  <div class="page-usage_statistics">
    <!-- 顶部工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <span class="toolbar-label">统计时间</span>
        <el-radio-group v-model="timeRange" size="small" @change="onTimeRangeChange">
          <el-radio-button value="7">近7天</el-radio-button>
          <el-radio-button value="30">近30天</el-radio-button>
          <el-radio-button value="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="customRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          :disabled-date="disabledDate"
          size="small"
          style="width:240px;margin-left:8px;"
          @change="onCustomRangeChange"
        />
        <span class="toolbar-label" style="margin-left:24px;">统计维度</span>
        <el-radio-group v-model="dimension" size="small" @change="onDimensionChange">
          <el-radio-button value="format">资源类型</el-radio-button>
          <el-radio-button value="size">大小</el-radio-button>
          <el-radio-button value="status">状态</el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="primary" plain @click="openCreateConfig">
          <el-icon><Plus /></el-icon>新建配置
        </el-button>
        <el-button size="small" plain @click="handleExport" :disabled="exportDisabled">
          <el-icon><Download /></el-icon>导出
        </el-button>
        <el-button size="small" plain @click="resetView">
          <el-icon><Refresh /></el-icon>重置
        </el-button>
      </div>
    </div>

    <!-- KPI 指标行 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.key">
        <div class="kpi-inner">
          <div class="kpi-icon" :style="{ background: kpi.bg }">
            <el-icon :size="20"><component :is="kpi.icon" /></el-icon>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ formatNumber(kpi.value) }}<span class="kpi-unit">{{ kpi.unit }}</span></div>
            <div class="kpi-label">{{ kpi.label }}</div>
          </div>
          <div class="kpi-trend" v-if="kpi.trend !== undefined">
            <span :class="kpi.trend >= 0 ? 'up' : 'down'">
              {{ kpi.trend >= 0 ? '▲' : '▼' }}{{ Math.abs(kpi.trend).toFixed(1) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 主舞台：花冠图 + 趋势图 -->
    <div class="main-stage">
      <!-- 格式花冠图（招牌积木） -->
      <div class="flower-crown-section" :style="{ flex: '0 0 55%' }">
        <div class="section-header">
          <span class="section-title">格式花冠图</span>
          <span class="section-subtitle">模型格式分布 · 每瓣代表一种格式</span>
        </div>
        <div class="flower-crown-container" ref="flowerRef">
          <svg
            :width="svgSize"
            :height="svgSize"
            :viewBox="`0 0 ${svgSize} ${svgSize}`"
            class="flower-svg"
          >
            <!-- 花瓣阴影 -->
            <defs>
              <filter id="petalShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15" />
              </filter>
            </defs>
            <!-- 绘制花瓣 -->
            <g v-for="(sector, idx) in flowerSectors" :key="idx">
              <path
                :d="sector.path"
                :fill="sector.color"
                :opacity="hoveredSector === idx ? 0.85 : 1"
                stroke="#fff"
                :stroke-width="hoveredSector === idx ? 2.5 : 1.5"
                filter="url(#petalShadow)"
                :transform="hoveredSector === idx ? `scale(1.03) translate(${-svgSize*0.015}, ${-svgSize*0.015})` : ''"
                style="cursor:pointer;transition:opacity 0.2s,transform 0.2s;transform-origin:center;"
                @mouseenter="hoveredSector = idx"
                @mouseleave="hoveredSector = -1"
                @click="onFlowerClick(sector)"
              />
              <!-- 格式名称标签（在外围） -->
              <text
                :x="sector.labelX"
                :y="sector.labelY"
                :font-size="Math.max(11, Math.min(14, svgSize * 0.022))"
                fill="#374151"
                text-anchor="middle"
                dominant-baseline="middle"
                style="pointer-events:none;font-weight:500;"
                v-if="sector.ratio >= 0.06"
              >{{ sector.name }}</text>
            </g>
            <!-- 中心圆 -->
            <circle
              :cx="svgSize / 2" :cy="svgSize / 2" :r="centerR"
              fill="#fff" stroke="#475569" stroke-width="2"
              filter="url(#petalShadow)"
            />
            <text
              :x="svgSize / 2" :y="svgSize / 2 - 6"
              text-anchor="middle" font-size="22" font-weight="800" fill="#1e293b"
            >{{ formatNumber(totalModels) }}</text>
            <text
              :x="svgSize / 2" :y="svgSize / 2 + 14"
              text-anchor="middle" font-size="11" fill="#6b7280"
            >模型总数</text>
          </svg>
          <!-- hover 提示 -->
          <div
            class="flower-tooltip"
            v-if="hoveredSector >= 0 && flowerSectors[hoveredSector]"
            :style="tooltipStyle"
          >
            <strong>{{ flowerSectors[hoveredSector].name }}</strong>
            <span>数量：{{ flowerSectors[hoveredSector].count }}</span>
            <span>占比：{{ (flowerSectors[hoveredSector].ratio * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- 趋势图 -->
      <div class="trend-section" :style="{ flex: '0 0 45%' }">
        <div class="section-header">
          <span class="section-title">导出趋势</span>
          <span class="section-subtitle">按日统计导出次数</span>
        </div>
        <div class="trend-chart-container">
          <svg
            :width="trendWidth"
            :height="trendHeight"
            :viewBox="`0 0 ${trendWidth} ${trendHeight}`"
            class="trend-svg"
          >
            <!-- 网格线 -->
            <g stroke="#e5e7eb" stroke-width="0.5">
              <line v-for="gy in gridY" :key="'gy'+gy" :x1="padL" :y1="gy" :x2="trendWidth - padR" :y2="gy" />
            </g>
            <!-- 折线 -->
            <polyline
              :points="trendPoints"
              fill="none"
              stroke="#475569"
              stroke-width="2.5"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- 数据点 -->
            <circle
              v-for="(pt, pi) in trendDataPoints"
              :key="'pt'+pi"
              :cx="pt.cx"
              :cy="pt.cy"
              r="4"
              fill="#475569"
              stroke="#fff"
              stroke-width="1.5"
              style="cursor:pointer;"
              @mouseenter="hoverTrendIdx = pi; hoverTrendPos = {x: pt.cx, y: pt.cy}"
              @mouseleave="hoverTrendIdx = -1"
            />
            <!-- hover 竖线 -->
            <line
              v-if="hoverTrendIdx >= 0 && hoverTrendDataPoint"
              :x1="hoverTrendDataPoint.cx"
              :y1="padT"
              :x2="hoverTrendDataPoint.cx"
              :y2="trendHeight - padB"
              stroke="#475569"
              stroke-dasharray="4,3"
              stroke-width="1"
            />
            <!-- X轴标签 -->
            <text
              v-for="(lb, li) in trendLabels"
              :key="'lb'+li"
              :x="lb.x"
              :y="trendHeight - padB + 18"
              text-anchor="middle"
              font-size="10"
              fill="#9ca3af"
            >{{ lb.text }}</text>
            <!-- Y轴标签 -->
            <text
              v-for="(yl, yi) in trendYLabels"
              :key="'yl'+yi"
              :x="padL - 8"
              :y="yl.y"
              text-anchor="end"
              dominant-baseline="middle"
              font-size="10"
              fill="#9ca3af"
            >{{ yl.text }}</text>
          </svg>
          <!-- hover 提示 -->
          <div
            class="trend-tooltip"
            v-if="hoverTrendIdx >= 0 && hoverTrendDataPoint"
            :style="{ left: hoverTrendDataPoint.cx + 12 + 'px', top: hoverTrendDataPoint.cy - 30 + 'px' }"
          >
            <div>日期：{{ hoverTrendDataPoint.date }}</div>
            <div>导出：{{ hoverTrendDataPoint.value }} 次</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：详细统计表格 + 配置管理 -->
    <div class="bottom-section">
      <div class="bottom-left">
        <div class="section-header">
          <span class="section-title">详细统计</span>
          <span class="section-subtitle">按{{ dimLabel }}分组明细</span>
        </div>
        <el-table
          :data="detailList"
          stripe
          style="width:100%;"
          max-height="320"
          @row-click="onDetailRowClick"
        >
          <el-table-column prop="key" :label="dimLabel" min-width="120" />
          <el-table-column prop="count" label="数量" width="90" align="center">
            <template #default="{ row }">
              <span class="cell-number">{{ row.count }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="存储空间(MB)" width="140" align="right">
            <template #default="{ row }">
              <span class="cell-number">{{ row.fileSize.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="ratio" label="占比" width="120" align="center">
            <template #default="{ row }">
              <div class="ratio-bar-wrap">
                <div class="ratio-bar-fill" :style="{ width: (row.ratio * 100).toFixed(1) + '%', background: row.color }" />
                <span class="ratio-text">{{ (row.ratio * 100).toFixed(1) }}%</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div class="bottom-right">
        <div class="section-header">
          <span class="section-title">已保存配置</span>
          <span class="section-subtitle">自定义统计视图</span>
        </div>
        <div class="saved-config-list" v-if="savedFilterList.length > 0">
          <div
            class="config-item"
            v-for="cfg in savedFilterList"
            :key="cfg.id"
            :class="{ 'is-default': defaultConfigId === cfg.id }"
          >
            <div class="config-info">
              <span class="config-name">{{ cfg.name }}</span>
              <span class="config-meta">{{ cfg.timeRange }} · {{ cfg.dimension }}</span>
            </div>
            <div class="config-actions">
              <el-tag v-if="defaultConfigId === cfg.id" size="small" type="primary" effect="plain">默认</el-tag>
              <el-button size="small" link @click="setAsDefault(cfg)">设为默认</el-button>
              <el-button size="small" link @click="editConfig(cfg)">编辑</el-button>
              <el-button
                size="small"
                link
                type="danger"
                :disabled="defaultConfigId === cfg.id"
                @click="deleteConfig(cfg)"
              >删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无保存的配置，点击上方新建" :image-size="64" />
      </div>
    </div>

    <!-- 创建/编辑配置弹窗 -->
    <el-dialog
      v-model="configDialogVisible"
      :title="isEditConfig ? '编辑统计配置' : '新建统计配置'"
      width="min(520px,92vw)"
      :close-on-click-modal="false"
      destroy-on-close
      @closed="onConfigDialogClosed"
    >
      <el-form
        ref="configFormRef"
        :model="configForm"
        :rules="configRules"
        label-width="100px"
        label-position="top"
        size="small"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input v-model="configForm.name" placeholder="输入配置名称，如：按类型统计" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="时间范围" prop="timeRange">
          <el-radio-group v-model="configForm.timeRange">
            <el-radio value="7">近7天</el-radio>
            <el-radio value="30">近30天</el-radio>
            <el-radio value="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统计维度" prop="dimension">
          <el-radio-group v-model="configForm.dimension">
            <el-radio value="format">资源类型</el-radio>
            <el-radio value="size">大小</el-radio>
            <el-radio value="status">状态</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序方式" prop="sort">
          <el-select v-model="configForm.sort" style="width:100%;">
            <el-option label="数量降序" value="count-desc" />
            <el-option label="数量升序" value="count-asc" />
            <el-option label="存储空间降序" value="size-desc" />
            <el-option label="存储空间升序" value="size-asc" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="configDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="submitConfig">确认{{ isEditConfig ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>

    <!-- 导出记录弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出报表"
      width="min(480px,92vw)"
      destroy-on-close
    >
      <el-form label-width="80px" size="small">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio value="CSV">CSV</el-radio>
            <el-radio value="PDF">PDF</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <span>{{ timeRangeLabel }}</span>
        </el-form-item>
        <el-form-item label="统计维度">
          <span>{{ dimLabel }}</span>
        </el-form-item>
        <el-form-item label="数据量">
          <span>{{ detailList.length }} 条分组记录</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="exportDialogVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗（点击表格行） -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="'明细：' + (detailDialogTitle || '')"
      width="min(560px,92vw)"
      destroy-on-close
    >
      <div class="detail-dialog-body" v-if="detailDialogData">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">{{ dimLabel }}</span>
            <span class="detail-value">{{ detailDialogData.key }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">模型数量</span>
            <span class="detail-value">{{ detailDialogData.count }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">存储空间</span>
            <span class="detail-value">{{ detailDialogData.fileSize.toFixed(1) }} MB</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">占比</span>
            <span class="detail-value">{{ (detailDialogData.ratio * 100).toFixed(1) }}%</span>
          </div>
          <div class="detail-item" v-if="detailDialogData.models && detailDialogData.models.length">
            <span class="detail-label">包含模型</span>
            <span class="detail-value">
              <el-tag
                v-for="m in detailDialogData.models.slice(0, 8)"
                :key="m.id"
                size="small"
                style="margin:2px;"
              >{{ m.name }}</el-tag>
              <span v-if="detailDialogData.models.length > 8" style="color:#9ca3af;font-size:12px;">+{{ detailDialogData.models.length - 8 }}个</span>
            </span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, reactive } from 'vue'
import { Plus, Download, Refresh, Document, Upload, Folder, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useModelStore } from '@/stores/model'
import { useExportRecordStore } from '@/stores/exportRecord'
import { useUsageSavedFilterStore } from '@/stores/usageSavedFilter'
import { useUploadRecordStore } from '@/stores/uploadRecord'
import { useTeamMemberStore } from '@/stores/teamMember'

// ---- Store ----
const modelStore = useModelStore()
const exportRecordStore = useExportRecordStore()
const savedFilterStore = useUsageSavedFilterStore()
const uploadRecordStore = useUploadRecordStore()
const teamMemberStore = useTeamMemberStore()

// ---- 基础数据 ----
const modelList = computed(() => modelStore.modelList || [])
const exportList = computed(() => exportRecordStore.exportRecordList || [])
const savedFilterList = computed(() => savedFilterStore.savedFilterList || [])
const uploadList = computed(() => uploadRecordStore.uploadRecordList || [])
const memberList = computed(() => teamMemberStore.memberList || [])

// ---- 筛选状态 ----
const timeRange = ref('30')
const customRange = ref([])
const dimension = ref('format')

// 导出相关
const exportDisabled = ref(false)
const exportDialogVisible = ref(false)
const exportFormat = ref('CSV')

// 配置弹窗
const configDialogVisible = ref(false)
const isEditConfig = ref(false)
const editingConfigId = ref('')
const configFormRef = ref(null)
const configForm = reactive({
  name: '',
  timeRange: '30',
  dimension: 'format',
  sort: 'count-desc'
})
const configRules = {
  name: [
    { required: true, message: '统计名称不能为空', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!isEditConfig.value && savedFilterList.value.some(c => c.name === value)) {
        callback(new Error('同名统计已存在，请重新命名'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  timeRange: [{ required: true, message: '请选择时间范围', trigger: 'change' }],
  dimension: [{ required: true, message: '请选择统计维度', trigger: 'change' }]
}

// 默认配置
const defaultConfigId = ref('')

// 花冠图
const hoveredSector = ref(-1)
const flowerRef = ref(null)
const svgSize = ref(360)

// 趋势图
const trendWidth = 400
const trendHeight = 220
const padL = 40, padR = 20, padT = 20, padB = 30
const hoverTrendIdx = ref(-1)
const hoverTrendPos = ref({ x: 0, y: 0 })

// 详情弹窗
const detailDialogVisible = ref(false)
const detailDialogTitle = ref('')
const detailDialogData = ref(null)

// ---- 工具函数 ----
const formatNumber = (n) => {
  if (!Number.isFinite(Number(n))) return '0'
  return Number(n).toLocaleString('zh-CN')
}

const disabledDate = (date) => {
  return date > new Date()
}

// ---- 计算维度 ----
const dimLabel = computed(() => {
  const map = { format: '资源类型', size: '大小分段', status: '状态' }
  return map[dimension.value] || '维度'
})

const timeRangeLabel = computed(() => {
  if (timeRange.value === '7') return '近7天'
  if (timeRange.value === '30') return '近30天'
  if (timeRange.value === 'custom' && customRange.value && customRange.value[0]) {
    return `${customRange.value[0]} ~ ${customRange.value[1]}`
  }
  return '全部'
})

// ---- 数据过滤（按时间） ----
const filteredModelList = computed(() => {
  const list = modelList.value
  if (timeRange.value === 'custom' && customRange.value && customRange.value[0]) {
    const start = new Date(customRange.value[0]).getTime()
    const end = new Date(customRange.value[1]).getTime() + 86400000
    if (!start || !end) return list
    return list.filter(m => {
      const t = new Date(m.createdAt).getTime()
      return t >= start && t <= end
    })
  }
  if (timeRange.value === '7' || timeRange.value === '30') {
    const days = parseInt(timeRange.value)
    const limit = Date.now() - days * 86400000
    return list.filter(m => new Date(m.createdAt).getTime() >= limit)
  }
  return list
})

const filteredExportList = computed(() => {
  const list = exportList.value
  if (timeRange.value === 'custom' && customRange.value && customRange.value[0]) {
    const start = new Date(customRange.value[0]).getTime()
    const end = new Date(customRange.value[1]).getTime() + 86400000
    if (!start || !end) return list
    return list.filter(e => {
      const t = new Date(e.createdAt).getTime()
      return t >= start && t <= end
    })
  }
  if (timeRange.value === '7' || timeRange.value === '30') {
    const days = parseInt(timeRange.value)
    const limit = Date.now() - days * 86400000
    return list.filter(e => new Date(e.createdAt).getTime() >= limit)
  }
  return list
})

// ---- KPI 计算 ----
const totalModels = computed(() => filteredModelList.value.length)

const totalExports = computed(() => filteredExportList.value.length)

const totalStorage = computed(() => {
  return filteredModelList.value.reduce((s, m) => s + (Number.isFinite(m.fileSize) ? m.fileSize : 0), 0)
})

const activeDays = computed(() => {
  const days = new Set()
  filteredExportList.value.forEach(e => {
    if (e.createdAt) days.add(e.createdAt.slice(0, 10))
  })
  filteredModelList.value.forEach(m => {
    if (m.createdAt) days.add(m.createdAt.slice(0, 10))
  })
  uploadList.value.forEach(u => {
    if (u.createdAt) days.add(u.createdAt.slice(0, 10))
  })
  return days.size
})

const kpiList = computed(() => [
  { key: 'models', label: '模型总数', value: totalModels.value, unit: '个', icon: Folder, bg: '#e0f2fe', trend: 12.3 },
  { key: 'exports', label: '导出次数', value: totalExports.value, unit: '次', icon: Document, bg: '#dcfce7', trend: 8.7 },
  { key: 'storage', label: '存储空间', value: totalStorage.value, unit: 'MB', icon: Upload, bg: '#fef3c7', trend: -2.1 },
  { key: 'active', label: '活跃天数', value: activeDays.value, unit: '天', icon: User, bg: '#fce7f3', trend: 5.4 }
])

// ---- 分组数据（按维度） ----
const groupData = computed(() => {
  const list = filteredModelList.value
  const map = {}
  list.forEach(m => {
    let key = ''
    if (dimension.value === 'format') {
      key = m.format || '其他'
    } else if (dimension.value === 'status') {
      key = m.status || '未知'
    } else if (dimension.value === 'size') {
      const size = Number.isFinite(m.fileSize) ? m.fileSize : 0
      if (size < 10) key = '小 (<10MB)'
      else if (size < 50) key = '中 (10-50MB)'
      else if (size < 100) key = '大 (50-100MB)'
      else key = '超大 (>100MB)'
    }
    if (!map[key]) map[key] = { count: 0, fileSize: 0, models: [] }
    map[key].count += 1
    map[key].fileSize += Number.isFinite(m.fileSize) ? m.fileSize : 0
    map[key].models.push(m)
  })
  const entries = Object.entries(map).map(([k, v]) => ({ key: k, ...v }))
  const total = entries.reduce((s, e) => s + e.count, 0)
  // 排序
  const sortBy = configForm.sort || 'count-desc'
  if (sortBy === 'count-desc') entries.sort((a, b) => b.count - a.count)
  else if (sortBy === 'count-asc') entries.sort((a, b) => a.count - b.count)
  else if (sortBy === 'size-desc') entries.sort((a, b) => b.fileSize - a.fileSize)
  else if (sortBy === 'size-asc') entries.sort((a, b) => a.fileSize - b.fileSize)
  return entries.map(e => ({
    ...e,
    ratio: total > 0 ? e.count / total : 0,
    color: getColor(e.key, dimension.value)
  }))
})

// ---- 颜色映射 ----
const colorPalette = ['#475569', '#0F766E', '#D97706', '#DC2626', '#059669', '#0284C7', '#7C3AED', '#DB2777', '#65A30D', '#0891B2']
const formatColorMap = { FBX: '#475569', OBJ: '#0F766E', glTF: '#D97706', '3DS': '#DC2626', STL: '#059669', 其他: '#9ca3af' }
const statusColorMap = { 草稿: '#9ca3af', 审核中: '#D97706', 已发布: '#0F766E', 已归档: '#475569', 已删除: '#DC2626' }
const sizeColorMap = { '小 (<10MB)': '#059669', '中 (10-50MB)': '#D97706', '大 (50-100MB)': '#DC2626', '超大 (>100MB)': '#7C3AED' }

function getColor(key, dim) {
  if (dim === 'format' && formatColorMap[key]) return formatColorMap[key]
  if (dim === 'status' && statusColorMap[key]) return statusColorMap[key]
  if (dim === 'size' && sizeColorMap[key]) return sizeColorMap[key]
  // hash fallback
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash)
  return colorPalette[Math.abs(hash) % colorPalette.length]
}

// ---- 花冠图扇区 ----
const flowerSectors = computed(() => {
  const data = groupData.value
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0 || data.length === 0) return []
  const cx = svgSize.value / 2
  const cy = svgSize.value / 2
  const maxR = svgSize.value * 0.38
  const centerRVal = svgSize.value * 0.16
  const gap = 2 // 度
  let startAngle = -90
  const toRad = (deg) => (deg * Math.PI) / 180
  const sectors = []
  data.forEach((d, idx) => {
    const angle = (d.count / total) * 360
    const endAngle = startAngle + angle - gap
    const r = maxR * (0.6 + 0.4 * (d.count / Math.max(...data.map(x => x.count))))
    const r1 = centerRVal + 8
    const x1 = cx + r1 * Math.cos(toRad(startAngle))
    const y1 = cy + r1 * Math.sin(toRad(startAngle))
    const x2 = cx + r1 * Math.cos(toRad(endAngle))
    const y2 = cy + r1 * Math.sin(toRad(endAngle))
    const x3 = cx + r * Math.cos(toRad(endAngle))
    const y3 = cy + r * Math.sin(toRad(endAngle))
    const x4 = cx + r * Math.cos(toRad(startAngle))
    const y4 = cy + r * Math.sin(toRad(startAngle))
    // 外缘凸出（花瓣效果）
    const midAngle = (startAngle + endAngle) / 2
    const bulgeR = r * 1.12
    const bx = cx + bulgeR * Math.cos(toRad(midAngle))
    const by = cy + bulgeR * Math.sin(toRad(midAngle))
    const largeArc = (angle - gap) > 180 ? 1 : 0
    const path = [
      `M ${x1} ${y1}`,
      `A ${r1} ${r1} 0 0 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `Q ${bx} ${by} ${x4} ${y4}`,
      'Z'
    ].join(' ')
    const labelAngle = (startAngle + endAngle) / 2
    const labelR = r * 1.22
    const labelX = cx + labelR * Math.cos(toRad(labelAngle))
    const labelY = cy + labelR * Math.sin(toRad(labelAngle))
    sectors.push({
      name: d.key,
      count: d.count,
      ratio: d.ratio,
      color: d.color,
      path,
      labelX,
      labelY,
      startAngle,
      endAngle: endAngle + gap
    })
    startAngle = endAngle + gap
  })
  return sectors
})

const centerR = computed(() => svgSize.value * 0.16)

// ---- 趋势数据 ----
const trendData = computed(() => {
  const list = filteredExportList.value
  const dayMap = {}
  list.forEach(e => {
    if (e.createdAt) {
      const day = e.createdAt.slice(0, 10)
      dayMap[day] = (dayMap[day] || 0) + 1
    }
  })
  // 补充日期范围
  const days = []
  const now = new Date()
  const range = timeRange.value === 'custom' && customRange.value && customRange.value[0]
    ? [new Date(customRange.value[0]), new Date(customRange.value[1])]
    : [new Date(now.getTime() - (parseInt(timeRange.value) || 30) * 86400000), now]
  const start = new Date(range[0])
  const end = new Date(range[1])
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    days.push({ date: key, value: dayMap[key] || 0 })
  }
  return days
})

const trendDataPoints = computed(() => {
  const data = trendData.value
  if (data.length === 0) return []
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const w = trendWidth - padL - padR
  const h = trendHeight - padT - padB
  const stepX = data.length > 1 ? w / (data.length - 1) : w / 2
  return data.map((d, i) => ({
    date: d.date,
    value: d.value,
    cx: padL + i * stepX,
    cy: trendHeight - padB - (d.value / maxVal) * h
  }))
})

const trendPoints = computed(() => {
  return trendDataPoints.value.map(p => `${p.cx},${p.cy}`).join(' ')
})

const trendLabels = computed(() => {
  const pts = trendDataPoints.value
  if (pts.length <= 7) return pts.map(p => ({ x: p.cx, text: p.date.slice(5) }))
  const step = Math.max(1, Math.floor(pts.length / 6))
  return pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(p => ({ x: p.cx, text: p.date.slice(5) }))
})

const trendYLabels = computed(() => {
  const maxVal = Math.max(...trendData.value.map(d => d.value), 1)
  const steps = 4
  const arr = []
  for (let i = 0; i <= steps; i++) {
    const val = Math.round((maxVal / steps) * i)
    const y = trendHeight - padB - (val / maxVal) * (trendHeight - padT - padB)
    arr.push({ y, text: val })
  }
  return arr
})

const gridY = computed(() => {
  return trendYLabels.value.map(y => y.y)
})

const hoverTrendDataPoint = computed(() => {
  if (hoverTrendIdx.value < 0 || hoverTrendIdx.value >= trendDataPoints.value.length) return null
  return trendDataPoints.value[hoverTrendIdx.value]
})

// ---- 详细表格 ----
const detailList = computed(() => groupData.value)

// ---- 交互 ----
function onTimeRangeChange(val) {
  if (val === 'custom' && (!customRange.value || !customRange.value[0])) {
    // 等待用户选择日期
  }
}

function onCustomRangeChange(val) {
  if (val && val[0] && val[1]) {
    if (new Date(val[1]) < new Date(val[0])) {
      ElMessage.warning('结束日期必须大于等于开始日期')
      customRange.value = []
    }
  }
}

function onDimensionChange() {
  // 图表自动重新渲染（computed 驱动）
}

function onFlowerClick(sector) {
  // 点击筛选：在表格中高亮该行
  const row = detailList.value.find(d => d.key === sector.name)
  if (row) {
    detailDialogTitle.value = sector.name
    detailDialogData.value = row
    detailDialogVisible.value = true
  }
}

function onDetailRowClick(row) {
  detailDialogTitle.value = row.key
  detailDialogData.value = row
  detailDialogVisible.value = true
}

// ---- 导出 ----
function handleExport() {
  if (detailList.value.length === 0) {
    ElMessage.warning('当前筛选条件下无数据可导出')
    exportDisabled.value = true
    return
  }
  exportDisabled.value = false
  exportDialogVisible.value = true
}

function confirmExport() {
  const record = {
    id: 'export_' + Date.now(),
    userId: 'user_001',
    module: '使用统计',
    format: exportFormat.value,
    status: '完成',
    filePath: `/exports/usage_statistics_${Date.now()}.${exportFormat.value.toLowerCase()}`,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  exportRecordStore.add(record)
  ElMessage.success(`报表已导出为 ${exportFormat.value} 格式`)
  exportDialogVisible.value = false
}

// ---- 重置 ----
function resetView() {
  timeRange.value = '30'
  customRange.value = []
  dimension.value = 'format'
  configForm.sort = 'count-desc'
  ElMessage.success('视图已重置为默认统计')
}

// ---- 配置管理 ----
function openCreateConfig() {
  isEditConfig.value = false
  editingConfigId.value = ''
  configForm.name = ''
  configForm.timeRange = timeRange.value
  configForm.dimension = dimension.value
  configForm.sort = 'count-desc'
  configDialogVisible.value = true
}

function editConfig(cfg) {
  isEditConfig.value = true
  editingConfigId.value = cfg.id
  configForm.name = cfg.name
  configForm.timeRange = cfg.timeRange
  configForm.dimension = cfg.dimension
  configForm.sort = cfg.config?.sort || 'count-desc'
  configDialogVisible.value = true
}

function submitConfig() {
  configFormRef.value.validate((valid) => {
    if (!valid) return
    if (isEditConfig.value) {
      const patch = {
        name: configForm.name,
        timeRange: configForm.timeRange,
        dimension: configForm.dimension,
        config: { ...savedFilterList.value.find(c => c.id === editingConfigId.value)?.config, sort: configForm.sort },
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      savedFilterStore.update(editingConfigId.value, patch)
      ElMessage.success('配置已更新')
    } else {
      const newItem = {
        id: 'usagesavedfilter_' + Date.now(),
        userId: 'user_001',
        name: configForm.name,
        timeRange: configForm.timeRange,
        dimension: configForm.dimension,
        config: { filters: {}, sort: configForm.sort, groupBy: configForm.dimension },
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
      }
      savedFilterStore.add(newItem)
      ElMessage.success('配置已创建')
    }
    configDialogVisible.value = false
  })
}

function deleteConfig(cfg) {
  ElMessageBox.confirm(
    `确定删除统计配置「${cfg.name}」？删除后无法恢复。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    savedFilterStore.remove(cfg.id)
    if (defaultConfigId.value === cfg.id) defaultConfigId.value = ''
    ElMessage.success('配置已删除')
  }).catch(() => {})
}

function setAsDefault(cfg) {
  defaultConfigId.value = cfg.id
  // 应用配置
  timeRange.value = cfg.timeRange
  dimension.value = cfg.dimension
  if (cfg.config?.sort) configForm.sort = cfg.config.sort
  ElMessage.success(`已设为默认视图：「${cfg.name}」`)
}

function onConfigDialogClosed() {
  // 清理
}

// ---- 初始化 ----
onMounted(() => {
  // 尝试从 savedFilterList 找到默认配置
  if (savedFilterList.value.length > 0) {
    // 默认选中第一个作为默认配置
    defaultConfigId.value = savedFilterList.value[0].id
  }
  // 响应式调整花冠图大小
  nextTick(() => {
    if (flowerRef.value) {
      const w = flowerRef.value.clientWidth
      svgSize.value = Math.min(w, 400)
    }
  })
})

// 窗口 resize
window.addEventListener('resize', () => {
  if (flowerRef.value) {
    svgSize.value = Math.min(flowerRef.value.clientWidth, 400)
  }
})

// ---- 工具提示定位 ----
const tooltipStyle = computed(() => {
  if (hoveredSector.value < 0 || !flowerSectors.value[hoveredSector.value]) return { display: 'none' }
  return {}
})
</script>

<style scoped lang="scss">
@use './UsageStatistics.scss' as *;
</style>