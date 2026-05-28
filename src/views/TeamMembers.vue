<template>
  <div class="page-team_management">
    <!-- ===== 顶部统计栏 + 操作按钮 ===== -->
    <div class="tm-header">
      <div class="tm-header__stats">
        <div class="tm-stat-item">
          <span class="tm-stat-num">{{ totalMembers.toLocaleString() }}</span>
          <span class="tm-stat-label">团队成员</span>
        </div>
        <div class="tm-stat-divider"></div>
        <div class="tm-stat-item">
          <span class="tm-stat-num">{{ totalContribution.toLocaleString() }}</span>
          <span class="tm-stat-label">总贡献</span>
        </div>
      </div>
      <div class="tm-header__actions">
        <el-button type="primary" class="tm-btn-primary" @click="openAddDialog">
          <el-icon style="margin-right:6px"><Plus /></el-icon>添加成员
        </el-button>
        <el-button class="tm-btn-outline" @click="handleCopyInviteLink">
          <el-icon style="margin-right:6px"><Link /></el-icon>复制邀请链接
        </el-button>
      </div>
    </div>

    <!-- ===== 筛选区 ===== -->
    <div class="tm-filters">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索姓名或邮箱"
        clearable
        class="tm-filter-input"
        :prefix-icon="Search"
      />
      <el-select v-model="filterStatus" placeholder="全部状态" clearable class="tm-filter-select">
        <el-option label="全部状态" value="" />
        <el-option label="活跃" value="活跃" />
        <el-option label="已禁用" value="已禁用" />
        <el-option label="待邀请" value="待邀请" />
      </el-select>
      <el-select v-model="filterRole" placeholder="全部角色" clearable class="tm-filter-select">
        <el-option label="全部角色" value="" />
        <el-option label="管理员" value="管理员" />
        <el-option label="编辑者" value="编辑者" />
        <el-option label="查看者" value="查看者" />
      </el-select>
    </div>

    <!-- ===== 主体区域：柱林 + 表格 ===== -->
    <div class="tm-main">
      <!-- 左：贡献柱林 -->
      <div class="tm-forest-wrap">
        <div class="tm-section-header">
          <span class="tm-section-dot"></span>
          <span>贡献柱林</span>
        </div>
        <div class="tm-forest" ref="forestRef">
          <svg
            v-if="sortedMembers.length > 0"
            :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            preserveAspectRatio="xMidYMid meet"
            class="tm-forest-svg"
          >
            <!-- Y轴基线 -->
            <line
              :x1="paddingLeft"
              :y1="svgHeight - marginBottom"
              :x2="svgWidth - paddingRight"
              :y2="svgHeight - marginBottom"
              stroke="#D1D5DB"
              stroke-width="1"
            />
            <!-- 柱子 -->
            <g
              v-for="(m, i) in sortedMembers"
              :key="m.id"
              :transform="`translate(${getBarX(i)}, 0)`"
              class="tm-bar-group"
              @mouseenter="hoveredBar = i"
              @mouseleave="hoveredBar = -1"
              @click="handleBarClick(m)"
            >
              <!-- 柱体 -->
              <rect
                :x="0"
                :y="getBarY(m.contributionCount)"
                :width="barWidth"
                :height="getBarHeight(m.contributionCount)"
                :fill="getBarColor(i)"
                :rx="4"
                :ry="4"
                :class="{ 'tm-bar--active': hoveredBar === i }"
              />
              <!-- 柱顶名称 -->
              <text
                :x="barWidth / 2"
                :y="svgHeight - marginBottom + 16"
                text-anchor="middle"
                class="tm-bar-label"
                :font-size="barLabelFontSize"
                :transform="`rotate(-30, ${barWidth / 2}, ${svgHeight - marginBottom + 16})`"
              >{{ m.name.length > 3 ? m.name.slice(0, 3) + '..' : m.name }}</text>
              <!-- hover 数值浮标 -->
              <g v-if="hoveredBar === i">
                <rect
                  :x="barWidth / 2 - 24"
                  :y="getBarY(m.contributionCount) - 28"
                  width="48"
                  height="22"
                  rx="4"
                  fill="rgba(0,0,0,0.75)"
                />
                <text
                  :x="barWidth / 2"
                  :y="getBarY(m.contributionCount) - 13"
                  text-anchor="middle"
                  fill="#fff"
                  font-size="12"
                  font-weight="600"
                >{{ m.contributionCount.toLocaleString() }}</text>
              </g>
            </g>
          </svg>
          <el-empty v-else description="暂无成员贡献数据" :image-size="80" />
        </div>
      </div>

      <!-- 右：成员表格 -->
      <div class="tm-table-wrap">
        <div class="tm-section-header">
          <span class="tm-section-dot"></span>
          <span>成员列表</span>
          <span class="tm-section-count">（{{ filteredMembers.length }}）</span>
        </div>
        <el-table
          :data="filteredMembers"
          stripe
          style="width:100%"
          highlight-current-row
          class="tm-member-table"
          empty-text="暂无匹配成员"
        >
          <el-table-column label="姓名" min-width="100">
            <template #default="{ row }">
              <div class="tm-cell-name">
                <span class="tm-avatar">{{ row.name.charAt(0) }}</span>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag
                :type="roleTagType(row.role)"
                size="small"
                effect="plain"
              >{{ row.role }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag
                :type="statusTagType(row.status)"
                size="small"
                :effect="row.status === '活跃' ? 'dark' : 'plain'"
              >{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="贡献" width="80" align="right">
            <template #default="{ row }">
              <span class="tm-cell-contribution">{{ row.contributionCount.toLocaleString() }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="tm-cell-actions">
                <el-button link size="small" @click="openEditDialog(row)">编辑</el-button>
                <el-button link size="small" @click="handleDelete(row)">删除</el-button>
                <el-button link size="small" @click="openDetailDrawer(row)">详情</el-button>
                <el-button
                  v-if="row.status === '待邀请'"
                  link
                  size="small"
                  type="warning"
                  @click="handleResendInvite(row)"
                >重发邀请</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- ===== 底部邀请区 ===== -->
    <div class="tm-footer">
      <div class="tm-footer__left">
        <span class="tm-footer__icon"><el-icon><Link /></el-icon></span>
        <span class="tm-footer__label">团队邀请链接</span>
        <code class="tm-footer__link">{{ inviteLinkText }}</code>
        <el-button size="small" class="tm-btn-copy" @click="handleCopyInviteLink">复制</el-button>
      </div>
      <div class="tm-footer__right">
        <span class="tm-footer__label">快速邀请</span>
        <el-input
          v-model="quickInviteEmail"
          placeholder="输入邮箱地址"
          size="small"
          class="tm-footer__input"
        />
        <el-button
          size="small"
          type="primary"
          class="tm-btn-send"
          :disabled="!quickInviteEmail"
          @click="handleQuickInvite"
        >发送邀请</el-button>
      </div>
    </div>

    <!-- ===== 添加/编辑成员 Dialog ===== -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑成员' : '添加成员'"
      width="min(500px, 92vw)"
      :close-on-click-modal="false"
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-width="70px"
        label-position="left"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formModel.name" placeholder="请输入姓名" maxlength="20" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formModel.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formModel.role" placeholder="选择角色" style="width:100%">
            <el-option label="管理员" value="管理员" />
            <el-option label="编辑者" value="编辑者" />
            <el-option label="查看者" value="查看者" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- ===== 详情 Drawer ===== -->
    <el-drawer
      v-model="drawerVisible"
      title="成员详情"
      size="min(420px, 85vw)"
      :close-on-click-modal="false"
    >
      <template v-if="detailMember">
        <div class="tm-detail">
          <div class="tm-detail__avatar">
            <span class="tm-detail__avatar-text">{{ detailMember.name.charAt(0) }}</span>
          </div>
          <h3 class="tm-detail__name">{{ detailMember.name }}</h3>

          <div class="tm-detail__grid">
            <div class="tm-detail__item">
              <span class="tm-detail__label">邮箱</span>
              <span class="tm-detail__value">{{ detailMember.email }}</span>
            </div>
            <div class="tm-detail__item">
              <span class="tm-detail__label">角色</span>
              <el-tag :type="roleTagType(detailMember.role)" size="small" effect="plain">{{ detailMember.role }}</el-tag>
            </div>
            <div class="tm-detail__item">
              <span class="tm-detail__label">状态</span>
              <el-tag :type="statusTagType(detailMember.status)" size="small" :effect="detailMember.status === '活跃' ? 'dark' : 'plain'">{{ statusLabel(detailMember.status) }}</el-tag>
            </div>
            <div class="tm-detail__item">
              <span class="tm-detail__label">加入时间</span>
              <span class="tm-detail__value">{{ detailMember.joinedAt }}</span>
            </div>
            <div class="tm-detail__item">
              <span class="tm-detail__label">总贡献</span>
              <span class="tm-detail__value tm-detail__value--accent">{{ detailMember.contributionCount.toLocaleString() }}</span>
            </div>
            <div class="tm-detail__item">
              <span class="tm-detail__label">最近活跃</span>
              <span class="tm-detail__value">{{ detailMember.joinedAt || '暂无记录' }}</span>
            </div>
          </div>

          <div class="tm-detail__section">
            <span class="tm-detail__section-title">最近操作记录</span>
            <div v-if="memberUploads.length > 0" class="tm-detail__records">
              <div v-for="rec in memberUploads.slice(0, 5)" :key="rec.id" class="tm-detail__record-item">
                <span class="tm-detail__record-name">{{ rec.fileName }}</span>
                <span class="tm-detail__record-time">{{ rec.createdAt }}</span>
                <el-tag size="small" type="success" effect="plain" v-if="rec.status === '完成'">完成</el-tag>
              </div>
            </div>
            <el-empty v-else description="暂无操作记录" :image-size="48" />
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Link, Search } from '@element-plus/icons-vue'
import { useTeamMemberStore } from '@/stores/teamMember'
import { useUploadRecordStore } from '@/stores/uploadRecord'

// ─── Stores ───
const teamStore = useTeamMemberStore()
const uploadStore = useUploadRecordStore()

// ─── 基础数据 ───
const memberList = computed(() => teamStore.memberList || [])

// ─── 统计 ───
const totalMembers = computed(() => memberList.value.length)
const totalContribution = computed(() =>
  memberList.value.reduce((sum, m) => sum + (Number.isFinite(m.contributionCount) ? m.contributionCount : 0), 0)
)

// ─── 筛选 ───
const searchKeyword = ref('')
const filterStatus = ref('')
const filterRole = ref('')

const filteredMembers = computed(() => {
  let list = memberList.value
  if (searchKeyword.value) {
    const kw = searchKeyword.value.trim().toLowerCase()
    list = list.filter(m => m.name.toLowerCase().includes(kw) || m.email.toLowerCase().includes(kw))
  }
  if (filterStatus.value) {
    list = list.filter(m => m.status === filterStatus.value)
  }
  if (filterRole.value) {
    list = list.filter(m => m.role === filterRole.value)
  }
  return list.slice().sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))
})

