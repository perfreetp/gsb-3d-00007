<script setup lang="ts">
import { simState, totalCount, yieldRate, formatClock } from '../factory/simState'
</script>

<template>
  <div class="panel">
    <div class="title">
      <span class="dot"></span>
      生产数据看板
    </div>
    <div class="metrics">
      <div class="metric primary">
        <div class="value">{{ totalCount }}</div>
        <div class="label">总产量（件）</div>
      </div>
      <div class="metric good">
        <div class="value">{{ simState.good }}</div>
        <div class="label">合格品</div>
      </div>
      <div class="metric bad">
        <div class="value">{{ simState.bad }}</div>
        <div class="label">不良品</div>
      </div>
      <div class="metric" :class="yieldRate >= 90 ? 'good' : yieldRate >= 75 ? 'warn' : 'bad'">
        <div class="value">{{ yieldRate }}%</div>
        <div class="label">良率</div>
      </div>
    </div>
    <div class="clock">
      <span>运行时长</span>
      <strong>{{ formatClock(simState.elapsed) }}</strong>
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #9fe7ff;
  margin-bottom: 14px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2fe7ff;
  box-shadow: 0 0 10px #2fe7ff;
  animation: pulse 1.6s infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
  }
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.metric {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 10px;
  text-align: center;
}

.metric.primary {
  border-color: rgba(47, 231, 255, 0.5);
  background: rgba(47, 231, 255, 0.08);
}

.metric.good {
  border-color: rgba(53, 224, 122, 0.4);
}

.metric.warn {
  border-color: rgba(255, 179, 64, 0.5);
}

.metric.bad {
  border-color: rgba(255, 77, 87, 0.45);
}

.value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.primary .value {
  color: #7df9ff;
}

.good .value {
  color: #4ee89a;
}

.warn .value {
  color: #ffb340;
}

.bad .value {
  color: #ff6b74;
}

.label {
  margin-top: 4px;
  font-size: 12px;
  color: #93a8bf;
}

.clock {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #93a8bf;
  padding: 0 4px;
}

.clock strong {
  color: #d7e6f5;
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}
</style>
