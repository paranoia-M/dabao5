<script setup>
import { RouterView } from "vue-router";
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" />
  </RouterView>
</template>

<style scoped lang="scss">
// 全局样式可以在这里添加
:root {
  --primary-color: #409eff;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  --background-color: #f5f7fa;
  --content-background: #ffffff;
  --text-color: #303133;
  --text-color-secondary: #606266;
  --border-color: #e4e7ed;
  --border-radius: 4px;
  --box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease-in-out;
  --padding-base: 16px;
  --margin-base: 16px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-sm: 12px;
  --height-base: 32px;
  --height-lg: 40px;
  --height-sm: 24px;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
}
</style>
