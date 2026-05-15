<template>
  <div class="page-alarm_history">
    <!-- 顶部筛选条件栏 -->
    <div class="filter-bar">
      <div class="filter-row">
        <el-input
          v-model="keyword"
          placeholder="搜索报警描述/设备"
          clearable
          class="filter-item"
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="statusFilter"
          multiple
          collapse-tags
          placeholder="状态"
          class="filter-item"
          clearable
        >
          <el-option label="未处理" value="未处理" />
          <el-option label="已确认" value="已确认" />
          <el-option label="已处理" value="已处理" />
        </el-select>
        <el-select
          v-model="severityFilter"
          multiple
          collapse-tags
          placeholder="严重等级"
          class="filter-item"
          clearable
        >
          <el-option label="低级" value="低级" />
          <el-option label="中级" value="中级" />
          <el-option label="高级" value="高级" />
          <el-option label="紧急" value="紧急" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="报警开始"
          end-placeholder="报警结束"
          value-format="YYYY-MM-DD"
          class="filter-item"
          @change="handleDateRangeChange"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>
      <div class="action-row">
        <el-button type="primary" @click="openAddDialog">新增记录</el-button>
        <el-button :disabled="!selectedRows.length" @click="batchConfirm">批量确认</el-button>
        <el-button @click="openExportDialog">导出</el-button>
      </div>
    </div>

    <!-- 主舞台：报警时序瀑布图 + 统计摘要 -->
    <div class="main-stage">
      <!-- 瀑布图（招牌业务积木） -->
      <div class="waterfall-container">
        <div class="waterfall-title">报警时序瀑布图</div>
        <div class="waterfall-svg-wrapper">
          <svg
            ref="waterfallSvg"
            :width="waterfallWidth"
            :height="waterfallHeight"
            class="waterfall-svg"
          >
            <g v-for="(block, i) in waterfallBlocks" :key="block.id">
              <rect
                :x="block.x"
                :y="block.y"
                :width="block.w"
                :height="block.h"
                :fill="block.color"
                :rx="2"
                :ry="2"
                class="waterfall-rect"
                @mouseenter="handleRectHover($event, block)"
                @mouseleave="handleRectLeave"
                @click="openDetailDrawer(block.record)"
              />
              <title>{{ block.tooltip }}</title>
            </g>
          </svg>
        </div>
        <div class="waterfall-legend">
          <span v-for="lvl in severityLevels" :key="lvl.label" class="legend-item">
            <span class="legend-color" :style="{ background: lvl.color }" />
            {{ lvl.label }}
          </span>
        </div>
      </div>

      <!-- 统计摘要 -->
      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-number">{{ totalAlarms }}</div>
          <div class="stat-label">报警总数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ urgentCount }}</div>
          <div class="stat-label">紧急</div>
        </div>
      </div>
    </div>

    <!-- 明细表格 -->
    <div class="table-section">
      <el-table
        :data="pagedList"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
        :row-class-name="tableRowClassName"
        max-height="500"
      >
        <el-table-column type="selection" width="50" fixed />
        <el-table-column prop="triggerTime" label="报警时间" width="160" sortable />
        <el-table-column label="设备" width="140">
          <template #default="{ row }">
            {{ getEquipmentName(row.equipmentId) }}
          </template>
        </el-table-column>
        <el-table-column prop="alarmType" label="报警类型" width="110" />
        <el-table-column prop="severity" label="严重等级" width="90">
          <template #default="{ row }">
            <el-tag :type="severityTagType(row.severity)" size="small">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="报警描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetailDrawer(row)">详情</el-button>
            <el-button
              link
              type="primary"
              size="small"
              :disabled="row.status === '已处理'"
              @click="openEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              :disabled="row.status !== '未处理'"
              @click="handleConfirm(row)"
            >
              确认
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              :disabled="row.status === '已处理'"
              @click="openTransferDialog(row)"
            >
              转交
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              :disabled="row.status === '已处理'"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredList.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- 最近导出记录区 -->
    <div v-if="exportRecords.length" class="export-history">
      <div class="export-history-title">最近导出</div>
      <div class="export-history-items">
        <el-tag
          v-for="rec in exportRecords"
          :key="rec.time"
          closable
          @close="removeExportRecord(rec)"
        >
          {{ rec.time }} — 导出 {{ rec.count }} 条
        </el-tag>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑报警记录' : '新增报警记录'"
      width="min(640px, 92vw)"
      :close-on-click-modal="false"
      @open="handleDialogOpen"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item label="报警时间" prop="triggerTime" v-if="!isEdit">
          <el-date-picker
            v-model="form.triggerTime"
            type="datetime"
            placeholder="选择报警时间"
            style="width: 100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="设备" prop="equipmentId">
          <el-select v-model="form.equipmentId" placeholder="选择设备" style="width: 100%">
            <el-option
              v-for="eq in equipmentStore.equipmentList"
              :key="eq.id"
              :label="eq.name"
              :value="eq.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="报警类型" prop="alarmType">
          <el-select v-model="form.alarmType" placeholder="选择类型" style="width: 100%">
            <el-option label="温度超限" value="温度超限" />
            <el-option label="异物检出" value="异物检出" />
            <el-option label="设备异常" value="设备异常" />
            <el-option label="卫生超标" value="卫生超标" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重等级" prop="severity">
          <el-select v-model="form.severity" placeholder="选择等级" style="width: 100%">
            <el-option label="低级" value="低级" />
            <el-option label="中级" value="中级" />
            <el-option label="高级" value="高级" />
            <el-option label="紧急" value="紧急" />
          </el-select>
        </el-form-item>
        <el-form-item label="报警描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="处理建议" prop="handleMethod">
          <el-input
            v-model="form.handleMethod"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '保存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="报警详情"
      size="400px"
      @open="handleDetailDrawerOpen"
    >
      <div v-if="currentDetail" class="detail-content">
        <div class="detail-field">
          <span class="field-label">报警时间</span>
          <span class="field-value">{{ currentDetail.triggerTime }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">设备</span>
          <span class="field-value">{{ getEquipmentName(currentDetail.equipmentId) }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">报警类型</span>
          <span class="field-value">{{ currentDetail.alarmType }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">严重等级</span>
          <span class="field-value">
            <el-tag :type="severityTagType(currentDetail.severity)">{{ currentDetail.severity }}</el-tag>
            <el-tag v-if="isOverTimeout(currentDetail)" type="danger" size="small" class="timeout-tag">超时</el-tag>
          </span>
        </div>
        <div class="detail-field">
          <span class="field-label">报警描述</span>
          <span class="field-value">{{ currentDetail.description }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">处理状态</span>
          <span class="field-value">
            <el-tag :type="statusTagType(currentDetail.status)">{{ currentDetail.status }}</el-tag>
          </span>
        </div>
        <div class="detail-field">
          <span class="field-label">处理人</span>
          <span class="field-value">{{ currentDetail.handler || '无' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">处理时间</span>
          <span class="field-value">{{ currentDetail.handledTime || '无' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">处理方式</span>
          <span class="field-value">{{ currentDetail.handleMethod || '无' }}</span>
        </div>
        <div class="detail-field">
          <span class="field-label">备注</span>
          <span class="field-value">{{ currentDetail.remark || '无' }}</span>
        </div>
        <div class="detail-field" v-if="currentDetail.handler">
          <span class="field-label">转交记录</span>
          <span class="field-value">{{ currentDetail.handler }} ({{ currentDetail.handledTime }})</span>
        </div>
      </div>
    </el-drawer>

    <!-- 转交弹窗 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="转交报警"
      width="400px"
    >
      <el-form label-width="80px">
        <el-form-item label="当前处理人">
          <span>{{ currentTransferRecord?.handler || '无' }}</span>
        </el-form-item>
        <el-form-item label="转交给">
          <el-select v-model="transferTarget" placeholder="选择人员">
            <el-option
              v-for="name in personnelList"
              :key="name"
              :label="name"
              :value="name"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmTransfer">确认转交</el-button>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出报警记录"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportScope">
            <el-radio value="all">全部数据 ({{ filteredList.length }}条)</el-radio>
            <el-radio value="selected">选中数据 ({{ selectedRows.length }}条)</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="exportFields">
            <el-checkbox label="triggerTime">报警时间</el-checkbox>
            <el-checkbox label="equipmentId">设备</el-checkbox>
            <el-checkbox label="alarmType">报警类型</el-checkbox>
            <el-checkbox label="severity">严重等级</el-checkbox>
            <el-checkbox label="description">报警描述</el-checkbox>
            <el-checkbox label="status">状态</el-checkbox>
            <el-checkbox label="handler">处理人</el-checkbox>
            <el-checkbox label="handledTime">处理时间</el-checkbox>
            <el-checkbox label="remark">备注</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="doExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useAlarmRecordStore } from '@/stores/alarmRecord'
import { useEquipmentStore } from '@/stores/equipment'

const alarmRecordStore = useAlarmRecordStore()
const equipmentStore = useEquipmentStore()

// ---------- 筛选 ----------
const keyword = ref('')
const statusFilter = ref([])
const severityFilter = ref([])
const dateRange = ref([])

const filteredList = computed(() => {
  let list = alarmRecordStore.alarmRecordList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(r =>
      r.description.toLowerCase().includes(kw) ||
      getEquipmentName(r.equipmentId).toLowerCase().includes(kw)
    )
  }
  if (statusFilter.value.length) {
    list = list.filter(r => statusFilter.value.includes(r.status))
  }
  if (severityFilter.value.length) {
    list = list.filter(r => severityFilter.value.includes(r.severity))
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000
    list = list.filter(r => {
      const t = new Date(r.triggerTime).getTime()
      return t >= start && t < end
    })
  }
  return list
})

const totalAlarms = computed(() => alarmRecordStore.alarmRecordList.length)
const pendingCount = computed(() => alarmRecordStore.alarmRecordList.filter(r => r.status === '未处理').length)
const urgentCount = computed(() => alarmRecordStore.alarmRecordList.filter(r => r.severity === '紧急').length)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})
function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
}

// 表格行样式
function tableRowClassName({ row }) {
  if (row.severity === '紧急') return 'emergency-row'
  return ''
}

function severityTagType(severity) {
  const map = { '低级': 'info', '中级': 'warning', '高级': 'danger', '紧急': 'danger' }
  return map[severity] || 'info'
}
function statusTagType(status) {
  const map = { '未处理': 'warning', '已确认': 'primary', '已处理': 'success' }
  return map[status] || 'info'
}

// 设备名查找
function getEquipmentName(equipmentId) {
  const eq = equipmentStore.findById(equipmentId)
  return eq ? eq.name : '未知'
}

// 多选
const selectedRows = ref([])
function handleSelectionChange(rows) {
  selectedRows.value = rows
}
function batchConfirm() {
  if (!selectedRows.value.length) return
  const ids = selectedRows.value.filter(r => r.status === '未处理').map(r => r.id)
  if (!ids.length) {
    ElMessage.warning('选中的记录中没有未处理的报警')
    return
  }
  ElMessageBox.confirm(`将批量确认 ${ids.length} 条报警?`, '批量确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).then(() => {
    ids.forEach(id => {
      alarmRecordStore.update(id, {
        status: '已确认',
        handler: '系统操作员',
        handledTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      })
    })
    ElMessage.success(`已确认 ${ids.length} 条报警`)
    selectedRows.value = []
  }).catch(() => {})
}

// 新增/编辑
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  triggerTime: '',
  equipmentId: '',
  alarmType: '',
  severity: '',
  description: '',
  handleMethod: '',
  remark: ''
})
const formRules = {
  triggerTime: [{ required: true, message: '请选择报警时间', trigger: 'change' }],
  equipmentId: [{ required: true, message: '请选择设备', trigger: 'change' }],
  alarmType: [{ required: true, message: '请选择报警类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重等级', trigger: 'change' }]
}

function openAddDialog() {
  isEdit.value = false
  editId.value = ''
  form.value = {
    triggerTime: '',
    equipmentId: '',
    alarmType: '',
    severity: '',
    description: '',
    handleMethod: '',
    remark: ''
  }
  dialogVisible.value = true
}
function openEditDialog(row) {
  isEdit.value = true
  editId.value = row.id
  form.value = {
    triggerTime: row.triggerTime,
    equipmentId: row.equipmentId,
    alarmType: row.alarmType,
    severity: row.severity,
    description: row.description,
    handleMethod: row.handleMethod,
    remark: row.remark
  }
  dialogVisible.value = true
}
function handleDialogOpen() {
  if (formRef.value) formRef.value.clearValidate()
}
function submitForm() {
  formRef.value.validate(valid => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        alarmRecordStore.update(editId.value, {
          equipmentId: form.value.equipmentId,
          alarmType: form.value.alarmType,
          severity: form.value.severity,
          description: form.value.description,
          handleMethod: form.value.handleMethod,
          remark: form.value.remark
        })
        ElMessage.success('编辑成功')
      } else {
        alarmRecordStore.add({
          id: 'alarmrecord_' + Date.now(),
          equipmentId: form.value.equipmentId,
          alarmType: form.value.alarmType,
          severity: form.value.severity,
          description: form.value.description,
          handleMethod: form.value.handleMethod,
          remark: form.value.remark,
          status: '未处理',
          handler: '',
          handledTime: '',
          triggerTime: form.value.triggerTime
        })
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
    } catch (e) {
      ElMessage.error('操作失败：' + e.message)
    } finally {
      submitting.value = false
    }
  })
}

