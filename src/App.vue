<script setup lang="ts">
import { ref } from 'vue'
import FactoryViewport from './components/FactoryViewport.vue'
import Dashboard from './components/Dashboard.vue'
import DeviceStatus from './components/DeviceStatus.vue'
import ControlPanel from './components/ControlPanel.vue'
import EventLog from './components/EventLog.vue'

const viewport = ref<InstanceType<typeof FactoryViewport>>()
</script>

<template>
  <div class="app">
    <FactoryViewport ref="viewport" />

    <header class="topbar">
      <div class="brand">
        <span class="logo">⬢</span>
        <div>
          <h1>3D 智能工厂流水线仿真系统</h1>
          <p>上料 · 加工 · 机械臂搬运 · 视觉质检 · 不良品分拣</p>
        </div>
      </div>
    </header>

    <aside class="left-panel">
      <Dashboard />
      <DeviceStatus />
    </aside>

    <aside class="right-panel">
      <ControlPanel @spawn="viewport?.spawn()" @reset="viewport?.reset()" />
      <EventLog />
    </aside>

    <footer class="hint">鼠标左键旋转 · 右键平移 · 滚轮缩放</footer>
  </div>
</template>

<style scoped>
.app {
  position: relative;
  width: 100%;
  height: 100%;
}

.topbar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(10, 22, 36, 0.82);
  border: 1px solid rgba(80, 200, 255, 0.28);
  border-radius: 14px;
  padding: 10px 26px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.logo {
  font-size: 30px;
  color: #2fe7ff;
  text-shadow: 0 0 14px rgba(47, 231, 255, 0.7);
}

h1 {
  font-size: 18px;
  letter-spacing: 2px;
  color: #dff6ff;
}

p {
  font-size: 12px;
  color: #7f93ab;
  margin-top: 2px;
  letter-spacing: 1px;
}

.left-panel,
.right-panel {
  position: absolute;
  top: 92px;
  bottom: 20px;
  width: 272px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow-y: auto;
  z-index: 5;
}

.left-panel {
  left: 18px;
}

.right-panel {
  right: 18px;
}

.hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #63748a;
  background: rgba(10, 22, 36, 0.6);
  padding: 5px 16px;
  border-radius: 20px;
  pointer-events: none;
}
</style>