// ─── 贡献柱林 ───
const sortedMembers = computed(() => {
  return memberList.value.slice().sort((a, b) => b.contributionCount - a.contributionCount)
})

const forestRef = ref(null)
const hoveredBar = ref(-1)

const svgWidth = 600
const svgHeight = 300
const marginBottom = 48
const paddingLeft = 16
const paddingRight = 16

const barAreaWidth = computed(() => svgWidth - paddingLeft - paddingRight)
const barCount = computed(() => sortedMembers.value.length)
const barWidth = computed(() => {
  if (barCount.value === 0) return 20
  const gap = 12
  return Math.max(20, (barAreaWidth.value - gap * (barCount.value - 1)) / barCount.value)
})
const barLabelFontSize = computed(() => Math.min(12, Math.max(9, barWidth.value * 0.45)))

function getBarX(index) {
  const gap = 12
  let offset = paddingLeft
  for (let i = 0; i < index; i++) {
    offset += barWidth.value + gap
  }
  return offset
}

function getMaxCount() {
  if (sortedMembers.value.length === 0) return 1
  return Math.max(1, ...sortedMembers.value.map(m => (Number.isFinite(m.contributionCount) ? m.contributionCount : 0)))
}

function getBarHeight(count) {
  const maxH = svgHeight - marginBottom - 8
  const maxC = getMaxCount()
  return maxC > 0 ? Math.max(4, (count / maxC) * maxH) : 4
}
function getBarY(count) {
  return svgHeight - marginBottom - getBarHeight(count)
}