// 确认处理
function handleConfirm(row) {
  ElMessageBox.confirm('确认处理该报警？可填写处理备注', '确认处理', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputValue: row.remark,
    inputPlaceholder: '处理备注（可选）',
    inputType: 'textarea'
  }).then(({ value }) => {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    alarmRecordStore.update(row.id, {
      status: '已确认',
      handler: '系统操作员',
      handledTime: now,
      remark: value || row.remark
    })
    ElMessage.success('已确认')
  }).catch(() => {})
}

// 删除
function handleDelete(row) {
  if (row.status === '已处理') {
    ElMessage.warning('已处理的报警不可删除，请先回退状态')
    return
  }
  ElMessageBox.confirm(`确定删除该报警记录？`, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    alarmRecordStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 转交
const transferDialogVisible = ref(false)
const currentTransferRecord = ref(null)
const transferTarget = ref('')
const personnelList = ['张伟', '李娜', '王芳', '刘洋', '陈静', '系统操作员']
function openTransferDialog(row) {
  currentTransferRecord.value = row
  transferTarget.value = ''
  transferDialogVisible.value = true
}
function confirmTransfer() {
  if (!transferTarget.value) {
    ElMessage.warning('请选择转交人员')
    return
  }
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  alarmRecordStore.update(currentTransferRecord.value.id, {
    handler: transferTarget.value,
    handledTime: now,
    status: currentTransferRecord.value.status === '未处理' ? '未处理' : '已确认'
  })
  ElMessage.success(`已转交给 ${transferTarget.value}`)
  transferDialogVisible.value = false
}

// 导出
const exportDialogVisible = ref(false)
const exportScope = ref('all')
const exportFields = ref(['triggerTime', 'alarmType', 'severity', 'description', 'status'])
const exportRecords = ref([])
function openExportDialog() {
  exportScope.value = 'all'
  exportFields.value = ['triggerTime', 'alarmType', 'severity', 'description', 'status']
  exportDialogVisible.value = true
}
function doExport() {
  const source = exportScope.value === 'all' ? filteredList.value : selectedRows.value
  if (!source.length) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  // 构建 CSV
  const fields = exportFields.value
  const header = fields.map(f => {
    const map = {
      triggerTime: '报警时间',
      equipmentId: '设备',
      alarmType: '报警类型',
      severity: '严重等级',
      description: '报警描述',
      status: '状态',
      handler: '处理人',
      handledTime: '处理时间',
      remark: '备注'
    }
    return map[f] || f
  })
  const lines = source.map(row => {
    return fields.map(f => {
      let val = row[f]
      if (f === 'equipmentId') val = getEquipmentName(row.equipmentId)
      if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
        val = `"${val.replace(/"/g, '""')}"`
      }
      return val
    }).join(',')
  })
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `报警记录_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  // 记录导出历史
  exportRecords.value.unshift({
    time: new Date().toLocaleString(),
    count: source.length
  })
  exportDialogVisible.value = false
  ElMessage.success(`成功导出 ${source.length} 条记录`)
}
function removeExportRecord(rec) {
  exportRecords.value = exportRecords.value.filter(r => r !== rec)
}

// 详情抽屉
const detailDrawerVisible = ref(false)
const currentDetail = ref(null)
function openDetailDrawer(row) {
  currentDetail.value = row
  detailDrawerVisible.value = true
}
function handleDetailDrawerOpen() {}
function isOverTimeout(row) {
  if (row.severity !== '紧急') return false
  if (row.status !== '未处理' && row.status !== '已确认') return false
  const trigger = new Date(row.triggerTime).getTime()
  const now = Date.now()
  return (now - trigger) > 15 * 60 * 1000
}

// 瀑布图
const waterfallSvg = ref(null)
const waterfallBlocks = computed(() => {
  const list = filteredList.value
  if (!list.length) return []
  const sorted = [...list].sort((a, b) => new Date(a.triggerTime) - new Date(b.triggerTime))
  const colors = {
    '低级': '#E5A653',
    '中级': '#E68A2E',
    '高级': '#D93025',
    '紧急': '#B71C1C'
  }
  const blockWidth = 28
  const blockHeight = 28
  const gap = 4
  const maxCols = Math.floor((waterfallWidth.value - 40) / (blockWidth + gap))
  const blocks = []
  sorted.forEach((record, i) => {
    const col = i % maxCols
    const row = Math.floor(i / maxCols)
    blocks.push({
      id: record.id,
      x: 20 + col * (blockWidth + gap),
      y: 10 + row * (blockHeight + gap),
      w: blockWidth,
      h: blockHeight,
      color: colors[record.severity] || '#999',
      tooltip: `${record.triggerTime}\n${record.alarmType} - ${record.severity}\n${record.description}`,
      record
    })
  })
  return blocks
})
const waterfallWidth = ref(800)
const waterfallHeight = computed(() => {
  const rows = Math.ceil(waterfallBlocks.value.length / Math.floor((waterfallWidth.value - 40) / 32)) || 1
  return 10 + rows * 32 + 10
})
function handleRectHover(e, block) {}
function handleRectLeave() {}

// 搜索重置
function handleSearch() {
  currentPage.value = 1
}
function resetFilters() {
  keyword.value = ''
  statusFilter.value = []
  severityFilter.value = []
  dateRange.value = []
  currentPage.value = 1
}
function handleDateRangeChange(val) {
  if (val && val.length === 2) {
    const start = new Date(val[0])
    const end = new Date(val[1])
    const diffDays = (end - start) / (1000 * 60 * 60 * 24)
    if (diffDays > 90) {
      ElMessage.warning('建议缩小日期范围，避免查询超时')
    }
    if (diffDays > 180) {
      ElMessage.error('日期范围不能超过180天，请重新选择')
      dateRange.value = []
    }
  }
}

// 初始加载数据
onMounted(() => {
  // 数据已在 store 中，无需额外操作
})
</script>

<style scoped lang="scss">
@use './AlarmHistory.scss' as *;
</style>