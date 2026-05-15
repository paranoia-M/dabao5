<template>
  <div class="page-alert-config">
    <!-- 顶部操作栏 -->
    <div class="header-bar">
      <h2 class="page-title">⚙️ 预警规则配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">新增规则</el-button>
        <el-button
          :disabled="selectedIds.length === 0"
          @click="batchToggle(true)"
        >
          批量启用
        </el-button>
        <el-button
          :disabled="selectedIds.length === 0"
          @click="batchToggle(false)"
        >
          批量禁用
        </el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-area">
      <el-input
        v-model="filterKeyword"
        placeholder="搜索规则名称"
        clearable
        style="width:240px"
      />
      <el-select
        v-model="filterStatus"
        placeholder="状态"
        clearable
        style="width:140px"
      >
        <el-option label="全部" value="" />
        <el-option label="启用" value="1" />
        <el-option label="禁用" value="0" />
      </el-select>
      <el-date-picker
        v-model="filterDateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD HH:mm:ss"
        clearable
        style="width:380px"
      />
      <el-button @click="resetFilter">重置</el-button>
    </div>

    <!-- 主体区域：左侧可视化板 + 右侧表格 -->
    <div class="main-content">
      <!-- 左侧主舞台 -->
      <div class="visualization-panel">
        <div class="panel-header">预警规则可视化板</div>
        <div v-if="selectedRule" class="viz-body">
          <svg
            class="rule-viz-svg"
            viewBox="0 0 500 280"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- 规则图标（根据类型） -->
            <g transform="translate(30,30)">
              <rect
                :x="0" :y="0" width="60" height="60" rx="12"
                :fill="ruleIconColor"
                opacity="0.2"
              />
              <text x="30" y="38" text-anchor="middle" font-size="28">
                {{ ruleIconChar }}
              </text>
            </g>
            <!-- 阈值刻度尺 -->
            <g transform="translate(120,50)">
              <line
                x1="0" y1="0" x2="300" y2="0"
                stroke="#52525B" stroke-width="4" stroke-linecap="round"
              />
              <line
                x1="0" y1="-8" x2="0" y2="8"
                stroke="#52525B" stroke-width="2"
              />
              <line
                x1="300" y1="-8" x2="300" y2="8"
                stroke="#52525B" stroke-width="2"
              />
              <text x="0" y="22" text-anchor="middle" font-size="12" fill="#888">Min</text>
              <text x="300" y="22" text-anchor="middle" font-size="12" fill="#888">Max</text>
              <!-- 滑块位置 -->
              <g :transform="`translate(${sliderX},-8)`">
                <rect x="-6" y="0" width="12" height="16" rx="3" fill="#E83C3C" />
              </g>
              <text
                :x="sliderX" y="-14"
                text-anchor="middle" font-size="12" font-weight="bold" fill="#E83C3C"
              >
                {{ selectedRule.threshold }}
              </text>
              <!-- 刻度标记 -->
              <line
                v-for="tick in 5" :key="tick"
                :x1="tick*60" y1="-4" :x2="tick*60" y2="4"
                stroke="#aaa" stroke-width="1"
              />
            </g>
            <!-- 状态指示灯 -->
            <g transform="translate(440,30)">
              <circle cx="0" cy="0" r="18" :fill="statusColor" opacity="0.9" />
              <text x="0" y="5" text-anchor="middle" font-size="10" fill="#fff">
                {{ selectedRule.status ? 'ON' : 'OFF' }}
              </text>
            </g>
            <!-- 规则名称标签 -->
            <text x="120" y="110" font-size="16" font-weight="bold" fill="#333">
              {{ selectedRule.name }}
            </text>
            <text x="120" y="132" font-size="13" fill="#666">
              类型：{{ selectedRule.ruleType }}
            </text>
            <text x="120" y="152" font-size="13" fill="#666">
              阈值：{{ selectedRule.threshold }}
            </text>
          </svg>
          <div class="rule-detail-text">
            <p><span class="label">描述：</span>{{ selectedRule.description }}</p>
            <p><span class="label">最后更新：</span>{{ selectedRule.updateDate }}</p>
          </div>
        </div>
        <div v-else class="empty-state">
          <el-empty description="点击表格中的规则查看详情" />
        </div>
      </div>

      <!-- 右侧表格 -->
      <div class="table-panel">
        <el-table
          :data="pagedData"
          highlight-current-row
          @row-click="onRowClick"
          @selection-change="onSelectionChange"
          style="width:100%"
        >
          <el-table-column type="selection" width="44" />
          <el-table-column label="规则名称" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="rule-name-cell">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规则类型" width="120">
            <template #default="{ row }">
              <el-tag :type="ruleTypeTag(row.ruleType)" size="small">
                {{ row.ruleType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="阈值" width="160" show-overflow-tooltip>
            <template #default="{ row }">{{ row.threshold }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-switch
                :model-value="row.status"
                @change="(val) => toggleStatus(row, val)"
                inline-prompt
                active-text="启"
                inactive-text="禁"
                active-color="#0D9488"
                inactive-color="#aab"
              />
            </template>
          </el-table-column>
          <el-table-column label="最后更新" width="160" sortable>
            <template #default="{ row }">{{ row.updateDate }}</template>
          </el-table-column>
          <el-table-column label="操作" width="210" fixed="right">
            <template #default="{ row }">
              <el-button size="small" link @click.stop="openDetail(row)">详情</el-button>
              <el-button size="small" link @click.stop="openEdit(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredList.length"
          layout="prev, pager, next"
          background
          style="margin-top:16px; justify-content:flex-end"
        />
      </div>
    </div>

    <!-- 底部信息区 -->
    <div class="footer-area">
      <div v-if="selectedRule" class="footer-content">
        <span class="footer-label">当前规则：</span>{{ selectedRule.name }}
        <el-divider direction="vertical" />
        <span class="footer-label">关联预警记录：</span>
        <strong>{{ relatedRecordCount }}</strong> 条
        <el-divider direction="vertical" />
        <span class="footer-label">描述：</span>
        <span class="desc-text">{{ selectedRule.description || '无' }}</span>
      </div>
      <div v-else class="footer-content">请从列表中选择一条规则查看详情</div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑预警规则' : '新增预警规则'"
      :width="Math.min(640, windowWidth * 0.92)"
      top="6vh"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="top"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input
            v-model="formData.name"
            :disabled="isEditing"
            placeholder="输入规则名称"
          />
        </el-form-item>
        <el-form-item label="检测标准" prop="standardId">
          <el-select
            v-model="formData.standardId"
            placeholder="请选择检测标准"
            filterable
            style="width:100%"
          >
            <el-option
              v-for="std in standardList"
              :key="std.id"
              :label="std.name"
              :value="std.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="formData.ruleType" placeholder="选择规则类型" style="width:100%">
            <el-option label="超标预警" value="超标预警" />
            <el-option label="标准变更" value="标准变更" />
            <el-option label="风险监测" value="风险监测" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <div class="threshold-row">
          <el-form-item label="阈值下限" prop="thresholdLower">
            <el-input-number
              v-model="formData.thresholdLower"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width:140px"
            />
          </el-form-item>
          <span class="separator">～</span>
          <el-form-item label="阈值上限" prop="thresholdUpper">
            <el-input-number
              v-model="formData.thresholdUpper"
              :min="0"
              :precision="2"
              :step="0.01"
              controls-position="right"
              style="width:140px"
            />
          </el-form-item>
          <span class="unit-hint">mg/kg</span>
        </div>
        <el-form-item label="状态">
          <el-switch v-model="formData.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            rows="3"
            placeholder="输入规则描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="detailRule?.name || '规则详情'"
      size="500px"
      :close-on-click-modal="true"
    >
      <div v-if="detailRule" class="detail-grid">
        <div class="detail-item">
          <span class="label">规则名称</span>
          <span class="value">{{ detailRule.name }}</span>
        </div>
        <div class="detail-item">
          <span class="label">检测标准</span>
          <span class="value">{{ standardName(detailRule.standardId) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">规则类型</span>
          <span class="value">{{ detailRule.ruleType }}</span>
        </div>
        <div class="detail-item">
          <span class="label">阈值</span>
          <span class="value">{{ detailRule.threshold }}</span>
        </div>
        <div class="detail-item">
          <span class="label">状态</span>
          <span class="value">
            <el-tag :type="detailRule.status ? 'success' : 'info'" size="small">
              {{ detailRule.status ? '启用' : '禁用' }}
            </el-tag>
          </span>
        </div>
        <div class="detail-item">
          <span class="label">创建时间</span>
          <span class="value">{{ detailRule.createDate }}</span>
        </div>
        <div class="detail-item">
          <span class="label">最后更新</span>
          <span class="value">{{ detailRule.updateDate }}</span>
        </div>
        <div class="detail-item">
          <span class="label">描述</span>
          <span class="value">{{ detailRule.description || '无' }}</span>
        </div>
        <div class="detail-item full-width">
          <span class="label">关联预警记录</span>
          <span class="value"><strong>{{ relatedRecordCount }}</strong> 条</span>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAlertConfigStore } from '@/stores/alertConfig'
import { useAlertRecordStore } from '@/stores/alertRecord'
import { useDetectStandardStore } from '@/stores/detectStandard'

// 窗口宽度（用于弹窗响应）
const windowWidth = ref(window.innerWidth)
window.addEventListener('resize', () => {
  windowWidth.value = window.innerWidth
})

// Store
const alertConfigStore = useAlertConfigStore()
const alertRecordStore = useAlertRecordStore()
const detectStandardStore = useDetectStandardStore()

// 基础数据
const standardList = computed(() => detectStandardStore.detectStandardList || [])
const standardMap = computed(() => {
  const map = {}
  standardList.value.forEach(s => { map[s.id] = s.name })
  return map
})
const standardName = (id) => standardMap.value[id] || '未知'

// 筛选状态
const filterKeyword = ref('')
const filterStatus = ref('')
const filterDateRange = ref([])

const resetFilter = () => {
  filterKeyword.value = ''
  filterStatus.value = ''
  filterDateRange.value = []
}

// 过滤
const filteredList = computed(() => {
  let list = alertConfigStore.alertConfigList || []
  // 关键词
  if (filterKeyword.value) {
    const kw = filterKeyword.value.toLowerCase()
    list = list.filter(r => r.name.toLowerCase().includes(kw))
  }
  // 状态
  if (filterStatus.value !== '') {
    const statusBool = filterStatus.value === '1'
    list = list.filter(r => r.status === statusBool)
  }
  // 日期范围
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const start = new Date(filterDateRange.value[0])
    const end = new Date(filterDateRange.value[1])
    list = list.filter(r => {
      const d = new Date(r.updateDate || r.createDate)
      return d >= start && d <= end
    })
  }
  return list.sort((a, b) => new Date(b.updateDate || b.createDate) - new Date(a.updateDate || a.createDate))
})

// 分页
const currentPage = ref(1)
const pageSize = 20
const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

// 选择
const selectedIds = ref([])
const onSelectionChange = (rows) => {
  selectedIds.value = rows.map(r => r.id)
}

// 当前选中规则
const selectedRule = ref(null)
const onRowClick = (row) => {
  selectedRule.value = row
}

// 规则类型映射
const ruleTypeTag = (type) => {
  const map = {
    '超标预警': 'danger',
    '标准变更': 'warning',
    '风险监测': 'info',
    '其他': 'default'
  }
  return map[type] || 'default'
}

// 图标颜色和字符
const ruleIconColor = computed(() => {
  if (!selectedRule.value) return '#52525B'
  const colors = {
    '超标预警': '#E83C3C',
    '标准变更': '#D97706',
    '风险监测': '#2563EB',
    '其他': '#52525B'
  }
  return colors[selectedRule.value.ruleType] || '#52525B'
})
const ruleIconChar = computed(() => {
  if (!selectedRule.value) return '?'
  const chars = {
    '超标预警': '⚠',
    '标准变更': '📋',
    '风险监测': '🔍',
    '其他': '⚙'
  }
  return chars[selectedRule.value.ruleType] || '?'
})

// 滑块位置：根据阈值字符串提取数字，简单映射到0-300
const sliderX = computed(() => {
  if (!selectedRule.value) return 150
  const threshold = selectedRule.value.threshold
  const match = threshold.match(/\d+(\.\d+)?/)
  if (match) {
    const val = parseFloat(match[0])
    // 假设常见范围0-10，映射到0-300
    const ratio = Math.min(val / 10, 1)
    return ratio * 300
  }
  return 150
})

// 状态灯颜色
const statusColor = computed(() => {
  return selectedRule.value?.status ? '#0D9488' : '#aab'
})

// 关联预警记录数
const relatedRecordCount = computed(() => {
  if (!selectedRule.value) return 0
  return alertRecordStore.alertRecordList.filter(r => r.alertConfigId === selectedRule.value.id).length
})

// 新增/编辑弹窗
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const formData = ref({
  name: '',
  standardId: '',
  ruleType: '',
  thresholdLower: 0,
  thresholdUpper: 0.1,
  status: false,
  description: ''
})

const formRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (isEditing.value) return callback()
        if (!value) return callback(new Error('请输入规则名称'))
        const exists = alertConfigStore.alertConfigList.some(
          r => r.name === value && r.standardId === formData.value.standardId && r.id !== formData.value.id
        )
        if (exists) {
          callback(new Error('此检测标准下规则名称已存在'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  standardId: [{ required: true, message: '请选择检测标准', trigger: 'change' }],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
}

const openAddDialog = () => {
  isEditing.value = false
  formData.value = {
    name: '',
    standardId: '',
    ruleType: '',
    thresholdLower: 0,
    thresholdUpper: 0.1,
    status: false,
    description: ''
  }
  dialogVisible.value = true
}

const openEdit = (row) => {
  isEditing.value = true
  // 解析阈值
  let lower = 0
  let upper = 0.1
  const match = row.threshold.match(/(\d+(\.\d+)?)\s*[~-]\s*(\d+(\.\d+)?)/)
  if (match) {
    lower = parseFloat(match[1])
    upper = parseFloat(match[3])
  } else {
    // 单一阈值，假设上下限相同
    const num = parseFloat(row.threshold)
    if (!isNaN(num)) {
      lower = upper = num
    }
  }
  formData.value = {
    id: row.id,
    name: row.name,
    standardId: row.standardId,
    ruleType: row.ruleType,
    thresholdLower: lower,
    thresholdUpper: upper,
    status: row.status,
    description: row.description
  }
  dialogVisible.value = true
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  // 校验上下限
  if (formData.value.thresholdLower >= formData.value.thresholdUpper) {
    ElMessage.error('阈值下限必须小于上限')
    return
  }
  // 拼接阈值字符串
  const thresholdStr = `${formData.value.thresholdLower.toFixed(2)} ~ ${formData.value.thresholdUpper.toFixed(2)} mg/kg`
  const payload = {
    name: formData.value.name,
    standardId: formData.value.standardId,
    ruleType: formData.value.ruleType,
    threshold: thresholdStr,
    status: formData.value.status,
    description: formData.value.description || '',
    createDate: new Date().toISOString().slice(0,19).replace('T', ' '),
    updateDate: new Date().toISOString().slice(0,19).replace('T', ' ')
  }
  try {
    if (isEditing.value) {
      // 编辑状态下，保持原来的name不可修改，更新其他字段
      await alertConfigStore.update(formData.value.id, {
        ...payload,
        name: formData.value.name, // name未变
        updateDate: payload.updateDate
      })
      ElMessage.success('规则更新成功')
    } else {
      await alertConfigStore.add(payload)
      ElMessage.success('规则新增成功')
    }
    dialogVisible.value = false
    // 刷新后选中新规则
    const list = alertConfigStore.alertConfigList
    const added = list[list.length - 1]
    if (added) selectedRule.value = added
  } catch (e) {
    ElMessage.error('操作失败: ' + (e.message || '未知错误'))
  }
}

// 行内状态切换
const toggleStatus = async (row, newVal) => {
  try {
    await alertConfigStore.update(row.id, { status: newVal, updateDate: new Date().toISOString().slice(0,19).replace('T',' ') })
    ElMessage.success(newVal ? '规则已启用' : '规则已禁用')
    if (selectedRule.value?.id === row.id) {
      selectedRule.value = { ...row, status: newVal }
    }
  } catch (e) {
    ElMessage.error('状态更新失败')
  }
}

// 批量启用/禁用
const batchToggle = async (enable) => {
  const action = enable ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确定对选中的 ${selectedIds.value.length} 条规则进行批量${action}吗？`,
      '批量操作',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    for (const id of selectedIds.value) {
      await alertConfigStore.update(id, { status: enable, updateDate: new Date().toISOString().slice(0,19).replace('T',' ') })
    }
    ElMessage.success(`批量${action}成功`)
  } catch {
    // 取消
  }
}

// 删除
const handleDelete = async (row) => {
  // 检查是否有关联预警记录
  const hasRelated = alertRecordStore.alertRecordList.some(r => r.alertConfigId === row.id)
  let confirmText = '确定要删除该规则吗？'
  if (hasRelated) {
    confirmText = '该规则存在关联预警记录，删除后历史记录仍保留但不再触发新预警，是否确认删除？'
  }
  try {
    await ElMessageBox.confirm(confirmText, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await alertConfigStore.remove(row.id)
    ElMessage.success('规则已删除')
    if (selectedRule.value?.id === row.id) {
      selectedRule.value = null
    }
  } catch {
    // 取消
  }
}

// 详情抽屉
const drawerVisible = ref(false)
const detailRule = ref(null)
const openDetail = (row) => {
  detailRule.value = row
  drawerVisible.value = true
}
</script>

<style scoped lang="scss">
@use './AlertConfig.scss' as *;
</style>