<script setup lang="ts">
import { simState } from '../factory/simState'

const emit = defineEmits<{
  spawn: []
  reset: []
}>()
</script>

<template>
  <div class="panel">
    <div class="title">运行控制</div>
    <div class="buttons">
      <button class="btn primary" @click="simState.running = !simState.running">
        {{ simState.running ? '⏸ 暂停' : '▶ 继续' }}
      </button>
      <button class="btn" @click="emit('spawn')">➕ 手动上料</button>
      <button class="btn danger" @click="emit('reset')">⟳ 重置产线</button>
    </div>
    <div class="slider">
      <div class="slider-head">
        <span>仿真速度</span>
        <strong>{{ simState.simSpeed.toFixed(1) }}x</strong>
      </div>
      <input
        v-model.number="simState.simSpeed"
        type="range"
        min="0.3"
        max="3"
        step="0.1"
      />
    </div>
    <div class="slider">
      <div class="slider-head">
        <span>不良品概率</span>
        <strong>{{ simState.defectRate }}%</strong>
      </div>
      <input
        v-model.number="simState.defectRate"
        type="range"
        min="0"
        max="60"
        step="1"
      />
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

.buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.buttons .primary {
  grid-column: span 2;
}

.btn {
  padding: 9px 10px;
  border-radius: 8px;
  border: 1px solid rgba(120, 200, 255, 0.3);
  background: rgba(47, 231, 255, 0.08);
  color: #cdefff;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.btn:hover {
  background: rgba(47, 231, 255, 0.18);
  border-color: rgba(120, 200, 255, 0.6);
}

.btn.primary {
  background: linear-gradient(135deg, #1a8fb4, #2fe7ff);
  border-color: transparent;
  color: #061520;
  font-weight: 700;
}

.btn.primary:hover {
  filter: brightness(1.1);
}

.btn.danger {
  background: rgba(255, 77, 87, 0.1);
  border-color: rgba(255, 77, 87, 0.35);
  color: #ff8a92;
}

.btn.danger:hover {
  background: rgba(255, 77, 87, 0.2);
}

.slider {
  margin-top: 12px;
}

.slider-head {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #93a8bf;
  margin-bottom: 6px;
}

.slider-head strong {
  color: #7df9ff;
}

input[type='range'] {
  width: 100%;
  accent-color: #2fe7ff;
  cursor: pointer;
}
</style>
