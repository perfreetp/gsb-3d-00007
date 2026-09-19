<script setup lang="ts">
import { ref } from 'vue'
import FactoryViewer from './components/FactoryViewer.vue'
import Dashboard from './components/Dashboard.vue'
import ControlBar from './components/ControlBar.vue'
import type { Snapshot } from './sim/types'

const snap = ref<Snapshot | null>(null)
const viewer = ref<InstanceType<typeof FactoryViewer> | null>(null)

const onSnapshot = (s: Snapshot) => {
  snap.value = s
}
</script>

<template>
  <div class="app">
    <FactoryViewer ref="viewer" @snapshot="onSnapshot" />

    <header class="title panel">
      <div class="title-main">3D 智能工厂流水线仿真系统</div>
      <div class="title-sub">
        加工 → 搬运 → 质检 → 分拣
        <span class="badge" :class="snap?.running ? 'on' : 'off'">
          {{ snap?.running ? '运行中' : '已暂停' }}
        </span>
      </div>
    </header>

    <Dashboard :snap="snap" />

    <ControlBar
      :snap="snap"
      @toggle="viewer?.toggle()"
      @speed="(v) => viewer?.setSpeed(v)"
      @defect="(v) => viewer?.setDefectRate(v)"
      @reset="viewer?.reset()"
    />
  </div>
</template>

<style scoped>
.app {
  position: relative;
  width: 100%;
  height: 100%;
}

.title {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 12px 18px;
}
.title-main {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #7fd0ff, #38bdf8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.title-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #8fa8c4;
  display: flex;
  align-items: center;
  gap: 10px;
}
.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge.on {
  color: var(--good);
  background: rgba(34, 224, 106, 0.14);
}
.badge.off {
  color: var(--warn);
  background: rgba(255, 176, 32, 0.14);
}
</style>
