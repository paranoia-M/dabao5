<template>
  <div class="page-my_assets">
    <!-- 顶部统计条 -->
    <div class="stat-bar">
      <div class="stat-item">
        <span class="stat-num">{{ totalModels }}</span>
        <span class="stat-label">模型总数</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ totalSize }}</span>
        <span class="stat-label">总存储 (MB)</span>
      </div>
      <div class="stat-item">
        <span class="stat-num">{{ publishedCount }}</span>
        <span class="stat-label">已发布</span>
      </div>
      <el-button type="primary" icon="Upload" @click="showAddDialog = true">上传新模型</el-button>
    </div>

    <div class="main-area">
      <!-- 左侧：标签云（招牌业务积木） -->
      <div class="tag-cloud-panel">
        <div class="panel-title">标签云</div>
        <div class="tag-cloud-svg-wrapper">
          <svg ref="svgRef" width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
            <!-- 连线 -->
            <line
              v-for="(link, idx) in graphLinks"
              :key="'l'+idx"
              :x1="link.source.x"
              :y1="link.source.y"
              :x2="link.target.x"
              :y2="link.target.y"
              :stroke-width="link.strength * 2 + 0.5"
              stroke="#aaa"
              stroke-opacity="0.5"
            />
            <!-- 节点圆圈 + 文字 -->
            <g v-for="node in graphNodes" :key="node.id"
               :transform="`translate(${node.x}, ${node.y})`"
               class="tag-node"
               @click="handleTagClick(node.label)"
               @mouseenter="hoveredTag = node.label"
               @mouseleave="hoveredTag = null"
               :class="{ active: activeTag === node.label }"
            >
              <circle r="10" :fill="node.color" opacity="0.8" />
              <text dy="4" text-anchor="middle" font-size="10" fill="#fff" font-weight="bold">{{ node.label.substring(0,2) }}</text>
              <text x="0" y="-14" text-anchor="middle" font-size="9" fill="#333" v-if="hoveredTag === node.label">{{ node.count }}次</text>
            </g>
          </svg>
        </div>
        <div class="tag-list-hint" v-if="activeTag">
          当前筛选：<el-tag closable @close="clearTagFilter">{{ activeTag }}</el-tag>
        </div>
      </div>

      <!-- 右侧：资产列表 -->
      <div class="asset-list-panel">
        <!-- 筛选区 -->
        <div class="filter-bar">
          <el-input v-model="searchKeyword" placeholder="搜索名称/描述" clearable style="width:200px" />
          <el-select v-model="statusFilter" placeholder="状态" multiple clearable style="width:140px">
            <el-option label="草稿" value="草稿" />
            <el-option label="审核中" value="审核中" />
            <el-option label="已发布" value="已发布" />
            <el-option label="已归档" value="已归档" />
          </el-select>
          <el-date-picker v-model="dateRange" type="datetimerange" range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" style="width:280px" unlink-panels />
          <el-select v-model="sortField" style="width:120px">
            <el-option label="更新时间" value="updatedAt" />
            <el-option label="名称" value="name" />
          </el-select>
          <el-button @click="applyFilter">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </div>

        <!-- 空态处理 -->
        <div v-if="filteredList.length === 0" class="empty-placeholder">
          <el-empty description="暂无模型数据">
            <el-button type="primary" icon="Upload" @click="showAddDialog = true">上传你的第一个模型</el-button>
          </el-empty>
        </div>

        <!-- 表格 -->
        <el-table v-else :data="pagedList" stripe highlight-current-row style="width:100%" table-layout="fixed">
          <el-table-column label="缩略图" width="60">
            <template #default="{ row }">
              <div class="thumbnail-placeholder">{{ row.format }}</div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="模型名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="format" label="格式" width="70" align="center" />
          <el-table-column prop="fileSize" label="大小(MB)" width="80" align="right">
            <template #default="{ row }">{{ Number.isFinite(row.fileSize) ? row.fileSize.toFixed(1) : '-' }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="160" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="handleDetail(row)">详情</el-button>
              <el-button link type="primary" size="small" @click="handleEdit(row)" :disabled="row.status==='已发布'">编辑</el-button>
              <el-button link type="primary" size="small" @click="handleDownload(row)">下载</el-button>
              <el-button link type="primary" size="small" @click="handleShare(row)">分享</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)" :disabled="row.status==='已发布'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-if="filteredList.length > 0"
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredList.length"
          layout="prev, pager, next, total"
          background
          small
          style="margin-top:16px; justify-content:flex-end"
        />
      </div>
    </div>

    <!-- 底部：上传历史 -->
    <div class="upload-history">
      <div class="panel-title">最近上传</div>
      <div class="history-cards">
        <div v-for="rec in recentUploads" :key="rec.id" class="history-card" @click="viewUploadDetail(rec)">
          <div class="history-icon">{{ rec.format }}</div>
          <div class="history-info">
            <div class="history-name">{{ rec.fileName }}</div>
            <div class="history-time">{{ rec.createdAt }}</div>
          </div>
        </div>
        <div v-if="recentUploads.length === 0" class="history-empty">暂无上传记录</div>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑模型' : '上传模型'" width="min(640px, 92vw)" destroy-on-close @close="resetForm">
      <el-form :model="form" label-width="80px" :rules="formRules" ref="formRef">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width:100%">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select v-model="form.tags" multiple allow-create filterable default-first-option placeholder="输入标签" style="width:100%">
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="模型文件" prop="format">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :before-upload="beforeUpload"
            accept=".obj,.fbx,.glb,.gltf,.stl,.3ds,.dae"
          >
            <el-button icon="Upload">选择文件</el-button>
            <template #tip>
              <div style="color:#999;font-size:12px">支持 .obj/.fbx/.glb/.gltf/.stl/.3ds/.dae，最大500MB</div>
            </template>
          </el-upload>
          <div v-if="form.fileName" style="margin-top:8px">已选：{{ form.fileName }} ({{ form.fileSize }}MB)</div>
        </el-form-item>
        <el-form-item label="缩略图">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
          >
            <el-button icon="Picture">选择缩略图</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 分享 Dialog -->
    <el-dialog v-model="showShareDialog" title="分享模型" width="min(480px, 85vw)">
      <el-radio-group v-model="shareMode">
        <el-radio value="link">生成分享链接</el-radio>
        <el-radio value="approval">提交共享审批</el-radio>
      </el-radio-group>
      <div v-if="shareMode === 'link'" style="margin-top:16px">
        <el-input v-model="shareLink" readonly>
          <template #append>
            <el-button @click="copyLink">复制</el-button>
          </template>
        </el-input>
        <div style="margin-top:8px">
          <span>有效期：</span>
          <el-select v-model="shareExpire" style="width:120px">
            <el-option label="7天" value="7" />
            <el-option label="30天" value="30" />
            <el-option label="永久" value="0" />
          </el-select>
          <span style="margin-left:12px">密码：</span>
          <el-input v-model="sharePassword" placeholder="选填" style="width:120px" />
        </div>
      </div>
      <div v-if="shareMode === 'approval'" style="margin-top:16px">
        <el-input v-model="shareReason" type="textarea" placeholder="请输入共享原因" :rows="3" />
      </div>
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button type="primary" @click="submitShare">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="showDetailDrawer" title="模型详情" size="min(500px, 85vw)" direction="rtl">
      <template v-if="detailModel">
        <div class="detail-header">
          <div class="detail-thumbnail">{{ detailModel.format }}</div>
          <div class="detail-title">{{ detailModel.name }}</div>
          <el-tag :type="statusTagType(detailModel.status)">{{ detailModel.status }}</el-tag>
        </div>
        <el-descriptions :column="1" border style="margin-top:16px">
          <el-descriptions-item label="编码">{{ detailModel.code }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ detailModel.description }}</el-descriptions-item>
          <el-descriptions-item label="分类">{{ categoryName(detailModel.categoryId) }}</el-descriptions-item>
          <el-descriptions-item label="格式">{{ detailModel.format }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ detailModel.fileSize }} MB</el-descriptions-item>
          <el-descriptions-item label="上传者">{{ detailModel.uploaderId || '未知' }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ detailModel.updatedAt }}</el-descriptions-item>
        </el-descriptions>
        <div class="section-title">版本历史</div>
        <el-timeline v-if="versionList.length">
          <el-timeline-item v-for="ver in versionList" :key="ver.id" :timestamp="ver.createdAt" placement="top">
            <div class="version-item">
              <span class="version-number">{{ ver.versionNumber }}</span>
              <span class="version-notes">{{ ver.notes }}</span>
              <span v-if="ver.isCurrent" class="current-badge">(当前)</span>
            </div>
          </el-timeline-item>
        </el-timeline>
        <div v-else style="color:#999;padding:16px">暂无版本记录</div>
        <div class="section-title">关联项目</div>
        <div style="color:#999">（暂无关联项目信息）</div>
      </template>
      <template #footer>
        <el-button @click="showDetailDrawer = false">关闭</el-button>
        <el-button type="primary" @click="handleDownload(detailModel)">下载</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useModelStore } from '@/stores/model'
