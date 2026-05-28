<template>
  <div class="page-model_detail">
    <!-- 顶部导航与操作 -->
    <div class="md-header">
      <div class="md-bread">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/model' }">模型管理</el-breadcrumb-item>
          <el-breadcrumb-item>模型详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="md-title-area">
        <div class="md-selector">
          <el-select v-model="selectedId" placeholder="选择模型" size="default" @change="handleModelChange">
            <el-option
              v-for="m in modelStore.modelList"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </el-select>
        </div>
        <div class="md-title-info">
          <h2 class="md-title">{{ currentModel.name }}</h2>
          <el-tag :type="modelStatusTagType(currentModel.status)" size="small">{{ currentModel.status }}</el-tag>
        </div>
        <div class="md-actions">
          <el-button type="primary" :disabled="!canEdit" @click="openEditDialog">编辑</el-button>
          <el-button type="danger" :disabled="!canDelete" @click="confirmDelete">删除</el-button>
          <el-popover placement="bottom" :width="320" trigger="click">
            <template #reference>
              <el-button>分享</el-button>
            </template>
            <div class="share-popover">
              <p class="share-label">分享链接</p>
              <div class="share-link-row">
                <el-input v-model="shareLink" readonly size="small" />
                <el-button size="small" @click="copyShareLink">复制</el-button>
              </div>
              <p class="share-label">有效期</p>
              <el-radio-group v-model="shareExpire" size="small">
                <el-radio label="1d">1天</el-radio>
                <el-radio label="7d">7天</el-radio>
                <el-radio label="forever">永久</el-radio>
              </el-radio-group>
            </div>
          </el-popover>
          <template v-if="currentModel.status === '审核中' && isAdmin">
            <el-button type="success" @click="openApprovalDialog('通过')">审批通过</el-button>
            <el-button type="warning" @click="openApprovalDialog('驳回')">驳回</el-button>
          </template>
        </div>
      </div>
    </div>

    <!-- 主体内容：左预览 + 右版本 -->
    <div class="md-main">
      <!-- 左：模型预览 + 基本信息 -->
      <div class="md-left">
        <div class="md-preview-card">
          <div class="preview-header">
            <el-icon><View /></el-icon>
            <span>3D 模型预览</span>
          </div>
          <div ref="previewContainer" class="preview-canvas"></div>
        </div>
        <div class="md-info-card">
          <div class="info-header">
            <el-icon><Document /></el-icon>
            <span>基本信息</span>
          </div>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="名称">{{ currentModel.name }}</el-descriptions-item>
            <el-descriptions-item label="编码">{{ currentModel.code }}</el-descriptions-item>
            <el-descriptions-item label="描述">{{ currentModel.description || '无' }}</el-descriptions-item>
            <el-descriptions-item label="标签">
              <el-tag v-for="tag in currentModel.tags" :key="tag" size="small" style="margin-right:4px">{{ tag }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="分类">{{ currentModel.categoryId ? modelCategoryStore.findById(currentModel.categoryId)?.name : '未分类' }}</el-descriptions-item>
            <el-descriptions-item label="格式">{{ currentModel.format }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(currentModel.fileSize) }}</el-descriptions-item>
            <el-descriptions-item label="上传者">{{ currentModel.uploaderId || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentModel.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ currentModel.updatedAt }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 右：版本时间线 + 版本表格 -->
      <div class="md-right">
        <!-- 版本时间线（招牌积木） -->
        <div class="md-timeline-card">
          <div class="timeline-header">
            <el-icon><Timer /></el-icon>
            <span>版本时间线</span>
          </div>
          <div class="timeline-container" v-if="filteredVersions.length">
            <div
              v-for="(ver, idx) in filteredVersions"
              :key="ver.id"
              class="timeline-item"
              :class="{ 'is-current': ver.isCurrent }"
              @click="openVersionNote(ver)"
            >
              <div class="tl-node">
                <div class="tl-dot"></div>
                <div v-if="idx < filteredVersions.length - 1" class="tl-line"></div>
              </div>
              <div class="tl-content">
                <span class="tl-version">{{ ver.versionNumber }}</span>
                <span class="tl-date">{{ ver.createdAt }}</span>
                <span v-if="ver.isCurrent" class="tl-badge">当前</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无版本" />
        </div>

        <!-- 版本列表筛选与表格 -->
        <div class="md-version-table-card">
          <div class="version-filter">
            <el-input
              v-model="versionKeyword"
              placeholder="按版本号搜索"
              clearable
              size="small"
              style="width:200px"
            />
            <el-date-picker
              v-model="versionDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              size="small"
              style="width:260px"
            />
          </div>
          <el-table
            :data="filteredVersions"
            stripe
            style="width:100%"
            max-height="300"
            @row-click="handleVersionRowClick"
          >
            <el-table-column prop="versionNumber" label="版本号" width="90" />
            <el-table-column prop="notes" label="备注" min-width="150" show-overflow-tooltip />
            <el-table-column label="上传者" width="80">
              <template #default="{ row }">{{ row.uploaderId }}</template>
            </el-table-column>
            <el-table-column prop="createdAt" label="上传日期" width="110" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.isCurrent" type="success" size="small">当前</el-tag>
                <el-tag v-else type="info" size="small">历史</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button size="small" link @click.stop="handleDownload(row)">下载</el-button>
                <el-button
                  size="small"
                  link
                  :disabled="row.isCurrent"
                  @click.stop="handleSetCurrent(row)"
                >设为当前</el-button>
                <el-button
                  size="small"
                  link
                  type="danger"
                  :disabled="row.isCurrent"
                  @click.stop="handleDeleteVersion(row)"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- 底部：关联信息 -->
    <div class="md-footer">
      <div class="md-related-card">
        <div class="related-header">
          <el-icon><Link /></el-icon>
          <span>关联项目（{{ referencedProjects.length }}）</span>
        </div>
        <div v-if="referencedProjects.length" class="related-list">
          <el-link
            v-for="proj in referencedProjects"
            :key="proj.id"
            type="primary"
            :underline="false"
            style="margin-right:16px"
          >{{ proj.name }}</el-link>
        </div>
        <span v-else class="no-data">暂无关联项目</span>
      </div>
      <div class="md-download-card">
        <div class="related-header">
          <el-icon><Download /></el-icon>
          <span>最近下载记录</span>
        </div>
        <div v-if="downloadRecords.length" class="download-list">
          <div v-for="rec in downloadRecords" :key="rec.id" class="download-item">
            <span>{{ rec.userId }}</span>
            <span>{{ rec.createdAt }}</span>
          </div>
        </div>
        <span v-else class="no-data">暂无下载记录</span>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑模型"
      width="min(640px, 92vw)"
      @close="resetEditForm"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input v-model="editForm.name" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="editForm.categoryId" filterable placeholder="选择分类">
                <el-option
                  v-for="cat in modelCategoryStore.categoryList"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
          >
            <el-option
              v-for="tag in currentModel.tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
          <div class="tag-hint">最多5个标签，回车添加</div>
        </el-form-item>
        <el-divider />
        <p class="upload-section-title">上传新版本（可选）</p>
        <el-form-item label="缩略图">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            @change="handleThumbnailChange"
          >
            <el-button size="small">选择图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="模型文件">
          <el-upload
            action="#"
            :auto-upload="false"
            :show-file-list="true"
            @change="handleModelFileChange"
          >
            <el-button size="small">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持FBX/OBJ/glTF等格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog
      v-model="approvalDialogVisible"
      :title="approvalAction === '通过' ? '审批通过' : '驳回'"
      width="min(400px, 90vw)"
    >
      <el-form>
        <el-form-item label="审批意见">
          <el-input
            v-model="approvalComment"
            type="textarea"
            :rows="3"
            :placeholder="approvalAction === '驳回' ? '请输入驳回原因（必填）' : '可选审批意见'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">确认</el-button>
      </template>
    </el-dialog>

    <!-- 版本备注弹窗 -->
    <el-dialog
      v-model="versionNoteDialogVisible"
      title="版本备注"
      width="min(400px, 90vw)"
    >
      <p>{{ selectedVersionNote }}</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { View, Document, Timer, Link, Download } from '@element-plus/icons-vue'
import { useModelStore } from '@/stores/model'
import { useModelVersionStore } from '@/stores/modelVersion'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { useTeamMemberStore } from '@/stores/teamMember'
import { useShareRequestStore } from '@/stores/shareRequest'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useUploadRecordStore } from '@/stores/uploadRecord'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const route = useRoute()
const router = useRouter()

