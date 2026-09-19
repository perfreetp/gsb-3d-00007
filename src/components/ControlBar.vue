<script setup lang="ts">
import type { Snapshot } from '../sim/types'

const props = defineProps<{ snap: Snapshot | null }>()
const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'speed', v: number): void
  (e: 'defect', v: number): void
  (e: 'reset'): void
}>()

const onSpeed = (v: number) => emit('speed', v)
const onDefect = (ev: Event) => emit('defect', Number((ev.target as HTMLInputElement).value) / 100)
</script>

<template>
  <div class="controlbar panel">
    <button class="btn primary" @click="emit('toggle')">
      {{ props.snap?.running ? '⏸ 暂停' : '▶ 运行' }}
    </button>
    <button class="btn" @click="emit('reset')">⟲ 复位</button>

    <div class="ctrl">
      <span class="ctrl-label">仿真速度</span>
      <div class="seg">
        <button
          v-for="sp in [0.5, 1, 2, 4]"
          :key="sp"
          class="seg-btn"
          :class="{ active: (props.snap?.speed ?? 1) === sp }"
          @click="onSpeed(sp)"
        >
          {{ sp }}x
        </button>
      </div>
    </div>

    <div class="ctrl">
      <span class="ctrl-label">不良品概率</span>
      <input
        type="range"
        min="0"
        max="60"
        step="5"
        :value="Math.round((props.snap?.defectRate ?? 25))"
        @input="onDefect"
      />
      <span class="ctrl-value">{{ Math.round(props.snap?.defectRate ?? 25) }}%</span>
    </div>

    <div class="hint">鼠标左键旋转 · 右键平移 · 滚轮缩放</div>
  </div>
</template>

<style scoped>
.controlbar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 18px;
}

.btn {
  border: 1px solid var(--panel-border);
  background: rgba(56, 189, 248, 0.1);
  color: #cfeaff;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover {
  background: rgba(56, 189, 248, 0.22);
}
.btn.primary {
  background: rgba(34, 224, 106, 0.15);
  border-color: rgba(34, 224, 106, 0.4);
  color: #9ff5bd;
  font-weight: 700;
}
.btn.primary:hover {
  background: rgba(34, 224, 106, 0.28);
}

.ctrl {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctrl-label {
  font-size: 12px;
  color: #8fa8c4;
}
.ctrl-value {
  font-size: 12px;
  color: #ffd98a;
  width: 34px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.seg {
  display: flex;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  overflow: hidden;
}
.seg-btn {
  border: none;
  background: transparent;
  color: #9fc2e6;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}
.seg-btn + .seg-btn {
  border-left: 1px solid var(--panel-border);
}
.seg-btn.active {
  background: rgba(56, 189, 248, 0.25);
  color: #eaf6ff;
  font-weight: 700;
}

input[type='range'] {
  width: 120px;
  accent-color: #ff6b78;
}

.hint {
  font-size: 11px;
  color: #5f7591;
}
</style>
