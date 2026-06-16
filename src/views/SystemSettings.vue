<template>
  <div class="system-settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span class="system-title">智慧交通信息发布管理系统</span>
          <span class="module-title">系统设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" type="card" class="settings-tabs">
        <el-tab-pane label="基本设置" name="basic">
          <el-form :model="basicForm" label-width="140px" label-position="left" class="settings-form">
            <el-form-item label="系统名称" class="form-item">
              <el-input 
                v-model="basicForm.systemName" 
                placeholder="请输入系统名称" 
                clearable
                class="input-with-tip"
              />
              <div class="form-tip">用于显示在系统标题栏和登录页面</div>
            </el-form-item>
            <el-form-item label="系统LOGO" class="form-item">
              <div class="upload-container">
                <el-upload
                  action="#"
                  list-type="picture-card"
                  :auto-upload="false"
                  :on-change="handleLogoChange"
                  :file-list="logoFileList"
                >
                  <div class="upload-placeholder">
                    <div class="upload-icon">+</div>
                    <div class="upload-text">上传LOGO</div>
                  </div>
                </el-upload>
                <div class="form-tip">建议尺寸：200×60像素，支持PNG/JPG格式</div>
              </div>
            </el-form-item>
            <el-form-item label="系统主题色" class="form-item">
              <div class="color-picker-container">
                <el-color-picker v-model="basicForm.themeColor" show-alpha />
                <span class="color-value">{{ basicForm.themeColor }}</span>
              </div>
              <div class="form-tip">将应用于系统整体配色方案</div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings" class="save-btn">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationForm" label-width="140px" label-position="left" class="settings-form">
            <el-form-item label="消息通知" class="form-item">
              <el-switch 
                v-model="notificationForm.enableNotification" 
                active-text="启用" 
                inactive-text="禁用"
              />
              <div class="form-tip">开启后系统将自动发送重要通知</div>
            </el-form-item>
            <template v-if="notificationForm.enableNotification">
              <el-form-item label="通知方式" class="form-item">
                <el-checkbox-group v-model="notificationForm.notificationMethods" class="checkbox-group">
                  <el-checkbox label="email">邮件通知</el-checkbox>
                  <el-checkbox label="sms">短信通知</el-checkbox>
                  <el-checkbox label="app">APP推送</el-checkbox>
                </el-checkbox-group>
                <div class="form-tip">至少选择一种通知方式</div>
              </el-form-item>
              <el-form-item label="每日通知时间" class="form-item">
                <el-time-picker
                  v-model="notificationForm.notificationTime"
                  placeholder="选择时间"
                  format="HH:mm"
                  value-format="HH:mm"
                  class="time-picker"
                />
                <div class="form-tip">系统将在此时间发送每日汇总报告</div>
              </el-form-item>
            </template>
            <el-form-item>
              <el-button type="primary" @click="saveNotificationSettings" class="save-btn">
                保存设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="数据管理" name="data">
          <div class="data-management">
            <div class="data-actions">
              <el-button type="primary" @click="handleExportData" class="action-btn">
                导出数据
              </el-button>
              <el-button type="warning" @click="importDialogVisible = true" class="action-btn">
                导入数据
              </el-button>
              <el-button type="danger" @click="clearDataDialogVisible = true" class="action-btn">
                清空数据
              </el-button>
            </div>
            
            <el-table 
              :data="dataList" 
              border 
              style="width: 100%; margin-top: 20px;"
              class="data-table"
              :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
            >
              <el-table-column prop="name" label="数据类型" width="180" align="center" />
              <el-table-column prop="count" label="记录数" width="120" align="center" />
              <el-table-column prop="lastUpdate" label="最后更新时间" align="center" />
              <el-table-column label="操作" width="120" align="center">
                <template #default="scope">
                  <el-button 
                    size="small" 
                    type="text" 
                    @click="showDataPreview(scope.row)"
                    class="preview-btn"
                  >
                    预览
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 导入数据对话框 -->
    <el-dialog 
      v-model="importDialogVisible" 
      title="导入交通数据" 
      width="500px"
      class="import-dialog"
    >
      <div class="dialog-content">
        <div class="import-steps">
          <el-steps :active="importStep" simple>
            <el-step title="选择文件" />
            <el-step title="验证数据" />
            <el-step title="完成导入" />
          </el-steps>
        </div>
        
        <div v-if="importStep === 1" class="step-content">
          <el-upload
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            class="data-upload"
          >
            <div class="upload-content">
              <div class="upload-icon">📁</div>
              <div class="el-upload__text">
                拖拽交通数据文件到此处，或<em>点击上传</em>
              </div>
              <div class="el-upload__tip">
                支持JSON格式的交通事件、路况信息等数据文件
              </div>
            </div>
          </el-upload>
        </div>
        
        <div v-if="importStep === 2" class="step-content">
          <div class="validate-result">
            <el-result icon="success" title="数据验证通过">
              <template #extra>
                <div class="validate-detail">
                  <p>共发现 {{ validateResult.total }} 条记录</p>
                  <p>交通事件: {{ validateResult.trafficEvents }} 条</p>
                  <p>路况信息: {{ validateResult.roadConditions }} 条</p>
                  <p>设备状态: {{ validateResult.deviceStatus }} 条</p>
                </div>
              </template>
            </el-result>
          </div>
        </div>
        
        <div v-if="importStep === 3" class="step-content">
          <el-result icon="success" title="数据导入成功">
            <template #extra>
              <div class="import-summary">
                <p>成功导入 {{ importSummary.success }} 条记录</p>
                <p>失败 {{ importSummary.failed }} 条记录</p>
                <p v-if="importSummary.duplicate > 0">
                  跳过重复记录 {{ importSummary.duplicate }} 条
                </p>
              </div>
            </template>
          </el-result>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button 
            @click="importDialogVisible = false" 
            v-if="importStep === 1"
            class="dialog-btn"
          >
            取消
          </el-button>
          <el-button 
            @click="importStep = 1" 
            v-if="importStep === 2 || importStep === 3"
            class="dialog-btn"
          >
            上一步
          </el-button>
          <el-button 
            type="primary" 
            @click="nextImportStep" 
            :disabled="importStep === 1 && fileList.length === 0"
            class="dialog-btn primary-btn"
          >
            {{ importStep === 3 ? '完成' : '下一步' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 清空数据对话框 -->
    <el-dialog 
      v-model="clearDataDialogVisible" 
      title="清空交通数据" 
      width="450px"
      class="clear-dialog"
    >
      <div class="clear-content">
        <el-alert
          title="警告"
          type="error"
          description="此操作将永久删除所有交通数据，包括交通事件、路况信息和设备状态记录等。"
          show-icon
          class="clear-alert"
        />
        <div class="clear-confirm">
          <el-checkbox v-model="clearConfirm" class="confirm-checkbox">
            我确认已备份重要数据，了解此操作不可恢复
          </el-checkbox>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="clearDataDialogVisible = false" class="dialog-btn">
            取消
          </el-button>
          <el-button 
            type="danger" 
            @click="handleClearData" 
            :disabled="!clearConfirm"
            class="dialog-btn danger-btn"
          >
            确认清空
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 数据预览对话框 -->
    <el-dialog 
      v-model="previewDialogVisible" 
      :title="`${previewData.name}数据预览`" 
      width="700px"
      class="preview-dialog"
    >
      <div class="preview-content">
        <div class="preview-meta">
          <div class="meta-item">
            <span class="meta-label">记录数：</span>
            <span class="meta-value">{{ previewData.count }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最后更新：</span>
            <span class="meta-value">{{ previewData.lastUpdate }}</span>
          </div>
        </div>
        
        <div class="preview-sample">
          <h4>示例数据：</h4>
          <el-table 
            :data="sampleData" 
            border 
            style="width: 100%" 
            height="250"
            class="sample-table"
          >
            <el-table-column 
              v-for="col in sampleColumns" 
              :key="col.prop" 
              :prop="col.prop" 
              :label="col.label" 
              width="150"
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewDialogVisible = false" class="dialog-btn">
            关闭
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const activeTab = ref('basic');

// 基本设置表单
const basicForm = reactive({
  systemName: '智慧交通信息发布管理系统',
  themeColor: '#409EFF'
});

const logoFileList = ref([]);

// 通知设置表单
const notificationForm = reactive({
  enableNotification: true,
  notificationMethods: ['email', 'app'],
  notificationTime: '09:00'
});

// 数据管理
const dataList = ref([
  { name: '交通事件', count: 128, lastUpdate: '2023-05-15 14:30' },
  { name: '路况信息', count: 256, lastUpdate: '2023-05-16 09:15' },
  { name: '设备状态', count: 42, lastUpdate: '2023-05-14 17:45' },
  { name: '用户反馈', count: 37, lastUpdate: '2023-05-16 11:20' }
]);

// 导入数据相关
const importDialogVisible = ref(false);
const importStep = ref(1);
const fileList = ref([]);
const validateResult = reactive({
  total: 0,
  trafficEvents: 0,
  roadConditions: 0,
  deviceStatus: 0
});
const importSummary = reactive({
  success: 0,
  failed: 0,
  duplicate: 0
});

// 清空数据相关
const clearDataDialogVisible = ref(false);
const clearConfirm = ref(false);

// 数据预览相关
const previewDialogVisible = ref(false);
const previewData = reactive({
  name: '',
  count: 0,
  lastUpdate: ''
});
const sampleData = ref([]);
const sampleColumns = ref([]);

const handleLogoChange = (file) => {
  logoFileList.value = [file];
  ElMessage.success('LOGO文件已选择');
};

const handleFileChange = (file) => {
  fileList.value = [file];
};

const saveBasicSettings = () => {
  ElMessage.success({
    message: '系统基本设置已保存',
    duration: 2000
  });
};

const saveNotificationSettings = () => {
  ElMessage.success({
    message: '通知设置已更新',
    duration: 2000
  });
};

const handleExportData = () => {
  ElMessageBox.confirm(
    '请选择导出数据格式',
    '导出交通数据',
    {
      distinguishCancelAndClose: true,
      confirmButtonText: '导出JSON',
      cancelButtonText: '导出CSV',
      closeOnClickModal: false
    }
  ).then(() => {
    ElMessage.success('交通数据已导出为JSON格式');
  }).catch((action) => {
    if (action === 'cancel') {
      ElMessage.success('交通数据已导出为CSV格式');
    }
  });
};

const nextImportStep = () => {
  if (importStep.value === 1) {
    // 模拟数据验证
    validateResult.total = 426;
    validateResult.trafficEvents = 128;
    validateResult.roadConditions = 256;
    validateResult.deviceStatus = 42;
    importStep.value = 2;
  } else if (importStep.value === 2) {
    // 模拟数据导入
    importSummary.success = 420;
    importSummary.failed = 6;
    importSummary.duplicate = 12;
    importStep.value = 3;
  } else {
    importDialogVisible.value = false;
    importStep.value = 1;
    fileList.value = [];
    ElMessage.success('交通数据导入完成');
  }
};

const handleClearData = () => {
  clearDataDialogVisible.value = false;
  ElMessageBox.confirm(
    '此操作将永久删除所有交通数据，是否继续？',
    '最终确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'error',
      center: true,
      customClass: 'final-confirm-dialog'
    }
  ).then(() => {
    // 模拟数据清空
    dataList.value.forEach(item => {
      item.count = 0;
      item.lastUpdate = new Date().toLocaleString();
    });
    clearConfirm.value = false;
    ElMessage.success('所有交通数据已清空');
  }).catch(() => {
    ElMessage.info('已取消清空操作');
  });
};

const showDataPreview = (row) => {
  previewData.name = row.name;
  previewData.count = row.count;
  previewData.lastUpdate = row.lastUpdate;
  
  // 模拟不同类型的数据预览
  if (row.name === '交通事件') {
    sampleColumns.value = [
      { prop: 'time', label: '时间' },
      { prop: 'location', label: '位置' },
      { prop: 'type', label: '事件类型' },
      { prop: 'level', label: '严重程度' }
    ];
    sampleData.value = [
      { time: '08:30', location: '中山路与解放路交叉口', type: '交通事故', level: '严重' },
      { time: '09:15', location: '环城东路', type: '道路施工', level: '一般' },
      { time: '10:45', location: '人民广场地下通道', type: '积水', level: '轻微' }
    ];
  } else if (row.name === '路况信息') {
    sampleColumns.value = [
      { prop: 'road', label: '道路名称' },
      { prop: 'speed', label: '平均车速' },
      { prop: 'status', label: '通行状态' },
      { prop: 'updateTime', label: '更新时间' }
    ];
    sampleData.value = [
      { road: '中山路', speed: '25km/h', status: '缓行', updateTime: '10:00' },
      { road: '解放路', speed: '15km/h', status: '拥堵', updateTime: '10:05' },
      { road: '环城高速', speed: '80km/h', status: '畅通', updateTime: '10:10' }
    ];
  } else if (row.name === '设备状态') {
    sampleColumns.value = [
      { prop: 'deviceId', label: '设备ID' },
      { prop: 'type', label: '设备类型' },
      { prop: 'status', label: '状态' },
      { prop: 'lastCheck', label: '最后检测' }
    ];
    sampleData.value = [
      { deviceId: 'CAM-001', type: '摄像头', status: '在线', lastCheck: '30分钟前' },
      { deviceId: 'SEN-045', type: '传感器', status: '离线', lastCheck: '2小时前' },
      { deviceId: 'DIS-012', type: '显示屏', status: '维护中', lastCheck: '1天前' }
    ];
  } else {
    sampleColumns.value = [
      { prop: 'id', label: '反馈ID' },
      { prop: 'user', label: '用户' },
      { prop: 'content', label: '内容' },
      { prop: 'time', label: '时间' }
    ];
    sampleData.value = [
      { id: 'FB-001', user: '张**', content: '信号灯故障', time: '昨天 14:30' },
      { id: 'FB-002', user: '李**', content: '道路标线不清', time: '今天 09:15' },
      { id: 'FB-003', user: '王**', content: '建议增加停车位', time: '今天 11:20' }
    ];
  }
  
  previewDialogVisible.value = true;
};
</script>

<style lang="scss" scoped>
@use './SystemSettings.scss';
</style>