const modelStore = useModelStore()
const versionStore = useModelVersionStore()
const modelCategoryStore = useModelCategoryStore()
const teamMemberStore = useTeamMemberStore()
const shareRequestStore = useShareRequestStore()
const approvalRecordStore = useApprovalRecordStore()
const uploadRecordStore = useUploadRecordStore()

// 当前选中的模型 ID
const selectedId = ref(route.query.id || modelStore.modelList[0]?.id || '')
const currentModel = computed(() => {
  const found = modelStore.findById(selectedId.value)
  return found || modelStore.modelList[0] || {}
})

// 版本列表（当前模型的所有版本）
const allVersions = computed(() => {
  if (!selectedId.value) return []
  return versionStore.versionList.filter(v => v.modelId === selectedId.value)
})

// 版本筛选
const versionKeyword = ref('')
const versionDateRange = ref([]) // 初始空数组

const filteredVersions = computed(() => {
  let list = allVersions.value
  if (versionKeyword.value) {
    const kw = versionKeyword.value.toLowerCase()
    list = list.filter(v => v.versionNumber.toLowerCase().includes(kw))
  }
  if (versionDateRange.value && versionDateRange.value.length === 2) {
    const [start, end] = versionDateRange.value
    if (start && end) {
      const s = new Date(start).getTime()
      const e = new Date(end).getTime() + 86400000
      list = list.filter(v => {
        const t = new Date(v.createdAt).getTime()
        return t >= s && t <= e
      })
    }
  }
  return list
})