import { useModelVersionStore } from '@/stores/modelVersion'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { useShareRequestStore } from '@/stores/shareRequest'
import { useUploadRecordStore } from '@/stores/uploadRecord'

const modelStore = useModelStore()
const versionStore = useModelVersionStore()
const categoryStore = useModelCategoryStore()
const shareRequestStore = useShareRequestStore()
const uploadRecordStore = useUploadRecordStore()

// 顶部统计
const totalModels = computed(() => modelStore.total)
const totalSize = computed(() => {
  const total = modelStore.modelList.reduce((acc, m) => acc + (Number.isFinite(m.fileSize) ? m.fileSize : 0), 0)
  return total.toFixed(1)
})
const publishedCount = computed(() => modelStore.modelList.filter(m => m.status === '已发布').length)

// 分类数据
const categoryList = computed(() => categoryStore.categoryList)
const categoryName = (id) => categoryList.value.find(c => c.id === id)?.name || '未知'

// 标签云数据加工（统计标签出现次数）
const tagCountMap = computed(() => {
  const map = new Map()
  modelStore.modelList.forEach(m => {
    (m.tags || []).forEach(t => {
      map.set(t, (map.get(t) || 0) + 1)
    })
  })
  return map
})
const allTags = computed(() => [...tagCountMap.value.keys()])