const barColors = ['#D97706', '#E88D2A', '#F0A34A', '#F5B96A', '#FACD8A', '#FDE1AA']
function getBarColor(index) {
  return barColors[index % barColors.length]
}

function handleBarClick(member) {
  openDetailDrawer(member)
}

// ─── Dialog 表单 ───
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref('')
const submitting = ref(false)
const formRef = ref(null)
const formModel = ref({ name: '', email: '', role: '' })

const formRules = computed(() => ({
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 1, max: 20, message: '姓名长度1-20字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}))

function openAddDialog() {
  isEditing.value = false
  editingId.value = ''
  formModel.value = { name: '', email: '', role: '' }
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEditing.value = true
  editingId.value = row.id
  formModel.value = {
    name: row.name,
    email: row.email,
    role: row.role
  }
  dialogVisible.value = true
}

function resetForm() {
  formRef.value?.resetFields()
  submitting.value = false
}

function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEditing.value) {
        // 编辑：检查邮箱唯一性（排除自己）
        const exist = memberList.value.find(m => m.email === formModel.value.email && m.id !== editingId.value)
        if (exist) {
          ElMessage.warning('该邮箱已为团队成员')
          submitting.value = false
          return
        }
        teamStore.update(editingId.value, {
          name: formModel.value.name,
          email: formModel.value.email,
          role: formModel.value.role
        })
        ElMessage.success('成员信息已更新')
      } else {
        // 新增：检查邮箱唯一性
        const exist = memberList.value.find(m => m.email === formModel.value.email)
        if (exist) {
          ElMessage.warning('该邮箱已为团队成员')
          submitting.value = false
          return
        }
        const now = new Date()
        const pad = n => String(n).padStart(2, '0')
        const joinedAt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
        teamStore.add({
          id: 'tm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          userId: 'U' + Date.now(),
          name: formModel.value.name,
          email: formModel.value.email,
          role: formModel.value.role,
          status: '待邀请',
          joinedAt,
          contributionCount: 0
        })
        ElMessage.success('成员添加成功')
      }
      dialogVisible.value = false
    } catch (e) {
      ElMessage.error('操作失败，请重试')
    } finally {
      submitting.value = false
    }
  })
}