// 关联项目（模拟：从 uploadRecord 中找使用此模型的记录）
const referencedProjects = computed(() => {
  // 用 uploadRecord 中 modelId 匹配，取出 userId 当作项目名（模拟）
  const records = uploadRecordStore.uploadRecordList.filter(r => r.modelId === selectedId.value)
  // 返回简易对象
  return records.map((r, idx) => ({ id: r.id, name: `项目-${r.userId || idx+1}` })).slice(0, 5)
})

// 下载记录：从 uploadRecord 中取最近10条此模型的上传记录
const downloadRecords = computed(() => {
  return uploadRecordStore.uploadRecordList
    .filter(r => r.modelId === selectedId.value)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
})

// 当前用户是否为管理员
const currentUserId = 'U001' // 模拟当前用户ID
const currentUserRole = computed(() => {
  const member = teamMemberStore.memberList.find(m => m.userId === currentUserId)
  return member?.role || '查看者'
})
const isAdmin = computed(() => currentUserRole.value === '管理员')

// 权限控制
const canEdit = computed(() => {
  if (currentModel.value.status === '已发布' || currentModel.value.status === '审核中') {
    return isAdmin.value
  }
  return true // 草稿/驳回可编辑
})
const canDelete = computed(() => {
  return ['草稿', '已归档'].includes(currentModel.value.status) || isAdmin.value
})

// 3D 场景
const previewContainer = ref(null)
let scene, camera, renderer, controls, cube

