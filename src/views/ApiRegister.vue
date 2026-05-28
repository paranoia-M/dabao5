<template>
  <div class="page-api_register">
    <!-- 顶部引导提示条 -->
    <div class="guide-bar">
      <div class="stat-cards">
        <div class="stat-card"><span class="stat-num">{{ totalCount }}</span><span class="stat-label">API总数</span></div>
        <div class="stat-card"><span class="stat-num warning">{{ draftCount }}</span><span class="stat-label">草稿</span></div>
        <div class="stat-card"><span class="stat-num primary">{{ pendingCount }}</span><span class="stat-label">待审核</span></div>
        <div class="stat-card"><span class="stat-num success">{{ publishedCount }}</span><span class="stat-label">已发布</span></div>
        <div class="stat-card"><span class="stat-num danger">{{ offlineCount }}</span><span class="stat-label">已下架</span></div>
      </div>
      <div class="guide-actions">
        <el-button type="primary" @click="openAddDialog">新增API注册</el-button>
        <el-button @click="handleExport">导出API文档</el-button>
      </div>
    </div>

    <!-- 主区域 -->
    <div class="main-area">
      <!-- 左侧：API端点结构树 -->
      <div class="tree-panel">
        <div class="panel-header">API端点结构树</div>
        <div class="tree-body">
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="id"
            default-expand-all
            highlight-current
          />
        </div>
      </div>
      <!-- 右侧：列表与筛选 -->
      <div class="list-panel">
        <div class="filter-bar">
          <el-input v-model="keyword" placeholder="搜索API名称/路径" clearable style="width:220px" />
          <el-select v-model="filterStatus" placeholder="状态" clearable style="width:130px">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="草稿" />
            <el-option label="待审核" value="待审核" />
            <el-option label="已发布" value="已发布" />
            <el-option label="已下架" value="已下架" />
          </el-select>
          <el-select v-model="filterMethod" placeholder="请求方法" clearable style="width:130px">
            <el-option label="全部" value="" />
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
          <el-button @click="resetFilters" plain>重置</el-button>
        </div>
        <el-table
          :data="displayList"
          stripe
          highlight-current-row
          @row-click="handleRowClick"
          :row-class-name="rowClassName"
        >
          <el-table-column label="" width="4" fixed="left">
            <template #default="{row}">
              <div :style="statusBarStyle(row.status)" class="status-bar"></div>
            </template>
          </el-table-column>
          <el-table-column label="API名称" prop="name" min-width="160" show-overflow-tooltip />
          <el-table-column label="请求路径" prop="path" min-width="180" show-overflow-tooltip />
          <el-table-column label="方法" prop="method" width="70">
            <template #default="{row}">
              <el-tag :type="methodTagType(row.method)" size="small">{{ row.method }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" prop="status" width="80">
            <template #default="{row}">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="版本" prop="version" width="70" />
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{row}">
              <el-button type="primary" link size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
              <el-button type="primary" link size="small" :disabled="row.status !== '草稿' && row.status !== '待审核'" @click.stop="openEditDialog(row)">编辑</el-button>
              <el-button type="danger" link size="small" :disabled="row.status !== '草稿'" @click.stop="handleDelete(row)">删除</el-button>
              <el-button type="success" link size="small" v-if="row.status === '草稿'" @click.stop="handleSubmitForReview(row)">提交审核</el-button>
              <el-button type="warning" link size="small" v-if="row.status === '已发布'" @click.stop="handleOffline(row)">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredList.length"
            :page-sizes="[10,20,50]"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>

    <!-- 底部操作记录 -->
    <div class="footer-records">
      <div class="record-card">
        <div class="card-title">最近导出记录</div>
        <el-timeline v-if="exportRecords.length > 0">
          <el-timeline-item v-for="rec in exportRecords" :key="rec.id" :timestamp="rec.createdAt" placement="top">
            <span>{{ rec.fileName }}</span>
            <el-tag size="small" :type="rec.status === '完成' ? 'success' : 'warning'">{{ rec.status }}</el-tag>
          </el-timeline-item>
        </el-timeline>
        <div v-else class="empty-hint">暂无导出记录</div>
      </div>
      <div class="record-card">
        <div class="card-title">最近审核记录</div>
        <el-timeline v-if="approvalRecords.length > 0">
          <el-timeline-item v-for="rec in approvalRecords" :key="rec.id" :timestamp="rec.createdAt" placement="top">
            <span>{{ rec.comment }}</span>
            <el-tag size="small" :type="rec.action === '通过' ? 'success' : 'danger'">{{ rec.action }}</el-tag>
          </el-timeline-item>
        </el-timeline>
        <div v-else class="empty-hint">暂无审核记录</div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑API' : '新增API注册'" width="min(800px,92vw)" :before-close="handleDialogClose">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="API名称" prop="name">
          <el-input v-model="formData.name" maxlength="50" placeholder="输入API名称" />
        </el-form-item>
        <el-form-item label="请求路径" prop="path">
          <el-input v-model="formData.path" placeholder="/api/v1/xxx" />
        </el-form-item>
        <el-form-item label="请求方法" prop="method">
          <el-select v-model="formData.method" style="width:100%">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="formData.description" type="textarea" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="请求参数">
          <div class="param-table-wrap">
            <el-table :data="formData.requestParams" size="small" stripe>
              <el-table-column label="参数名称" min-width="120">
                <template #default="{row,$index}"><el-input v-model="row.name" placeholder="参数名" size="small" /></template>
              </el-table-column>
              <el-table-column label="类型" width="120">
                <template #default="{row}">
                  <el-select v-model="row.type" placeholder="类型" size="small">
                    <el-option label="string" value="string" />
                    <el-option label="integer" value="integer" />
                    <el-option label="boolean" value="boolean" />
                    <el-option label="number" value="number" />
                    <el-option label="object" value="object" />
                    <el-option label="array" value="array" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="必填" width="60" align="center">
                <template #default="{row}"><el-switch v-model="row.required" /></template>
              </el-table-column>
              <el-table-column label="示例值" min-width="120">
                <template #default="{row}"><el-input v-model="row.example" placeholder="示例" size="small" /></template>
              </el-table-column>
              <el-table-column label="说明" min-width="150">
                <template #default="{row}"><el-input v-model="row.description" placeholder="说明" size="small" /></template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{row,$index}"><el-button type="danger" link size="small" @click="removeParam($index)">删</el-button></template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link @click="addParam" style="margin-top:8px;">+ 添加参数</el-button>
          </div>
        </el-form-item>
        <el-form-item label="响应示例">
          <el-input v-model="formData.responseSample" type="textarea" rows="4" placeholder="JSON格式响应示例" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleDialogConfirm" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer v-model="detailDrawerVisible" title="API详情" size="min(600px,85vw)" :before-close="handleDetailClose">
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions column="1" border>
          <el-descriptions-item label="API名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="请求路径">{{ currentDetail.path }}</el-descriptions-item>
          <el-descriptions-item label="请求方法">
            <el-tag :type="methodTagType(currentDetail.method)">{{ currentDetail.method }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="版本">{{ currentDetail.version || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentDetail.status)">{{ currentDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联订阅数">{{ relatedSubscriptionCount }}</el-descriptions-item>
          <el-descriptions-item label="最近调用时间">暂无</el-descriptions-item>
        </el-descriptions>
        <div class="detail-section">
          <h4>请求参数</h4>
          <el-table :data="currentDetail.requestParams" stripe size="small" v-if="currentDetail.requestParams.length > 0">
            <el-table-column prop="name" label="参数名称" />
            <el-table-column prop="type" label="类型" />
            <el-table-column prop="required" label="必填" width="60">
              <template #default="{row}">{{ row.required ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column prop="example" label="示例值" show-overflow-tooltip />
            <el-table-column prop="description" label="说明" show-overflow-tooltip />
          </el-table>
          <div v-else class="empty-hint">无请求参数</div>
        </div>
        <div class="detail-section">
          <h4>响应示例</h4>
          <pre class="response-sample">{{ responseSampleText }}</pre>
        </div>
      </div>
    </el-drawer>

    <!-- 导出格式选择弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出API文档" width="400px">
      <el-radio-group v-model="exportFormat">
        <el-radio label="PDF">PDF 文档</el-radio>
        <el-radio label="Word">Word 文档</el-radio>
      </el-radio-group>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useApiDefinitionStore } from '@/stores/apiDefinition'
import { useGrantApplicationStore } from '@/stores/grantApplication'
import { useExportRecordStore } from '@/stores/exportRecord'
import { useApprovalRecordStore } from '@/stores/approvalRecord'

const apiDefStore = useApiDefinitionStore()
const grantAppStore = useGrantApplicationStore()
const exportRecordStore = useExportRecordStore()
const approvalRecordStore = useApprovalRecordStore()

// ---------- 统计 ----------
const totalCount = computed(() => apiDefStore.apiDefinitionList.length)
const draftCount = computed(() => apiDefStore.apiDefinitionList.filter(i => i.status === '草稿').length)
const pendingCount = computed(() => apiDefStore.apiDefinitionList.filter(i => i.status === '待审核').length)
const publishedCount = computed(() => apiDefStore.apiDefinitionList.filter(i => i.status === '已发布').length)
const offlineCount = computed(() => apiDefStore.apiDefinitionList.filter(i => i.status === '已下架').length)

// ---------- 筛选 ----------
const keyword = ref('')
const filterStatus = ref('')
const filterMethod = ref('')
const resetFilters = () => {
  keyword.value = ''
  filterStatus.value = ''
  filterMethod.value = ''
}

const filteredList = computed(() => {
  let list = apiDefStore.apiDefinitionList
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(item => item.name.toLowerCase().includes(kw) || item.path.toLowerCase().includes(kw))
  }
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (filterMethod.value) {
    list = list.filter(item => item.method === filterMethod.value)
  }
  return list
})

watch([keyword, filterStatus, filterMethod], () => { currentPage.value = 1 })

// ---------- 分页 ----------
const currentPage = ref(1)
const pageSize = ref(20)
const displayList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})
watch(filteredList, (newList) => {
  const maxPage = Math.ceil(newList.length / pageSize.value) || 1
  if (currentPage.value > maxPage) currentPage.value = maxPage
})
watch(pageSize, () => { currentPage.value = 1 })

