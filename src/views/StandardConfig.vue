<template>
  <div class="page-standard_config">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <div class="top-left">
        <el-input
          v-model="keyword"
          placeholder="搜索标准编码/名称"
          clearable
          style="width:260px"
          @clear="currentPage=1"
          @input="currentPage=1"
        />
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width:140px" @change="currentPage=1">
          <el-option label="全部" value="" />
          <el-option label="草稿" value="草稿" />
          <el-option label="已发布" value="已发布" />
          <el-option label="已废弃" value="已废弃" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          style="width:340px"
          @change="currentPage=1"
        />
      </div>
      <div class="top-right">
        <el-button type="primary" @click="openAddDialog">新增标准</el-button>
      </div>
    </div>

    <!-- 统计卡片行 -->
    <div class="stats-row">
      <div class="stat-card">
        <span class="stat-value">{{ standardStore.total }}</span>
        <span class="stat-label">标准总数</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ publishedCount }}</span>
        <span class="stat-label">已发布</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">{{ draftCount }}</span>
        <span class="stat-label">草稿</span>
      </div>
    </div>

    <!-- 主布局：左列表 + 中央矩阵 + 右属性 -->
    <div class="main-layout">
      <!-- 左侧标准列表 -->
      <div class="left-panel">
        <div class="panel-title">标准列表</div>
        <div class="standard-list">
          <div
            v-for="std in paginatedStandards"
            :key="std.id"
            class="list-item"
            :class="{ active: selectedStandardId === std.id }"
            @click="selectStandard(std)"
          >
            <div class="item-name">{{ std.standardName }}</div>
            <div class="item-code">{{ std.standardCode }}</div>
            <div class="item-status">
              <el-tag :type="statusTagType(std.status)" size="small">{{ std.status }}</el-tag>
            </div>
            <div class="item-actions">
              <el-button
                v-if="std.status === '草稿'"
                text
                size="small"
                @click.stop="handlePublish(std)"
              >发布</el-button>
              <el-button
                v-if="std.status === '已发布'"
                text
                size="small"
                @click.stop="handleWithdraw(std)"
              >撤回</el-button>
              <el-button
                v-if="std.status !== '已发布'"
                text
                size="small"
                @click.stop="openEditDialog(std)"
              >编辑</el-button>
              <el-button
                v-if="std.status !== '已发布'"
                text
                type="danger"
                size="small"
                @click.stop="handleDelete(std)"
              >删除</el-button>
            </div>
          </div>
        </div>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredStandards.length"
            layout="prev, pager, next"
            small
          />
        </div>
      </div>

      <!-- 中央映射矩阵 -->
      <div class="matrix-panel">
        <div class="panel-title">标准 ↔ 字段映射矩阵</div>
        <div class="matrix-container">
          <div class="matrix-scroll">
            <div class="matrix-grid">
              <!-- 空角落 -->
              <div class="matrix-cell corner"></div>
              <!-- 列标题 -->
              <div
                v-for="field in allFields"
                :key="field.id"
                class="matrix-cell column-header"
                :title="field.fieldName"
              >{{ field.fieldName }}</div>
              <!-- 行 -->
              <template v-for="std in paginatedStandards" :key="std.id">
                <div class="matrix-cell row-header" :title="std.standardName">{{ std.standardName }}</div>
                <div
                  v-for="field in allFields"
                  :key="field.id"
                  class="matrix-cell data-cell"
                  :style="getCellStyle(std, field)"
                  @click="handleCellClick(std, field)"
                  :title="`匹配度: ${computeMatch(std, field)}%`"
                ></div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="right-panel">
        <div class="panel-title">属性详情</div>
        <div v-if="selectedStandard" class="detail-section">
          <div class="detail-title">标准信息</div>
          <div class="detail-item">
            <span class="label">标准编码</span>
            <span>{{ selectedStandard.standardCode }}</span>
          </div>
          <div class="detail-item">
            <span class="label">标准名称</span>
            <span>{{ selectedStandard.standardName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">业务域</span>
            <span>{{ selectedStandard.businessDomain }}</span>
          </div>
          <div class="detail-item">
            <span class="label">数据类型</span>
            <span>{{ selectedStandard.dataType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">长度</span>
            <span>{{ selectedStandard.length ?? '-' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">状态</span>
            <el-tag :type="statusTagType(selectedStandard.status)" size="small">{{ selectedStandard.status }}</el-tag>
          </div>
          <div class="detail-actions">
            <el-button size="small" @click="openDrawer(selectedStandard)">查看详情</el-button>
          </div>
        </div>
        <div v-if="selectedField" class="detail-section">
          <div class="detail-title">字段信息</div>
          <div class="detail-item">
            <span class="label">字段名称</span>
            <span>{{ selectedField.fieldName }}</span>
          </div>
          <div class="detail-item">
            <span class="label">字段类型</span>
            <span>{{ selectedField.fieldType }}</span>
          </div>
          <div class="detail-item">
            <span class="label">敏感级别</span>
            <el-tag size="small">{{ selectedField.sensitivityLevel }}</el-tag>
          </div>
        </div>
        <div v-if="!selectedStandard && !selectedField" class="empty-hint">
          <el-empty description="请选择标准或字段" :image-size="80" />
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增标准' : '编辑标准'"
      width="min(600px,92vw)"
      destroy-on-close
    >
      <el-form :model="form" label-width="100px" label-position="left">
        <el-form-item label="标准编码" required>
          <el-input
            v-model="form.standardCode"
            :disabled="dialogMode === 'edit'"
            placeholder="唯一编码"
          />
        </el-form-item>
        <el-form-item label="标准名称" required>
          <el-input v-model="form.standardName" placeholder="如：客户姓名规范" />
        </el-form-item>
        <el-form-item label="所属业务域" required>
          <el-select v-model="form.businessDomain" placeholder="选择业务域" style="width:100%">
            <el-option label="财务域" value="财务域" />
            <el-option label="人力域" value="人力域" />
            <el-option label="供应链域" value="供应链域" />
            <el-option label="客户域" value="客户域" />
          </el-select>
        </el-form-item>
        <el-form-item label="数据类型" required>
          <el-select v-model="form.dataType" placeholder="选择数据类型" style="width:100%" @change="onDataTypeChange">
            <el-option label="字符串" value="字符串" />
            <el-option label="整型" value="整型" />
            <el-option label="浮点" value="浮点" />
            <el-option label="日期" value="日期" />
            <el-option label="布尔" value="布尔" />
            <el-option label="枚举" value="枚举" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.dataType === '字符串'" label="长度">
          <el-input-number v-model="form.length" :min="1" :max="1000" :default-value="255" />
        </el-form-item>
        <el-form-item v-if="form.dataType === '浮点'" label="精度">
          <el-input-number v-model="form.precision" :min="1" :max="20" />
        </el-form-item>
        <el-form-item v-if="form.dataType === '枚举'" label="枚举值列表" required>
          <el-input
            v-model="form.enumValues"
            type="textarea"
            rows="4"
            placeholder="每行一个枚举值"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="标准详情"
      size="min(600px,85vw)"
      destroy-on-close
    >
      <template v-if="detailStandard">
        <div class="drawer-section">
          <h4>基本信息</h4>
          <div class="drawer-grid">
            <div class="drawer-item">
              <span class="label">标准编码</span>
              <span>{{ detailStandard.standardCode }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">标准名称</span>
              <span>{{ detailStandard.standardName }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">业务域</span>
              <span>{{ detailStandard.businessDomain }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">数据类型</span>
              <span>{{ detailStandard.dataType }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">长度</span>
              <span>{{ detailStandard.length ?? '-' }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">精度</span>
              <span>{{ detailStandard.precision ?? '-' }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">枚举值</span>
              <span>{{ detailStandard.enumValues?.length ? detailStandard.enumValues.join(', ') : '-' }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">描述</span>
              <span>{{ detailStandard.description || '-' }}</span>
            </div>
            <div class="drawer-item">
              <span class="label">状态</span>
              <el-tag :type="statusTagType(detailStandard.status)" size="small">{{ detailStandard.status }}</el-tag>
            </div>
          </div>
        </div>
        <div class="drawer-section">
          <h4>引用列表</h4>
          <el-table :data="references" stripe style="width:100%" max-height="300">
            <el-table-column prop="module" label="被引用模块" width="120" />
            <el-table-column prop="name" label="引用对象名称" />
            <el-table-column label="操作" width="140">
              <template #default="scope">
                <el-link type="primary" @click="handleViewReference(scope.row)">查看引用详情</el-link>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="references.length === 0" description="暂无引用" :image-size="60" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDataStandardStore } from '@/stores/dataStandard'
import { useDataAssetFieldStore } from '@/stores/dataAssetField'
import { useDataAssetStore } from '@/stores/dataAsset'
import { useQualityRuleStore } from '@/stores/qualityRule'

const standardStore = useDataStandardStore()
const fieldStore = useDataAssetFieldStore()
const assetStore = useDataAssetStore()
const ruleStore = useQualityRuleStore()

// 筛选状态
const keyword = ref('')
const statusFilter = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

// 选中
const selectedStandardId = ref('')
const selectedFieldId = ref('')

// 弹窗
const dialogVisible = ref(false)
const dialogMode = ref('add')
const currentEditId = ref('')
const form = reactive({
  standardCode: '',
  standardName: '',
  businessDomain: '',
  dataType: '',
  length: 255,
  precision: null,
  enumValues: '',
  description: ''
})

// 详情抽屉
const drawerVisible = ref(false)
const detailStandardId = ref('')

// 计算已发布 / 草稿数量
const publishedCount = computed(() => standardStore.dataStandardList.filter(s => s.status === '已发布').length)
const draftCount = computed(() => standardStore.dataStandardList.filter(s => s.status === '草稿').length)

// 过滤后标准
const filteredStandards = computed(() => {
  let list = standardStore.dataStandardList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(s => s.standardCode.toLowerCase().includes(kw) || s.standardName.toLowerCase().includes(kw))
  }
  if (statusFilter.value) {
    list = list.filter(s => s.status === statusFilter.value)
  }
  // 日期范围过滤（数据无时间字段，若选择则返回空）
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    return []
  }
  list.sort((a, b) => {
    if (a.status === '已发布' && b.status !== '已发布') return -1
    if (a.status !== '已发布' && b.status === '已发布') return 1
    return a.standardCode.localeCompare(b.standardCode)
  })
  return list
})

// 分页
const paginatedStandards = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStandards.value.slice(start, start + pageSize.value)
})

// 所有字段
const allFields = computed(() => fieldStore.dataAssetFieldList)

// 当前选中标准
const selectedStandard = computed(() => standardStore.findById(selectedStandardId.value) || null)
const selectedField = computed(() => fieldStore.findById(selectedFieldId.value) || null)

// 详情抽屉的标准
const detailStandard = computed(() => standardStore.findById(detailStandardId.value) || null)

// 引用列表
const references = computed(() => {
  const std = detailStandard.value
  if (!std) return []
  const rules = ruleStore.qualityRuleList.filter(r =>
    r.description && (r.description.includes(std.standardCode) || r.description.includes(std.standardName))
  ).map(r => ({ module: '质量规则', name: r.name, id: r.id }))
  const assets = assetStore.dataAssetList.filter(a =>
    a.domain === std.businessDomain || a.description.includes(std.standardName)
  ).map(a => ({ module: '资产目录', name: a.name, id: a.id }))
  return [...rules, ...assets]
})

// 默认选中第一个
watch(filteredStandards, (list) => {
  if (list.length > 0 && !selectedStandardId.value) {
    selectedStandardId.value = list[0].id
  }
}, { immediate: true })

// 匹配度计算
function computeMatch(std, field) {
  let score = 0
  const asset = assetStore.findById(field.assetId)
  if (asset && asset.domain === std.businessDomain) score += 60
  if (std.dataType === field.fieldType) score += 40
  return Math.min(score, 100)
}

function getCellStyle(std, field) {
  const score = computeMatch(std, field)
  let bg = '#f3f4f6'
  if (score >= 80) bg = '#22c55e'
  else if (score >= 40) bg = '#86efac'
  else if (score >= 10) bg = '#fde047'
  return { backgroundColor: bg }
}

function statusTagType(status) {
  if (status === '已发布') return 'success'
  if (status === '草稿') return 'info'
  if (status === '已废弃') return 'danger'
  return 'info'
}

// 数据类型变更
function onDataTypeChange() {
  if (form.dataType === '字符串' && !form.length) {
    form.length = 255
  }
  if (form.dataType !== '浮点') form.precision = null
  if (form.dataType !== '枚举') form.enumValues = ''
}

// 新增/编辑对话框
function openAddDialog() {
  dialogMode.value = 'add'
  currentEditId.value = ''
  form.standardCode = ''
  form.standardName = ''
  form.businessDomain = ''
  form.dataType = ''
  form.length = 255
  form.precision = null
  form.enumValues = ''
  form.description = ''
  dialogVisible.value = true
}

function openEditDialog(std) {
  dialogMode.value = 'edit'
  currentEditId.value = std.id
  form.standardCode = std.standardCode
  form.standardName = std.standardName
  form.businessDomain = std.businessDomain
  form.dataType = std.dataType
  form.length = std.length || null
  form.precision = std.precision || null
  form.enumValues = std.enumValues ? std.enumValues.join('\n') : ''
  form.description = std.description || ''
  dialogVisible.value = true
}

function handleConfirm() {
  if (!form.standardCode.trim()) {
    ElMessage.warning('标准编码不可为空')
    return
  }
  if (!form.standardName.trim()) {
    ElMessage.warning('标准名称不可为空')
    return
  }
  if (!form.businessDomain) {
    ElMessage.warning('请选择所属业务域')
    return
  }
  if (!form.dataType) {
    ElMessage.warning('请选择数据类型')
    return
  }
  if (form.dataType === '枚举' && !form.enumValues.trim()) {
    ElMessage.warning('枚举类型必须填写枚举值')
    return
  }
  // 唯一性校验
  const exists = standardStore.dataStandardList.some(s =>
    s.standardCode === form.standardCode && (dialogMode.value === 'add' || s.id !== currentEditId.value)
  )
  if (exists) {
    ElMessage.warning('标准编码已存在')
    return
  }
  const payload = {
    standardCode: form.standardCode,
    standardName: form.standardName,
    businessDomain: form.businessDomain,
    dataType: form.dataType,
    length: form.dataType === '字符串' ? (form.length || 255) : null,
    precision: form.dataType === '浮点' ? (form.precision || null) : null,
    enumValues: form.dataType === '枚举' ? form.enumValues.split('\n').map(v => v.trim()).filter(Boolean) : [],
    description: form.description,
    status: '草稿'
  }
  if (dialogMode.value === 'add') {
    standardStore.add(payload)
    ElMessage.success('新增成功')
  } else {
    standardStore.update(currentEditId.value, payload)
    ElMessage.success('编辑成功')
  }
  dialogVisible.value = false
}

// 删除
async function handleDelete(std) {
  const refs = ruleStore.qualityRuleList.filter(r =>
    r.description && (r.description.includes(std.standardCode) || r.description.includes(std.standardName))
  ).length + assetStore.dataAssetList.filter(a =>
    a.domain === std.businessDomain || a.description.includes(std.standardName)
  ).length
  if (refs > 0) {
    try {
      await ElMessageBox.confirm(
        `该标准已被${refs}处引用，删除将导致关联配置异常，确认删除？`,
        '确认删除',
        { confirmButtonText: '确认删除', cancelButtonText: '取消', type: 'warning' }
      )
      standardStore.remove(std.id)
      ElMessage.success('删除成功')
    } catch (_) {}
  } else {
    try {
      await ElMessageBox.confirm(
        `确定删除标准「${std.standardName}」？`,
        '确认删除',
        { type: 'warning' }
      )
      standardStore.remove(std.id)
      ElMessage.success('删除成功')
    } catch (_) {}
  }
}

// 发布
function handlePublish(std) {
  if (!std.standardCode || !std.standardName || !std.businessDomain || !std.dataType) {
    ElMessage.warning('标准信息不完整，无法发布')
    return
  }
  standardStore.update(std.id, { status: '已发布' })
  ElMessage.success('发布成功')
}

// 撤回
async function handleWithdraw(std) {
  try {
    await ElMessageBox.confirm(
      '撤回后状态退回草稿，下游规则将失效，确认撤回？',
      '确认撤回',
      { confirmButtonText: '确认撤回', cancelButtonText: '取消', type: 'warning' }
    )
    standardStore.update(std.id, { status: '草稿' })
    ElMessage.success('撤回成功')
  } catch (_) {}
}

// 选择标准
function selectStandard(std) {
  selectedStandardId.value = std.id
}

// 点击单元格
function handleCellClick(std, field) {
  selectedStandardId.value = std.id
  selectedFieldId.value = field.id
}

// 打开详情抽屉
function openDrawer(std) {
  detailStandardId.value = std.id
  drawerVisible.value = true
}

function handleViewReference(ref) {
  ElMessage.info('查看引用详情：' + ref.name)
}
</script>

<style scoped lang="scss">
@use './StandardConfig.scss' as *;
</style>