function initThree() {
  if (!previewContainer.value) return
  const container = previewContainer.value
  const width = container.clientWidth
  const height = 280
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xf0f4f8)
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(3, 2, 5)
  camera.lookAt(0, 0, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.autoRotate = true
  controls.autoRotateSpeed = 2.0
  controls.target.set(0, 0.5, 0)
  // 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight.position.set(1, 2, 1)
  scene.add(dirLight)
  // 创建一个组合体（立方体+球体等）
  const group = new THREE.Group()
  const boxGeom = new THREE.BoxGeometry(1, 1, 1)
  const boxMat = new THREE.MeshPhongMaterial({ color: 0x0D9488, transparent: true, opacity: 0.8 })
  const box = new THREE.Mesh(boxGeom, boxMat)
  box.position.y = 0.5
  group.add(box)
  const sphereGeom = new THREE.SphereGeometry(0.4, 16, 16)
  const sphereMat = new THREE.MeshPhongMaterial({ color: 0xf97316 })
  const sphere = new THREE.Mesh(sphereGeom, sphereMat)
  sphere.position.set(0.7, 1.2, 0.3)
  group.add(sphere)
  const torusGeom = new THREE.TorusGeometry(0.3, 0.1, 12, 24)
  const torusMat = new THREE.MeshPhongMaterial({ color: 0x3b82f6 })
  const torus = new THREE.Mesh(torusGeom, torusMat)
  torus.position.set(-0.6, 0.8, -0.4)
  torus.rotation.x = Math.PI / 3
  group.add(torus)
  scene.add(group)
  // 地面网格
  const gridHelper = new THREE.GridHelper(3, 10, 0xcccccc, 0x999999)
  gridHelper.position.y = -0.01
  scene.add(gridHelper)
  cube = group
  animate()
}

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

function resizeRenderer() {
  if (renderer && previewContainer.value) {
    const width = previewContainer.value.clientWidth
    const height = 280
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height)
  }
}

onMounted(() => {
  initThree()
  window.addEventListener('resize', resizeRenderer)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeRenderer)
  if (renderer) {
    renderer.dispose()
  }
  if (controls) {
    controls.dispose()
  }
})

// 切换模型
function handleModelChange(id) {
  selectedId.value = id
  // 可以更新路由（可选）
  router.replace({ path: '/model-view', query: { id } })
}

// 状态标签类型
function modelStatusTagType(status) {
  const map = {
    '草稿': 'info',
    '审核中': 'warning',
    '已发布': 'success',
    '已归档': '',
    '已删除': 'danger'
  }
  return map[status] || 'info'
}