// ---------- 表格样式 ----------
const methodTagType = (method) => {
  const map = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}
const statusTagType = (status) => {
  const map = { '草稿': 'info', '待审核': 'warning', '已发布': 'success', '已下架': 'danger' }
  return map[status] || 'info'
}
const statusColor = (status) => {
  const map = { '草稿': '#909399', '待审核': '#e6a23c', '已发布': '#67c23a', '已下架': '#f56c6c' }
  return map[status] || '#909399'
}
const statusBarStyle = (status) => {
  return `width:4px;height:100%;background-color:${statusColor(status)};display:inline-block;vertical-align:top;`
}
const rowClassName = () => '' // placeholder, status bar handled by column

// ---------- 选中行与结构树 ----------
const selectedApiId = ref(apiDefStore.apiDefinitionList[0]?.id || '')
const selectedApi = computed(() => apiDefStore.findById(selectedApiId.value) || apiDefStore.apiDefinitionList[0] || {})
const handleRowClick = (row) => {
  selectedApiId.value = row.id
}

const treeData = computed(() => {
  if (!selectedApi.value || !selectedApi.value.id) return []
  const params = (selectedApi.value.requestParams || []).map((p, idx) => ({
    id: `param-${idx}`,
    label: `${p.name} (${p.type})${p.required ? ' *' : ''}`,
    children: [
      { id: `param-${idx}-desc`, label: `说明: ${p.description || '-'}` },
      { id: `param-${idx}-example`, label: `示例: ${p.example || '-'}` }
    ]
  }))
  const resp = selectedApi.value.responseFormat
  let respChildren = []
  if (resp && typeof resp === 'object') {
    const keys = Object.keys(resp).slice(0, 12)
    respChildren = keys.map((key, idx) => ({
      id: `resp-${idx}`,
      label: `${key}: ${typeof resp[key] === 'object' ? JSON.stringify(resp[key]) : resp[key]}`
    }))
  } else if (resp && typeof resp === 'string') {
    respChildren = [{ id: 'resp-text', label: resp.substring(0, 60) }]
  }
  return [
    {
      id: 'root',
      label: `[${selectedApi.value.method}] ${selectedApi.value.path}`,
      children: [
        { id: 'params-group', label: `请求参数 (${params.length})`, children: params.length > 0 ? params : [{ id: 'no-params', label: '无参数' }] },
        { id: 'response-group', label: '响应格式', children: respChildren.length > 0 ? respChildren : [{ id: 'no-resp', label: '暂无响应格式' }] }
      ]
    }
  ]
})
const treeProps = { children: 'children', label: 'label' }

