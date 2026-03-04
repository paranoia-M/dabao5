<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-text">楼宇设备自动化软件</span>
          <span class="logo-subtitle">Building Automation System</span>
        </div>
      </div>
      <div class="header-right">
        <div class="system-status">
          <span class="status-indicator active"></span>
          <span class="status-text">系统运行正常</span>
        </div>
        <el-button 
          type="primary" 
          class="logout-btn"
          @click="handleLogout"
        >
          安全退出
        </el-button>
      </div>
    </el-header>
    
    <div class="main-container">
      <!-- 侧边菜单栏 -->
      <el-aside class="aside" width="220px">
        <div class="menu-header">
          <div class="building-info">
            <div class="building-name">智能大厦管理中心</div>
            <div class="building-floor">当前楼层：1-15F</div>
          </div>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="menu"
          :router="true"
          background-color="#f8f9fa"
          text-color="#333"
          :active-text-color="menuActiveColor"
        >
          <el-menu-item index="/dashboard">
            <div class="menu-item-content">
              <span class="menu-icon dashboard"></span>
              <span class="menu-text">系统仪表盘</span>
            </div>
          </el-menu-item>
          <el-menu-item index="/device-monitor">
            <div class="menu-item-content">
              <span class="menu-icon monitor"></span>
              <span class="menu-text">设备监控中心</span>
            </div>
          </el-menu-item>
          <el-menu-item index="/energy-management">
            <div class="menu-item-content">
              <span class="menu-icon energy"></span>
              <span class="menu-text">能源管理系统</span>
            </div>
          </el-menu-item>
          <el-menu-item index="/environment-control">
            <div class="menu-item-content">
              <span class="menu-icon environment"></span>
              <span class="menu-text">环境智能控制</span>
            </div>
          </el-menu-item>
          <el-menu-item index="/security-system">
            <div class="menu-item-content">
              <span class="menu-icon security"></span>
              <span class="menu-text">安防监控系统</span>
            </div>
          </el-menu-item>
          <el-menu-item index="/alarm-center">
            <div class="menu-item-content">
              <span class="menu-icon alarm"></span>
              <span class="menu-text">智能报警中心</span>
              <span v-if="unreadAlarms > 0" class="alarm-badge">{{ unreadAlarms }}</span>
            </div>
          </el-menu-item>
        </el-menu>
        
        <div class="system-summary">
          <div class="summary-item">
            <span class="summary-label">在线设备</span>
            <span class="summary-value success">{{ systemStats.onlineDevices }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">今日能耗</span>
            <span class="summary-value">{{ systemStats.energyUsage }} kWh</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">环境温度</span>
            <span class="summary-value">{{ systemStats.temperature }}°C</span>
          </div>
        </div>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-main class="main-content">
        <RouterView />
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

// 系统统计数据
const systemStats = ref({
  onlineDevices: 0,
  energyUsage: 0,
  temperature: 0,
  humidity: 0
})

// 未读报警数量
const unreadAlarms = ref(0)

// 菜单激活颜色（背景色的对比色）
const menuActiveColor = computed(() => {
  // 背景色 #f8f9fa 的对比色
  return '#1890ff'
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

// 处理退出登录
const handleLogout = async () => {
  localStorage.clear()
  await router.push('/login')
}

// 模拟数据函数
const mockData = {
  getDashboardData: () => ({
    deviceCount: 156,
    energyUsage: 2450.5,
    alarmCount: 12,
    temperature: 24.5,
    humidity: 65
  }),
  getDeviceList: () => [
    { id: 1, name: '空调系统', status: '正常', location: '1号楼', type: 'HVAC' },
    { id: 2, name: '照明系统', status: '正常', location: '2号楼', type: 'Lighting' },
    { id: 3, name: '电梯系统', status: '维护中', location: '3号楼', type: 'Elevator' },
    { id: 4, name: '给排水系统', status: '正常', location: '1号楼', type: 'Plumbing' },
    { id: 5, name: '消防系统', status: '正常', location: '2号楼', type: 'Fire' }
  ]),
  getEnergyData: () => ({
    today: 2450.5,
    yesterday: 2380.2,
    weekAvg: 2400.8,
    monthTotal: 73515,
    energySaving: 12.5
  }),
  getAlarmList: () => [
    { 
      id: 1, 
      type: '温度异常', 
      level: 'warning', 
      time: '2024-01-15 10:30',
      location: '1号楼5层',
      device: '空调系统',
      description: '室内温度超过设定阈值'
    },
    { 
      id: 2, 
      type: '设备离线', 
      level: 'error', 
      time: '2024-01-15 09:15',
      location: '3号楼2层',
      device: '照明系统',
      description: '设备通信中断'
    },
    { 
      id: 3, 
      type: '能耗异常', 
      level: 'warning', 
      time: '2024-01-15 08:45',
      location: '2号楼',
      device: '电梯系统',
      description: '能耗突然增加'
    }
  ],
  getEnvironmentData: () => ({
    temperature: 24.5,
    humidity: 65,
    co2: 450,
    pm25: 35,
    lighting: 300
  }),
  getSecurityStatus: () => ({
    cameras: 48,
    onlineCameras: 46,
    accessPoints: 12,
    fireAlarms: 0,
    intrusionAlarms: 0
  })
}

// 系统日志函数
const logSystemEvent = (message, level = 'info') => {
  const timestamp = new Date().toLocaleString('zh-CN')
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`
  
  // 在实际应用中，这里应该发送到服务器
  // 现在只记录到控制台
  switch(level) {
    case 'error':
      console.error(`🔴 楼宇系统日志: ${logEntry}`)
      break
    case 'warning':
      console.warn(`🟡 楼宇系统日志: ${logEntry}`)
      break
    default:
      console.log(`🔵 楼宇系统日志: ${logEntry}`)
  }
}

// 模拟实时数据更新
const simulateRealTimeData = () => {
  // 更新系统统计
  const dashboardData = mockData.getDashboardData()
  systemStats.value = {
    onlineDevices: dashboardData.deviceCount - 2, // 模拟2个设备离线
    energyUsage: dashboardData.energyUsage,
    temperature: dashboardData.temperature,
    humidity: dashboardData.humidity
  }
  
  // 更新未读报警
  unreadAlarms.value = dashboardData.alarmCount
  
  // 记录系统状态
  logSystemEvent('系统数据更新完成', 'info')
}

// 暴露模拟数据给子组件使用
provide('mockData', mockData)
provide('logSystemEvent', logSystemEvent)

// 初始化
onMounted(() => {
  // 初始化系统数据
  simulateRealTimeData()
  
  // 记录系统启动
  logSystemEvent('楼宇设备自动化系统启动成功', 'info')
  
  // 模拟实时数据更新（每30秒更新一次）
  setInterval(simulateRealTimeData, 30000)
})
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  color: white;
  padding: 0 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .logo {
      display: flex;
      flex-direction: column;
      
      .logo-text {
        font-size: 20px;
        font-weight: bold;
        letter-spacing: 1px;
      }
      
      .logo-subtitle {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 2px;
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .system-status {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #ccc;
        
        &.active {
          background-color: #52c41a;
          box-shadow: 0 0 8px rgba(82, 196, 26, 0.6);
        }
      }
      
      .status-text {
        font-size: 14px;
      }
    }
    
    .logout-btn {
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.aside {
  background-color: #f8f9fa;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  
  .menu-header {
    padding: 20px 16px;
    border-bottom: 1px solid #e8e8e8;
    
    .building-info {
      .building-name {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        margin-bottom: 4px;
      }
      
      .building-floor {
        font-size: 12px;
        color: #666;
      }
    }
  }
  
  .menu {
    flex: 1;
    border-right: none;
    padding: 16px 0;
    
    .el-menu-item {
      height: 48px;
      line-height: 48px;
      margin: 4px 8px;
      border-radius: 6px;
      
      &:hover {
        background-color: #e6f7ff !important;
      }
      
      &.is-active {
        background-color: #e6f7ff !important;
        border-right: 3px solid #1890ff;
        
        .menu-text {
          font-weight: bold;
        }
      }
      
      .menu-item-content {
        display: flex;
        align-items: center;
        position: relative;
        
        .menu-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          position: relative;
          
          &::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            background-color: #666;
            mask-size: contain;
            mask-repeat: no-repeat;
            mask-position: center;
          }
          
          &.dashboard::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'/%3E%3C/svg%3E");
          }
          
          &.monitor::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z'/%3E%3C/svg%3E");
          }
          
          &.energy::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'/%3E%3C/svg%3E");
          }
          
          &.environment::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3z'/%3E%3C/svg%3E");
          }
          
          &.security::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z'/%3E%3C/svg%3E");
          }
          
          &.alarm::before {
            mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z'/%3E%3C/svg%3E");
          }
        }
        
        .menu-text {
          flex: 1;
          font-size: 14px;
        }
        
        .alarm-badge {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background-color: #f5222d;
          color: white;
          font-size: 12px;
          min-width: 18px;
          height: 18px;
          line-height: 18px;
          text-align: center;
          border-radius: 9px;
          padding: 0 4px;
        }
      }
    }
  }
  
  .system-summary {
    padding: 16px;
    border-top: 1px solid #e8e8e8;
    background-color: white;
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .summary-label {
        font-size: 12px;
        color: #666;
      }
      
      .summary-value {
        font-size: 14px;
        font-weight: bold;
        color: #333;
        
        &.success {
          color: #52c41a;
        }
      }
    }
  }
}

.main-content {
  padding: 20px;
  background-color: #f5f7fa;
  overflow: auto;
}
</style>