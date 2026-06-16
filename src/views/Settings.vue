
<template>
  <div class="settings-container">
    <el-card class="settings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2 class="system-title">智慧广播管理系统</h2>
          <span class="sub-title">系统设置中心</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="settings-tabs" type="card">
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="basicForm" label-width="120px" class="settings-form">
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            
            <el-form-item label="广播频率" prop="frequency">
              <div class="frequency-container">
                <el-input-number v-model="basicForm.frequency" :min="80" :max="120" :step="0.1" />
                <span class="unit">MHz</span>
              </div>
            </el-form-item>
            
            <el-form-item label="默认音量" prop="volume">
              <el-slider v-model="basicForm.volume" :step="5" show-stops />
              <span class="volume-value">{{ basicForm.volume }}%</span>
            </el-form-item>
            
            <el-form-item label="自动播放" prop="autoPlay">
              <el-switch v-model="basicForm.autoPlay" active-text="开启" inactive-text="关闭" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">保存设置</el-button>
              <el-button @click="resetBasicForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="广播计划" name="schedule">
          <div class="schedule-header">
            <el-button type="primary" @click="addSchedule" class="add-btn">添加计划</el-button>
            <el-input
              v-model="scheduleSearch"
              placeholder="搜索广播计划"
              style="width: 200px; margin-left: 10px;"
              clearable
              class="search-input"
            >
              <template #prefix>
                <span class="search-icon">🔍</span>
              </template>
            </el-input>
          </div>
          
          <el-table
            :data="filteredSchedules"
            border
            style="width: 100%; margin-top: 20px;"
            :default-sort="{ prop: 'time', order: 'ascending' }"
            class="schedule-table"
          >
            <el-table-column prop="name" label="计划名称" sortable width="180" />
            <el-table-column prop="time" label="播放时间" sortable width="120" />
            <el-table-column prop="content" label="播放内容" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === '启用' ? 'success' : 'danger'" effect="light">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180">
              <template #default="scope">
                <el-button size="small" @click="editSchedule(scope.row)" class="edit-btn">编辑</el-button>
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteSchedule(scope.row)"
                  class="delete-btn"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <el-pagination
            class="pagination"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="schedules.length"
            layout="total, prev, pager, next"
            @current-change="handlePageChange"
          />
        </el-tab-pane>
        
        <el-tab-pane label="设备管理" name="devices">
          <el-table :data="devices" border style="width: 100%" class="device-table">
            <el-table-column prop="name" label="设备名称" width="180" />
            <el-table-column prop="ip" label="IP地址" width="150" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="scope.row.status === '在线' ? 'success' : 'danger'" effect="light">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="version" label="固件版本" width="120" />
            <el-table-column prop="lastActive" label="最后活跃" />
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="restartDevice(scope.row)" class="restart-btn">重启</el-button>
                <el-button size="small" @click="updateDevice(scope.row)" class="update-btn">升级</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 添加/编辑计划对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%" class="schedule-dialog">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="计划名称" prop="name">
          <el-input v-model="scheduleForm.name" placeholder="请输入计划名称" />
        </el-form-item>
        
        <el-form-item label="播放时间" prop="time">
          <el-time-picker
            v-model="scheduleForm.time"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
          />
        </el-form-item>
        
        <el-form-item label="播放内容" prop="content">
          <el-input
            v-model="scheduleForm.content"
            type="textarea"
            :rows="3"
            placeholder="请输入播放内容"
          />
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="scheduleForm.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSchedule">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const activeTab = ref('basic');

// 基本设置表单
const basicForm = ref({
  systemName: '智慧广播管理系统',
  frequency: 88.5,
  volume: 70,
  autoPlay: true
});

// 保存基本设置
const saveBasicSettings = () => {
  ElMessage.success({
    message: '基本设置保存成功',
    showClose: true,
    duration: 2000
  });
  // 模拟保存到服务器
  console.log('保存基本设置:', basicForm.value);
};

// 重置基本设置
const resetBasicForm = () => {
  basicForm.value = {
    systemName: '智慧广播管理系统',
    frequency: 88.5,
    volume: 70,
    autoPlay: true
  };
  ElMessage.info({
    message: '已重置为默认设置',
    showClose: true,
    duration: 2000
  });
};

// 广播计划相关
const scheduleSearch = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const schedules = ref([
  { id: 1, name: '早间新闻', time: '07:00', content: '播放早间新闻', status: '启用' },
  { id: 2, name: '午间音乐', time: '12:00', content: '播放午间音乐', status: '启用' },
  { id: 3, name: '晚间公告', time: '18:00', content: '播放晚间公告', status: '禁用' },
  { id: 4, name: '紧急通知', time: '08:30', content: '播放紧急通知', status: '启用' },
  { id: 5, name: '校园广播', time: '16:00', content: '播放校园广播', status: '启用' }
]);