// ---------- 新增/编辑 ----------
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const formRef = ref(null)
const submitting = ref(false)
const formData = reactive({
  name: '',
  path: '',
  method: 'GET',
  description: '',
  requestParams: [],
  responseSample: ''
})
const formRules = {
  name: [{ required: true, message: 'API名称不能为空', trigger: 'blur' }],
  path: [{ required: true, message: '请求路径不能为空', trigger: 'blur' }],
  method: [{ required: true, message: '请选择请求方法', trigger: 'change' }]
}
const addParam = () => {
  formData.requestParams.push({ name: '', type: 'string', required: false, example: '', description: '' })
}
const removeParam = (index) => {
  formData.requestParams.splice(index, 1)
}
const openAddDialog = () => {
  isEdit.value = false
  editId.value = ''
  formData.name = ''
  formData.path = ''
  formData.method = 'GET'
  formData.description = ''
  formData.requestParams = []
  formData.responseSample = ''
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
const openEditDialog = (row) => {
  isEdit.value = true
  editId.value = row.id
  formData.name = row.name
  formData.path = row.path
  formData.method = row.method
  formData.description = row.description || ''
  formData.requestParams = JSON.parse(JSON.stringify(row.requestParams || [])).map(p => ({ ...p, required: p.required || false, example: p.example || '', description: p.description || '' }))
  const resp = row.responseFormat
  formData.responseSample = (resp && typeof resp === 'object') ? JSON.stringify(resp, null, 2) : (resp || '')
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}
const handleDialogConfirm = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const payload = {
      name: formData.name.trim(),
      path: formData.path.trim(),
      method: formData.method,
      description: formData.description.trim(),
      requestParams: formData.requestParams.map(p => ({ name: p.name, type: p.type, required: p.required, example: p.example, description: p.description })),
      responseFormat: formData.responseSample ? JSON.parse(formData.responseSample) : {},
      status: isEdit.value ? (apiDefStore.findById(editId.value)?.status || '草稿') : '草稿',
      version: isEdit.value ? (apiDefStore.findById(editId.value)?.version || 'v1.0') : 'v1.0'
    }
    if (isEdit.value) {
      // 编辑时检查路径唯一性（排除自身）
      const exist = apiDefStore.apiDefinitionList.find(item => item.path === payload.path && item.method === payload.method && item.id !== editId.value && item.status !== '已删除')
      if (exist) {
        ElMessage.error('请求路径已存在')
        submitting.value = false
        return
      }
      apiDefStore.update(editId.value, payload)
      ElMessage.success('编辑成功')
    } else {
      const exist = apiDefStore.apiDefinitionList.find(item => item.path === payload.path && item.method === payload.method && item.status !== '已删除')
      if (exist) {
        ElMessage.error('请求路径已存在')
        submitting.value = false
        return
      }
      apiDefStore.add(payload)
      ElMessage.success('新增成功')
      // 选中新条目
      const last = apiDefStore.apiDefinitionList[apiDefStore.apiDefinitionList.length - 1]
      if (last) selectedApiId.value = last.id
    }
    dialogVisible.value = false
  } catch (e) {
    ElMessage.error('操作失败，请检查响应示例是否为有效JSON')
  } finally {
    submitting.value = false
  }
}
const handleDialogClose = () => {
  dialogVisible.value = false
}