// 构建图节点和边
const graphNodes = ref([])
const graphLinks = ref([])
const buildTagGraph = () => {
  const entries = [...tagCountMap.value.entries()]
  if (entries.length === 0) { graphNodes.value = []; graphLinks.value = []; return }
  const maxCount = Math.max(...entries.map(e => e[1]))
  const radius = 150
  const centerX = 200, centerY = 200
  const colors = ['#DC2626','#EA580C','#D97706','#059669','#0D9488','#2563EB','#7C3AED','#BE123C']
  const nodes = entries.map(([label, count], i) => {
    const angle = (i / entries.length) * 2 * Math.PI - Math.PI/2
    const r = radius * (0.7 + 0.3 * (count / maxCount))
    return {
      id: label,
      label,
      count,
      color: colors[i % colors.length],
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    }
  })
  graphNodes.value = nodes

  // 构建边（若两个标签同时出现在同一个模型则连线，强度 = 出现次数）
  const linkMap = new Map()
  modelStore.modelList.forEach(m => {
    const tags = m.tags || []
    for (let i = 0; i < tags.length; i++) {
      for (let j = i+1; j < tags.length; j++) {
        const key = [tags[i], tags[j]].sort().join('___')
        linkMap.set(key, (linkMap.get(key) || 0) + 1)
      }
    }
  })
  const links = []
  linkMap.forEach((strength, key) => {
    const [source, target] = key.split('___')
    const sourceNode = nodes.find(n => n.label === source)
    const targetNode = nodes.find(n => n.label === target)
    if (sourceNode && targetNode) {
      links.push({ source: sourceNode, target: targetNode, strength: Math.min(strength / 3, 1) })
    }
  })
  graphLinks.value = links
}
onMounted(() => {
  buildTagGraph()
})
// 标签点击筛选
const activeTag = ref(null)
const hoveredTag = ref(null)
const handleTagClick = (label) => {
  activeTag.value = activeTag.value === label ? null : label
}
const clearTagFilter = () => { activeTag.value = null }