// 过滤后的广播计划
const filteredSchedules = computed(() => {
  const search = scheduleSearch.value.toLowerCase();
  return schedules.value
    .filter(item => {
      return (
        item.name.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search)
      );
    })
    .slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
};

// 设备管理
const devices = ref([
  { id: 1, name: '广播主机1', ip: '192.168.1.100', status: '在线', version: 'v1.2.3', lastActive: '2023-05-15 14:30' },
  { id: 2, name: '广播主机2', ip: '192.168.1.101', status: '离线', version: 'v1.1.8', lastActive: '2023-05-14 09:15' },
  { id: 3, name: '广播终端1', ip: '192.168.1.102', status: '在线', version: 'v1.2.1', lastActive: '2023-05-15 15:22' },
  { id: 4, name: '广播终端2', ip: '192.168.1.103', status: '在线', version: 'v1.2.0', lastActive: '2023-05-15 13:45' }
]);

// 重启设备
const restartDevice = (device) => {
  ElMessageBox.confirm(`确定要重启设备 ${device.name} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟重启设备
    device.status = '在线';
    ElMessage.success({
      message: `设备 ${device.name} 重启成功`,
      showClose: true,
      duration: 2000
    });
  }).catch(() => {
    ElMessage.info({
      message: '已取消重启操作',
      showClose: true,
      duration: 2000
    });
  });
};

// 升级设备
const updateDevice = (device) => {
  ElMessageBox.confirm(`确定要升级设备 ${device.name} 到最新版本吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟升级设备
    device.version = 'v1.2.5';
    ElMessage.success({
      message: `设备 ${device.name} 升级成功`,
      showClose: true,
      duration: 2000
    });
  }).catch(() => {
    ElMessage.info({
      message: '已取消升级操作',
      showClose: true,
      duration: 2000
    });
  });
};

// 添加/编辑计划对话框
const dialogVisible = ref(false);
const dialogTitle = ref('添加广播计划');
const isEditMode = ref(false);
const currentScheduleId = ref(null);
const scheduleForm = ref({
  name: '',
  time: '',
  content: '',
  status: '启用'
});

// 添加计划
const addSchedule = () => {
  dialogTitle.value = '添加广播计划';
  isEditMode.value = false;
  scheduleForm.value = {
    name: '',
    time: '',
    content: '',
    status: '启用'
  };
  dialogVisible.value = true;
};

// 编辑计划
const editSchedule = (schedule) => {
  dialogTitle.value = '编辑广播计划';
  isEditMode.value = true;
  currentScheduleId.value = schedule.id;
  scheduleForm.value = {
    name: schedule.name,
    time: schedule.time,
    content: schedule.content,
    status: schedule.status
  };
  dialogVisible.value = true;
};

// 删除计划
const deleteSchedule = (schedule) => {
  ElMessageBox.confirm(`确定要删除计划 ${schedule.name} 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    schedules.value = schedules.value.filter(item => item.id !== schedule.id);
    ElMessage.success({
      message: `计划 ${schedule.name} 已删除`,
      showClose: true,
      duration: 2000
    });
  }).catch(() => {
    ElMessage.info({
      message: '已取消删除操作',
      showClose: true,
      duration: 2000
    });
  });
};

// 确认添加/编辑计划
const confirmSchedule = () => {
  if (!scheduleForm.value.name || !scheduleForm.value.time || !scheduleForm.value.content) {
    ElMessage.warning({
      message: '请填写完整的计划信息',
      showClose: true,
      duration: 2000
    });
    return;
  }
  
  if (isEditMode.value) {
    // 编辑模式
    const index = schedules.value.findIndex(item => item.id === currentScheduleId.value);
    if (index !== -1) {
      schedules.value[index] = {
        id: currentScheduleId.value,
        ...scheduleForm.value
      };
      ElMessage.success({
        message: '计划更新成功',
        showClose: true,
        duration: 2000
      });
    }
  } else {
    // 添加模式
    const newId = schedules.value.length > 0 ? Math.max(...schedules.value.map(item => item.id)) + 1 : 1;
    schedules.value.push({
      id: newId,
      ...scheduleForm.value
    });
    ElMessage.success({
      message: '计划添加成功',
      showClose: true,
      duration: 2000
    });
  }
  
  dialogVisible.value = false;
};

// 初始化数据
onMounted(() => {
  // 模拟从服务器获取数据
  console.log('初始化广播管理系统设置');
});
</script>

<style lang="scss" scoped>

@use './Settings.scss';

</style>
    