// ---------- 删除 ----------
const hasSubscription = (apiId) => {
  return grantAppStore.grantApplicationList.some(app => app.apiId === apiId)
}
const handleDelete = (row) => {
  const extraMsg = hasSubscription(row.id) ? '该API存在关联订阅，删除后订阅将失效。' : ''
  ElMessageBox.confirm(`确认删除API"${row.name}"吗？${extraMsg}`, '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    apiDefStore.remove(row.id)
    ElMessage.success('删除成功')
    if (selectedApiId.value === row.id) {
      selectedApiId.value = apiDefStore.apiDefinitionList[0]?.id || ''
    }
  }).catch(() => {})
}

// ---------- 提交审核 ----------
const handleSubmitForReview = (row) => {
  apiDefStore.update(row.id, { status: '待审核' })
  ElMessage.success('已提交审核')
}

// ---------- 下架 ----------
const handleOffline = (row) => {
  ElMessageBox.confirm(`确认下架API"${row.name}"？`, '下架确认', {
    confirmButtonText: '下架',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    apiDefStore.update(row.id, { status: '已下架' })
    ElMessage.success('已下架')
  }).catch(() => {})
}

// ---------- 详情抽屉 ----------
const detailDrawerVisible = ref(false)
const currentDetail = ref(null)
const openDetailDrawer = (row) => {
  currentDetail.value = row
  detailDrawerVisible.value = true
}
const handleDetailClose = () => {
  detailDrawerVisible.value = false
}
const relatedSubscriptionCount = computed(() => {
  if (!currentDetail.value) return 0
  return grantAppStore.grantApplicationList.filter(app => app.apiId === currentDetail.value.id).length
})
const responseSampleText = computed(() => {
  if (!currentDetail.value) return ''
  const resp = currentDetail.value.responseFormat
  if (!resp) return ''
  if (typeof resp === 'string') return resp
  return JSON.stringify(resp, null, 2)
})

// ---------- 导出 ----------
const exportDialogVisible = ref(false)
const exportFormat = ref('PDF')
const handleExport = () => {
  exportDialogVisible.value = true
}
const confirmExport = () => {
  const fileName = `api_docs_${Date.now()}.${exportFormat.value.toLowerCase()}`
  exportRecordStore.add({
    userId: 'user_1001',
    module: 'API注册',
    fileName,
    fileSize: 0,
    status: '生成中',
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
  })
  setTimeout(() => {
    const records = exportRecordStore.exportRecordList.filter(r => r.module === 'API注册')
    if (records.length > 0) {
      const last = records[records.length - 1]
      exportRecordStore.update(last.id, { status: '完成', fileSize: 102400 })
    }
    ElMessage.success(`导出${exportFormat.value}文档成功`)
  }, 1500)
  exportDialogVisible.value = false
}

// ---------- 底部记录 ----------
const exportRecords = computed(() => exportRecordStore.exportRecordList.filter(r => r.module === 'API注册').slice(0, 5))
const approvalRecords = computed(() => approvalRecordStore.approvalRecordList.filter(r => r.bizType === 'API发布').slice(0, 5))
</script>

<style scoped lang="scss">
@use './ApiRegister.scss' as *;
</style>