// 筛选条件
const searchKeyword = ref('')
const statusFilter = ref([])
const dateRange = ref([])
const sortField = ref('updatedAt')
const currentPage = ref(1)
const pageSize = ref(20)

// 过滤逻辑
const filteredList = computed(() => {
  let list = modelStore.modelList.filter(m => m.status !== '已删除') // 排除软删除
  // 标签筛选
  if (activeTag.value) {
    list = list.filter(m => (m.tags || []).includes(activeTag.value))
  }
  // 关键词
  const kw = searchKeyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(m => m.name.toLowerCase().includes(kw) || (m.description && m.description.toLowerCase().includes(kw)))
  }
  // 状态
  if (statusFilter.value.length > 0) {
    list = list.filter(m => statusFilter.value.includes(m.status))
  }
  // 日期范围
  const [start, end] = dateRange.value
  if (start && end) {
    const st = start.getTime()
    const et = end.getTime()
    list = list.filter(m => {
      const t = new Date(m.updatedAt).getTime()
      return t >= st && t <= et
    })
  }
  // 排序
  const sort = sortField.value
  list.sort((a, b) => {
    if (sort === 'updatedAt') return new Date(b.updatedAt) - new Date(a.updatedAt)
    return a.name.localeCompare(b.name)
  })
  return list
})
const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})
const applyFilter = () => { currentPage.value = 1 }
const resetFilter = () => {
  searchKeyword.value = ''
  statusFilter.value = []
  dateRange.value = []
  sortField.value = 'updatedAt'
  activeTag.value = null
  currentPage.value = 1
}

// 状态标签颜色
const statusTagType = (status) => {
  const map = { '草稿': '', '审核中': 'warning', '已发布': 'success', '已归档': 'info' }
  return map[status] || ''
}

// 上传历史
const recentUploads = computed(() => uploadRecordStore.uploadRecordList.slice(-5).reverse())

// 新增/编辑
const showAddDialog = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref()
const uploadRef = ref()
const form = ref({
  name: '',
  description: '',
  categoryId: '',
  tags: [],
  format: '',
  fileName: '',
  fileSize: 0,
  code: ''
})
const formRules = {
  name: [{ required: true, message: '名称必填', trigger: 'blur' }, { max: 50, message: '不超过50字', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  format: [{ required: true, message: '请上传模型文件', trigger: 'change' }]
}
const resetForm = () => {
  form.value = { name: '', description: '', categoryId: '', tags: [], format: '', fileName: '', fileSize: 0, code: '' }
  isEdit.value = false
  editId.value = null
}
const handleEdit = (row) => {
  if (row.status === '已发布') return
  isEdit.value = true
  editId.value = row.id
  form.value = {
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    tags: [...(row.tags || [])],
    format: row.format,
    fileName: '',
    fileSize: row.fileSize,
    code: row.code
  }
  showAddDialog.value = true
}
const handleFileChange = (uploadFile) => {
  const file = uploadFile.raw
  if (!file) return
  // 格式检查
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const allowed = ['.obj', '.fbx', '.glb', '.gltf', '.stl', '.3ds', '.dae']
  if (!allowed.includes(ext)) {
    ElMessage.error('暂不支持该格式')
    uploadRef.value?.clearFiles()
    return
  }
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.error('单个模型文件不超过500MB')
    uploadRef.value?.clearFiles()
    return
  }
  form.value.format = ext.replace('.', '').toUpperCase()
  form.value.fileName = file.name
  form.value.fileSize = (file.size / 1024 / 1024).toFixed(1)
}
const beforeUpload = (file) => {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const allowed = ['.obj', '.fbx', '.glb', '.gltf', '.stl', '.3ds', '.dae']
  if (!allowed.includes(ext)) {
    ElMessage.error('暂不支持该格式')
    return false
  }
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.error('单个模型文件不超过500MB')
    return false
  }
  return true
}
const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const data = {
    name: form.value.name,
    description: form.value.description,
    categoryId: form.value.categoryId,
    tags: form.value.tags,
    format: form.value.format,
    fileSize: Number(form.value.fileSize) || 0,
    code: 'MOD-' + Date.now(),
    uploaderId: 'U001',
    status: '草稿',
    createdAt: new Date().toISOString().slice(0,19).replace('T', ' '),
    updatedAt: new Date().toISOString().slice(0,19).replace('T', ' ')
  }
  if (isEdit.value && editId.value) {
    modelStore.update(editId.value, data)
    ElMessage.success('编辑成功')
  } else {
    modelStore.add({ id: 'model_' + Date.now(), ...data })
    // 同时添加上传记录
    uploadRecordStore.add({
      id: 'uploadrecord_' + Date.now(),
      modelId: data.id,
      userId: 'U1001',
      fileName: form.value.fileName || data.name + '.' + form.value.format.toLowerCase(),
      fileSize: data.fileSize * 1024 * 1024,
      format: data.format,
      status: '完成',
      versionNumber: 'v1.0',
      createdAt: data.createdAt
    })
    ElMessage.success('上传成功')
  }
  showAddDialog.value = false
  resetForm()
  // 更新标签云
  nextTick(() => buildTagGraph())
}

