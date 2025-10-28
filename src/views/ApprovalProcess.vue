<template>
  <div class="approval-process">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>航清噪音项目申报综合管理系统</h1>
      <p>高效协同完成项目申报材料的准备与审批</p>
    </div>

    <!-- 快速操作区域 -->
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="action in quickActions" :key="action.title">
          <el-card shadow="hover" class="action-card" @click="handleAction(action)">
            <div class="action-icon">
              <span class="custom-icon" :class="action.iconClass"></span>
            </div>
            <h3>{{ action.title }}</h3>
            <p>{{ action.description }}</p>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 进行中的项目 -->
    <div class="ongoing-projects">
      <div class="section-header">
        <h2>进行中的项目</h2>
        <el-button type="primary" link @click="showAllProjects">查看全部</el-button>
      </div>
      
      <el-table :data="ongoingProjects" style="width: 100%" empty-text="暂无进行中的项目">
        <el-table-column prop="name" label="项目名称" min-width="200" />
        <el-table-column prop="type" label="项目类型" width="120" />
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="getProgressStatus(row.progress)" />
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="120" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewProject(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 通知公告 -->
    <div class="notices">
      <div class="section-header">
        <h2>最新通知</h2>
        <el-button type="primary" link @click="showAllNotices">查看全部</el-button>
      </div>
      
      <el-timeline>
        <el-timeline-item
          v-for="(notice, index) in notices"
          :key="index"
          :timestamp="notice.time"
          :type="notice.type"
          :hollow="notice.type === 'primary'"
        >
          <el-card>
            <h4>{{ notice.title }}</h4>
            <p>{{ notice.content }}</p>
            <div class="notice-footer">
              <span>发布人: {{ notice.publisher }}</span>
              <el-button v-if="notice.hasAttachment" type="primary" link size="small" @click="viewAttachment(notice)">
                查看附件
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="50%"
      :before-close="handleClose"
    >
      <div v-html="dialogContent"></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 快速操作数据
const quickActions = ref([
  {
    title: '新建项目',
    description: '创建新的申报项目',
    iconClass: 'icon-new-project',
    action: 'create'
  },
  {
    title: '编辑材料',
    description: '修改已有申报材料',
    iconClass: 'icon-edit-material',
    action: 'edit'
  },
  {
    title: '上传文件',
    description: '上传申报相关文件',
    iconClass: 'icon-upload-file',
    action: 'upload'
  },
  {
    title: '下载模板',
    description: '获取申报材料模板',
    iconClass: 'icon-download-template',
    action: 'download'
  },
  {
    title: '预览材料',
    description: '查看申报材料效果',
    iconClass: 'icon-preview-material',
    action: 'preview'
  },
  {
    title: '系统设置',
    description: '配置系统参数',
    iconClass: 'icon-system-settings',
    action: 'settings'
  }
])

// 进行中的项目数据
const ongoingProjects = ref([
  {
    id: 1,
    name: '2023年度科技创新基金项目',
    type: '科技类',
    progress: 65,
    deadline: '2023-11-30',
    status: 'processing'
  },
  {
    id: 2,
    name: '省级文化产业发展专项资金',
    type: '文化类',
    progress: 30,
    deadline: '2023-12-15',
    status: 'processing'
  },
  {
    id: 3,
    name: '中小企业发展扶持项目',
    type: '经济类',
    progress: 90,
    deadline: '2023-10-20',
    status: 'success'
  }
])

// 通知公告数据
const notices = ref([
  {
    title: '关于2023年度项目申报截止日期提醒',
    content: '请各位申报单位注意，2023年度项目申报将于11月30日截止，请及时提交材料。',
    time: '2023-10-15 09:30',
    type: 'primary',
    publisher: '系统管理员',
    hasAttachment: true,
    attachmentUrl: '/attachments/deadline-notice.pdf'
  },
  {
    title: '系统维护通知',
    content: '本系统将于本周六晚上10点至周日凌晨2点进行维护，期间可能无法正常访问。',
    time: '2023-10-12 14:15',
    type: 'info',
    publisher: '技术支持',
    hasAttachment: false
  },
  {
    title: '新功能上线：材料智能检查',
    content: '新增材料智能检查功能，可自动检测申报材料的完整性和规范性。',
    time: '2023-10-08 16:45',
    type: 'success',
    publisher: '产品团队',
    hasAttachment: true,
    attachmentUrl: '/attachments/new-feature-guide.docx'
  }
])

// 弹窗相关状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogContent = ref('')

// 处理快速操作点击
const handleAction = (action) => {
  dialogTitle.value = `${action.title} - 政策项目申报平台`
  
  switch(action.action) {
    case 'create':
      dialogContent.value = '<p>新建项目功能将引导您完成以下步骤：</p><ol><li>选择项目类型</li><li>填写项目基本信息</li><li>上传相关资质文件</li><li>邀请团队成员协作</li></ol><p>点击确认开始创建新项目。</p>'
      break
    case 'edit':
      dialogContent.value = '<p>编辑材料功能允许您：</p><ul><li>修改已提交的申报材料</li><li>更新项目进度信息</li><li>调整团队成员分工</li><li>重新上传更新后的文件</li></ul><p>系统将保留所有历史版本供查阅。</p>'
      break
    case 'upload':
      dialogContent.value = '<p>文件上传功能支持：</p><ul><li>多种格式文件上传（PDF, Word, Excel等）</li><li>批量上传功能</li><li>自动文件分类与命名</li><li>版本控制与管理</li></ul><p>单个文件最大支持100MB。</p>'
      break
    case 'download':
      dialogContent.value = '<p>可下载的模板包括：</p><ul><li>项目申报书模板</li><li>预算编制表格</li><li>进度报告格式</li><li>结题材料模板</li></ul><p>所有模板均符合最新政策要求。</p>'
      break
    case 'preview':
      dialogContent.value = '<p>材料预览功能提供：</p><ul><li>完整材料样式预览</li><li>格式规范性检查</li><li>打印预览功能</li><li>导出为PDF选项</li></ul><p>确保申报材料符合官方要求。</p>'
      break
    case 'settings':
      dialogContent.value = '<p>系统设置包括：</p><ul><li>个人信息管理</li><li>通知偏好设置</li><li>团队权限配置</li><li>界面个性化设置</li></ul><p>可根据您的需求调整平台功能。</p>'
      break
  }
  
  dialogVisible.value = true
}

// 查看项目详情
const viewProject = (project) => {
  dialogTitle.value = `项目详情 - ${project.name}`
  dialogContent.value = `
    <div class="project-detail">
      <p><strong>项目名称：</strong>${project.name}</p>
      <p><strong>项目类型：</strong>${project.type}</p>
      <p><strong>当前进度：</strong>${project.progress}%</p>
      <p><strong>截止日期：</strong>${project.deadline}</p>
      <p><strong>项目状态：</strong>${project.status === 'success' ? '即将完成' : '进行中'}</p>
      <el-progress :percentage="${project.progress}" :status="${getProgressStatus(project.progress)}" style="margin: 15px 0;"></el-progress>
      <p>您可以在此查看项目详情、编辑材料或与团队成员协作。</p>
    </div>
  `
  dialogVisible.value = true
}

// 查看附件
const viewAttachment = (notice) => {
  dialogTitle.value = `查看附件 - ${notice.title}`
  dialogContent.value = `
    <div class="attachment-info">
      <p>通知标题：<strong>${notice.title}</strong></p>
      <p>发布时间：${notice.time}</p>
      <p>发布人：${notice.publisher}</p>
      <p>附件名称：${notice.attachmentUrl.split('/').pop()}</p>
      <div style="margin-top: 20px;">
        <el-button type="primary">下载附件</el-button>
        <el-button>在线预览</el-button>
      </div>
    </div>
  `
  dialogVisible.value = true
}

// 显示所有项目
const showAllProjects = () => {
  dialogTitle.value = '所有项目列表'
  dialogContent.value = `
    <div class="all-projects">
      <p>此处显示您参与的所有申报项目，包括：</p>
      <ul>
        <li>进行中的项目（${ongoingProjects.value.length}个）</li>
        <li>已完成的项目</li>
        <li>已归档的历史项目</li>
      </ul>
      <p>您可以通过筛选和排序功能快速找到需要的项目。</p>
    </div>
  `
  dialogVisible.value = true
}

// 显示所有通知
const showAllNotices = () => {
  dialogTitle.value = '所有通知公告'
  dialogContent.value = `
    <div class="all-notices">
      <p>系统所有通知公告将在此处显示，包括：</p>
      <ul>
        <li>政策更新通知</li>
        <li>申报截止提醒</li>
        <li>系统功能更新</li>
        <li>重要活动通知</li>
      </ul>
      <p>您可以根据时间、类型或关键词筛选通知。</p>
    </div>
  `
  dialogVisible.value = true
}

// 关闭弹窗
const handleClose = (done) => {
  done()
}

// 根据进度获取状态
const getProgressStatus = (progress) => {
  if (progress >= 90) return 'success'
  if (progress >= 70) return 'warning'
  return 'exception'
}

// 模拟数据加载
onMounted(() => {
  // 这里可以添加数据加载逻辑
  ElMessage({
    message: '页面加载完成',
    type: 'success'
  })
})
</script>

<style lang="scss" scoped>

@use './ApprovalProcess.scss';

</style>