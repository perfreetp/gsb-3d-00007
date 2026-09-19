<script setup lang="ts">
import { simState } from '../factory/simState'
import { DEVICE_NAMES, type DeviceKey } from '../factory/config'

const keys: DeviceKey[] = ['conveyorA', 'processor', 'robot', 'inspector', 'conveyorB']

const meta: Record<string, { text: string; cls: string }> = {
  idle: { text: '待机', cls: 'idle' },
  running: { text: '运行中', cls: 'running' },
  warning: { text: '异常分拣', cls: 'warning' }
}
</script>

<template>
  <div class="panel">
    <div class="title">设备运行状态</div>
    <div class="list">
      <div v-for="key in keys" :key="key" class="row">
        <span class="name">{{ DEVICE_NAMES[key] }}</span>
        <span class="status" :class="meta[simState.devices[key]].cls">
          <i class="lamp"></i>{{ meta[simState.devices[key]].text }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: rgba(10, 22, 36, 0.78);
  border: 1px solid rgba(80, 200, 255, 0.25);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

.title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #9fe7ff;
  margin-bottom: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13.5px;
}

.row:last-child {
  border-bottom: none;
}

.name {
  color: #b6c7da;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  padding: 3px 10px;
  border-radius: 20px;
}

.lamp {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.idle {
  color: #8a93a6;
}
.idle .lamp {
  background: #6b7585;
}

.running {
  color: #4ee89a;
  background: rgba(53, 224, 122, 0.1);
}
.running .lamp {
  background: #35e07a;
  box-shadow: 0 0 8px #35e07a;
  animation: blink 1.4s infinite;
}

.warning {
  color: #ff6b74;
  background: rgba(255, 77, 87, 0.12);
}
.warning .lamp {
  background: #ff4d57;
  box-shadow: 0 0 10px #ff4d57;
  animation: blink 0.5s infinite;
}

@keyframes blink {
  50% {
    opacity: 0.4;
  }
}
</style>
