
        <template>
          <el-container class="layout-container">
            <el-header class="header">
              <div class="header-left">
                <h1 class="title">网络通信网关调节配置管理系统</h1>
                <div class="subtitle">全面监控 · 智能分析 · 安全防护</div>
              </div>
              <div class="header-right">
                <el-dropdown trigger="click" @command="handleCommand">
                  <span class="el-dropdown-link">
                    <el-avatar :size="40" style="background-color: #409EFF">
                      <span style="font-size: 18px">管</span>
                    </el-avatar>
                    <span class="username">管理员</span>
                    <span class="dropdown-arrow">▼</span>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="logout">退出登录</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-header>
            
            <el-container>
              <el-aside width="220px" class="aside">
                <el-menu
                  :default-active="activeMenu"
                  class="menu"
                  background-color="#f8fafc"
                  text-color="#333"
                  active-text-color="#409EFF"
                  :active-background-color="activeBgColor"
                  router
                >
                  <el-menu-item index="/">
                    <span class="menu-icon">🏠</span>
                    <span>首页</span>
                  </el-menu-item>
                  <el-menu-item index="/behavior-management">
                    <span class="menu-icon">🔍</span>
                    <span>行为管理</span>
                  </el-menu-item>
                  <el-menu-item index="/security-audit">
                    <span class="menu-icon">🛡️</span>
                    <span>安全审计</span>
                  </el-menu-item>
                  <el-menu-item index="/report-center">
                    <span class="menu-icon">📊</span>
                    <span>报表中心</span>
                  </el-menu-item>
                  <el-menu-item index="/user-management">
                    <span class="menu-icon">👥</span>
                    <span>用户管理</span>
                  </el-menu-item>
                  <el-menu-item index="/system-settings">
                    <span class="menu-icon">⚙️</span>
                    <span>系统设置</span>
                  </el-menu-item>
                </el-menu>
              </el-aside>
              
              <el-main class="main">
                <router-view />
              </el-main>
            </el-container>
          </el-container>
        </template>
        
        <script setup>
        import { computed, ref } from 'vue'
        import { useRoute, useRouter } from 'vue-router'
        
        const route = useRoute()
        const router = useRouter()
        
        const activeBgColor = ref('#e6f7ff')
        
        const activeMenu = computed(() => {
          return route.path
        })
        
        const handleCommand = async (command) => {
          if (command === 'logout') {
            await handleLogout()
          }
        }
        
        const handleLogout = async () => {
          localStorage.clear()
          await router.push('/login')
        }
        </script>
        <style lang="scss" scoped>

        @use './Layout.scss';
        
</style>
    