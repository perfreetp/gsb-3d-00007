<script setup lang="ts">
import type { Snapshot } from '../sim/types'

defineProps<{ snap: Snapshot | null }>()

const stateText: Record<string, string> = {
  idle: '待机',
  running: '运行',
  busy: '作业中',
  fault: '故障',
}

const stateClass: Record<string, string> = {
  idle: 'idle',
  running: 'running',
  busy: 'busy',
  fault: 'fault',
}
</script>

<template>
  <div class="dashboard">
    <div class="panel stats">
      <div class="stat">
        <div class="stat-label">总产量</div>
        <div class="stat-value">{{ snap?.total ?? 0 }}</div>
        <div class="stat-unit">件</div>
      </div>
      <div class="stat good">
        <div class="stat-label">良品 / 不良</div>
        <div class="stat-value">
          <span class="c-good">{{ snap?.good ?? 0 }}</span>
          <span class="sep">/</span>
          <span class="c-bad">{{ snap?.bad ?? 0 }}</span>
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">良率</div>
        <div class="stat-value" :class="(snap?.yieldRate ?? 100) >= 80 ? 'c-good' : 'c-bad'">
          {{ (snap?.yieldRate ?? 100).toFixed(1) }}%
        </div>
      </div>
      <div class="stat">
        <div class="stat-label">仿真时间</div>
        <div class="stat-value time">{{ snap?.time ?? '00:00' }}</div>
      </div>
    </div>

    <div class="panel devices">
      <div class="panel-title">设备运行状态</div>
      <div class="device" v-for="d in snap?.devices ?? []" :key="d.name">
        <span class="dot" :class="stateClass[d.state]"></span>
        <span class="device-name">{{ d.name }}</span>
        <span class="device-state" :class="stateClass[d.state]">{{ stateText[d.state] }}</span>
        <span class="device-detail">{{ d.detail }}</span>
      </div>
    </div>

    <div class="panel events">
      <div class="panel-title">实时事件</div>
      <div class="event" v-for="ev in snap?.events ?? []" :key="ev.id" :class="ev.kind">
        <span class="event-time">{{ ev.time }}</span>
        <span class="event-text">{{ ev.text }}</span>
      </div>
      <div v-if="!(snap?.events ?? []).length" class="empty">暂无事件</div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.panel {
  pointer-events: auto;
  padding: 14px 16px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  color: #7fd0ff;
  letter-spacing: 1px;
  margin-bottom: 10px;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 8px;
}
.stat-label {
  font-size: 12px;
  color: #8fa8c4;
}
.stat-value {
  font-size: 26px;
  font-weight: 800;
  line-height: 1.2;
  color: #eaf4ff;
}
.stat-value.time {
  font-size: 20px;
}
.stat-unit {
  font-size: 11px;
  color: #6b82a0;
}
.sep {
  margin: 0 4px;
  color: #5f7591;
}
.c-good {
  color: var(--good);
}
.c-bad {
  color: var(--bad);
}

.devices {
  max-height: 270px;
  overflow: auto;
}
.device {
  display: grid;
  grid-template-columns: 12px 78px 52px 1fr;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(120, 170, 220, 0.08);
}
.device-name {
  color: #cfe2f7;
}
.device-detail {
  color: #7e97b4;
  font-size: 11px;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.device-state {
  font-size: 11px;
  text-align: center;
  border-radius: 4px;
  padding: 1px 0;
}
.device-state.idle {
  color: #8fa8c4;
  background: rgba(143, 168, 196, 0.12);
}
.device-state.running {
  color: var(--good);
  background: rgba(34, 224, 106, 0.12);
}
.device-state.busy {
  color: var(--warn);
  background: rgba(255, 176, 32, 0.14);
}
.device-state.fault {
  color: var(--bad);
  background: rgba(255, 77, 94, 0.14);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.dot.idle {
  background: #6b82a0;
}
.dot.running {
  background: var(--good);
  box-shadow: 0 0 8px var(--good);
}
.dot.busy {
  background: var(--warn);
  box-shadow: 0 0 8px var(--warn);
  animation: blink 1s infinite;
}
.dot.fault {
  background: var(--bad);
  box-shadow: 0 0 8px var(--bad);
}
@keyframes blink {
  50% {
    opacity: 0.35;
  }
}

.events {
  max-height: 220px;
  overflow: auto;
}
.event {
  display: flex;
  gap: 8px;
  font-size: 12px;
  padding: 4px 0;
  border-bottom: 1px solid rgba(120, 170, 220, 0.06);
}
.event-time {
  color: #5f7591;
  font-variant-numeric: tabular-nums;
}
.event.good .event-text {
  color: #7befa4;
}
.event.bad .event-text {
  color: #ff92a0;
}
.event.warn .event-text {
  color: #ffcf7a;
}
.event.info .event-text {
  color: #b7cde6;
}
.empty {
  font-size: 12px;
  color: #5f7591;
}
</style>
