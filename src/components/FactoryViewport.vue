<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FactorySimulation } from '../factory/FactorySimulation'

const containerRef = ref<HTMLDivElement>()
let sim: FactorySimulation | null = null

onMounted(() => {
  if (containerRef.value) {
    sim = new FactorySimulation(containerRef.value)
  }
})

onBeforeUnmount(() => {
  sim?.dispose()
  sim = null
})

defineExpose({
  spawn: () => sim?.spawnOnce(),
  reset: () => sim?.reset()
})
</script>

<template>
  <div ref="containerRef" class="viewport"></div>
</template>

<style scoped>
.viewport {
  position: absolute;
  inset: 0;
}

.viewport :deep(canvas) {
  display: block;
}
</style>
