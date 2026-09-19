<script setup lang="ts">
import { computed } from 'vue'
import { simState } from '../factory/simState'

const recent = computed(() => [...simState.events].slice(-7).reverse())
</script>

<template>
  <div class="panel">
    <div class="title">实时事件日志</div>
    <div class="log">
      <transition-group name="log" tag="div">
        <div v-for="e in recent" :key="e.id" class="entry" :class="e.kind">
          <span class="bar"></span>
          {{ e.text }}
        </div>
      </transition-group>
      <div v-if="recent.length === 0" class="empty">等待事件…</div>
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
  margin-bottom: 10px;
}

.log {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 80px;
}

.entry {
  position: relative;
  font-size: 12.5px;
  color: #aebfd2;
  padding: 6px 8px 6px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  line-height: 1.4;
}

.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 3px;
  background: #4aa8ff;
}

.entry.good {
  color: #8cebb4;
}
.entry.good .bar {
  background: #35e07a;
}

.entry.bad {
  color: #ff9aa2;
}
.entry.bad .bar {
  background: #ff4d57;
}

.empty {
  font-size: 12.5px;
  color: #5c6b7e;
  padding: 10px 4px;
}

.log-enter-active {
  transition: all 0.3s ease;
}
.log-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