// 删除
const handleDelete = async (row) => {
  // 检查是否被项目引用（这里我们简单假设如果有共享审批记录关联则视为被引用）
  const referenced = shareRequestStore.shareRequestList.some(sr => sr.modelId === row.id)
  let msg = `确认删除模型「${row.name}」？`
  if (referenced) {
    msg = `该资产已被项目引用，删除后引用将失效，是否继续？`
  }
  try {
    await ElMessageBox.confirm(msg, '确认删除', { type: 'warning' })
    modelStore.remove(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

// 下载
const handleDownload = (row) => {
  // 模拟下载
  ElMessage.success(`正在生成下载链接：${row.name}.${row.format.toLowerCase()}`)
}

// 分享
const showShareDialog = ref(false)
const shareMode = ref('link')
const shareReason = ref('')
const shareLink = ref('')
const shareExpire = ref('7')
const sharePassword = ref('')
let shareModelId = null
const handleShare = (row) => {
  shareModelId = row.id
  shareMode.value = 'link'
  shareReason.value = ''
  shareLink.value = `https://3dmodel.com/share/${row.code}?expire=${shareExpire.value}d`
  sharePassword.value = ''
  showShareDialog.value = true
}
const copyLink = () => {
  const input = document.createElement('input')
  input.value = shareLink.value
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
  ElMessage.success('链接已复制')
}
const submitShare = () => {
  if (shareMode.value === 'link') {
    ElMessage.success('分享链接已生成')
  } else {
    // 提交共享审批
    if (!shareReason.value.trim()) {
      ElMessage.warning('请输入共享原因')
      return
    }
    shareRequestStore.add({
      id: 'sharerequest_' + Date.now(),
      modelId: shareModelId,
      applicantId: 'U001',
      applicantName: '当前用户',
      reason: shareReason.value,
      status: '待审批',
      approverId: 'APPR_PENDING',
      approvedAt: '',
      createdAt: new Date().toISOString().slice(0,19).replace('T', ' ')
    })
    ElMessage.success('已提交共享审批')
  }
  showShareDialog.value = false
}

// 详情
const showDetailDrawer = ref(false)
const detailModel = ref(null)
const versionList = ref([])
const handleDetail = (row) => {
  detailModel.value = row
  versionList.value = versionStore.versionList.filter(v => v.modelId === row.id)
  showDetailDrawer.value = true
}
const viewUploadDetail = (rec) => {
  const model = modelStore.findById(rec.modelId)
  if (model) handleDetail(model)
}

// 获取展示细节
</script>

<style scoped lang="scss">
@use './MyAssets.scss' as *;
</style>