<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Simulation } from '../sim/simulation'
import type { Snapshot } from '../sim/types'

const el = ref<HTMLDivElement | null>(null)
let sim: Simulation | null = null
let controls: OrbitControls | null = null
let resizeObs: ResizeObserver | null = null
let raf = 0

const emit = defineEmits<{ (e: 'snapshot', s: Snapshot): void }>()

onMounted(() => {
  const container = el.value!
  sim = new Simulation(container)
  sim.onSnapshot = (s) => emit('snapshot', s)

  controls = new OrbitControls(sim.camera, sim.domElement)
  controls.target.set(0, 0.9, 2)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI / 2.05
  controls.minDistance = 6
  controls.maxDistance = 45
  const updateControls = () => {
    controls?.update()
    raf = requestAnimationFrame(updateControls)
  }
  raf = requestAnimationFrame(updateControls)

  resizeObs = new ResizeObserver(() => {
    sim?.resize(container.clientWidth, container.clientHeight)
  })
  resizeObs.observe(container)
})

defineExpose({
  toggle: () => sim?.setRunning(!sim.running),
  setSpeed: (v: number) => sim?.setSpeed(v),
  setDefectRate: (v: number) => sim?.setDefectRate(v),
  reset: () => sim?.reset(),
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  controls?.dispose()
  resizeObs?.disconnect()
  sim?.dispose()
})
</script>

<template>
  <div class="viewer" ref="el"></div>
</template>

<style scoped>
.viewer {
  position: absolute;
  inset: 0;
}
.viewer :deep(canvas) {
  display: block;
}
</style>