// ─── 删除 ───
function handleDelete(row) {
  const isSelf = row.id === 'current_user_id' // 简化：无实际当前用户判断
  const message = isSelf
    ? '确定退出团队？此操作不可撤销'
    : '确定移除该成员？移除后该成员将失去团队内所有模型访问权限。'
  ElMessageBox.confirm(message, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    teamStore.remove(row.id)
    ElMessage.success('成员已移除')
  }).catch(() => {})
}

// ─── 详情 Drawer ───
const drawerVisible = ref(false)
const detailMember = ref(null)

const memberUploads = computed(() => {
  if (!detailMember.value) return []
  const userId = detailMember.value.userId
  return uploadStore.uploadRecordList.filter(r => r.userId === userId).slice(0, 10)
})

function openDetailDrawer(row) {
  detailMember.value = row
  drawerVisible.value = true
}

// ─── 复制邀请链接 ───
const inviteLinkText = 'https://team.modelhub.com/invite?team=TM3D&code=abc123'

function handleCopyInviteLink() {
  navigator.clipboard.writeText(inviteLinkText).then(() => {
    ElMessage.success('邀请链接已复制，有效期7天')
  }).catch(() => {
    ElMessage.warning('复制失败，请手动复制')
  })
}

// ─── 重发邀请 ───
function handleResendInvite(row) {
  ElMessage.success(`邀请已重新发送至 ${row.email}`)
}

// ─── 快速邀请 ───
const quickInviteEmail = ref('')
function handleQuickInvite() {
  if (!quickInviteEmail.value) return
  const email = quickInviteEmail.value.trim()
  const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailReg.test(email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  const exist = memberList.value.find(m => m.email === email)
  if (exist) {
    ElMessage.warning('该邮箱已为团队成员')
    return
  }
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  const joinedAt = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
  teamStore.add({
    id: 'tm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    userId: 'U' + Date.now(),
    name: email.split('@')[0],
    email: email,
    role: '查看者',
    status: '待邀请',
    joinedAt,
    contributionCount: 0
  })
  ElMessage.success('邀请已发送')
  quickInviteEmail.value = ''
}

// ─── 辅助函数 ───
function roleTagType(role) {
  const map = { '管理员': 'warning', '编辑者': 'primary', '查看者': 'info' }
  return map[role] || 'info'
}
function statusTagType(status) {
  const map = { '活跃': 'success', '已禁用': 'danger', '待邀请': 'warning' }
  return map[status] || 'info'
}
function statusLabel(status) {
  const map = { '活跃': '已激活', '已禁用': '已禁用', '待邀请': '待邀请' }
  return map[status] || status
}
</script>

<style scoped lang="scss">
@use './TeamMembers.scss' as *;
</style>