// 文件大小格式化
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(1)} ${units[i]}`
}

// 分享
const shareLink = ref('')
const shareExpire = ref('1d')
function copyShareLink() {
  const link = `http://model-platform.com/model-view?shareToken=sh_${selectedId.value}_${Date.now()}`
  shareLink.value = link
  navigator.clipboard.writeText(link).then(() => {
    ElMessage.success('链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

// 编辑
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({
  name: '',
  description: '',
  tags: [],
  categoryId: '',
  thumbnailFile: null,
  modelFile: null
})

const editRules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

function openEditDialog() {
  editForm.value = {
    name: currentModel.value.name,
    description: currentModel.value.description || '',
    tags: [...(currentModel.value.tags || [])],
    categoryId: currentModel.value.categoryId || '',
    thumbnailFile: null,
    modelFile: null
  }
  editDialogVisible.value = true
}

function handleThumbnailChange(file) {
  editForm.value.thumbnailFile = file.raw
}
function handleModelFileChange(file) {
  editForm.value.modelFile = file.raw
}

function submitEdit() {
  editFormRef.value.validate((valid) => {
    if (!valid) return
    // 更新模型基本信息
    const patch = {
      name: editForm.value.name,
      description: editForm.value.description,
      tags: editForm.value.tags.slice(0, 5),
      categoryId: editForm.value.categoryId,
      updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }
    modelStore.update(selectedId.value, patch)
    // 上传新版本（如果有模型文件）
    if (editForm.value.modelFile) {
      const newVersion = {
        id: `modelversion_${Date.now()}`,
        modelId: selectedId.value,
        versionNumber: `v${allVersions.value.length + 1}.0`,
        filePath: `/uploads/${editForm.value.modelFile.name}`,
        fileSize: editForm.value.modelFile.size / 1024,
        notes: `编辑上传 - ${editForm.value.modelFile.name}`,
        uploaderId: '张伟',
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        isCurrent: allVersions.value.length === 0 // 如果没有版本则设为当前
      }
      versionStore.add(newVersion)
      // 添加上传记录
      uploadRecordStore.add({
        id: `uploadrecord_${Date.now()}`,
        modelId: selectedId.value,
        userId: '张伟',
        fileName: editForm.value.modelFile.name,
        fileSize: editForm.value.modelFile.size / 1024,
        format: editForm.value.modelFile.name.split('.').pop().toUpperCase(),
        status: '完成',
        versionNumber: newVersion.versionNumber,
        createdAt: newVersion.createdAt
      })
    }
    // 如果有缩略图，忽略（无对应字段）
    editDialogVisible.value = false
    ElMessage.success('修改已保存')
  })
}

function resetEditForm() {
  editForm.value = { name: '', description: '', tags: [], categoryId: '', thumbnailFile: null, modelFile: null }
}

// 删除模型
async function confirmDelete() {
  // 检查是否有关联项目（这里模拟检查 shareRequest 中此模型是否有引用）
  const refCount = shareRequestStore.shareRequestList.filter(s => s.modelId === selectedId.value).length
  if (refCount > 0) {
    // 显示引用列表
    const refItems = shareRequestStore.shareRequestList
      .filter(s => s.modelId === selectedId.value)
      .map(s => `- ${s.applicantName} 的申请`)
      .join('\n')
    try {
      await ElMessageBox.confirm(
        `该模型被以下引用，删除后将无法恢复。\n${refItems}\n\n请输入模型名称“${currentModel.value.name}”确认删除：`,
        '确认删除',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          inputPlaceholder: '请输入模型名称',
          inputValidator: (val) => val === currentModel.value.name,
          inputErrorMessage: '模型名称不匹配'
        }
      )
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm(`确定要删除模型“${currentModel.value.name}”吗？此操作不可恢复。`, '确认删除', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  modelStore.remove(selectedId.value)
  ElMessage.success('模型已删除')
  router.push('/model')
}

// 审批
const approvalDialogVisible = ref(false)
const approvalAction = ref('')
const approvalComment = ref('')
function openApprovalDialog(action) {
  approvalAction.value = action
  approvalComment.value = ''
  approvalDialogVisible.value = true
}
function submitApproval() {
  if (approvalAction.value === '驳回' && !approvalComment.value.trim()) {
    ElMessage.warning('请填写驳回原因')
    return
  }
  const newStatus = approvalAction.value === '通过' ? '已发布' : '草稿'
  modelStore.update(selectedId.value, {
    status: newStatus,
    updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  // 记录审批记录（模拟）
  approvalRecordStore.add({
    id: `approvalrecord_${Date.now()}`,
    shareRequestId: 'sharerequest_mock',
    approverId: currentUserId,
    action: approvalAction.value,
    comment: approvalComment.value,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' ')
  })
  approvalDialogVisible.value = false
  ElMessage.success(`已${approvalAction.value}`)
}

// 版本操作
function handleDownload(version) {
  ElMessage.success(`正在下载版本 ${version.versionNumber}`)
  // 模拟下载
}

function handleSetCurrent(version) {
  // 假设版本文件完整（这里直接设置）
  versionStore.update(version.id, { isCurrent: true })
  // 其他版本设为非当前
  allVersions.value.forEach(v => {
    if (v.id !== version.id) {
      versionStore.update(v.id, { isCurrent: false })
    }
  })
  ElMessage.success(`已切换当前版本为 ${version.versionNumber}`)
}

function handleDeleteVersion(version) {
  ElMessageBox.confirm('删除版本后无法恢复，是否继续？', '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    versionStore.remove(version.id)
    ElMessage.success('版本已删除')
  }).catch(() => {})
}

function handleVersionRowClick(row) {
  openVersionNote(row)
}

const versionNoteDialogVisible = ref(false)
const selectedVersionNote = ref('')
function openVersionNote(version) {
  selectedVersionNote.value = version.notes || '无备注信息'
  versionNoteDialogVisible.value = true
}
</script>

<style scoped lang="scss">
@use './ModelView.scss' as *;
</style>