import { computed, reactive } from 'vue'
import type { DeviceKey } from './config'

export type DevStatus = 'idle' | 'running' | 'warning'

export interface SimEvent {
  id: number
  text: string
  kind: 'info' | 'good' | 'bad'
}

interface SimState {
  running: boolean
  simSpeed: number
  defectRate: number
  elapsed: number
  good: number
  bad: number
  devices: Record<DeviceKey, DevStatus>
  events: SimEvent[]
}

export const simState = reactive<SimState>({
  running: true,
  simSpeed: 1,
  defectRate: 22,
  elapsed: 0,
  good: 0,
  bad: 0,
  devices: {
    conveyorA: 'idle',
    conveyorB: 'idle',
    processor: 'idle',
    robot: 'idle',
    inspector: 'idle'
  },
  events: []
})

export const totalCount = computed(() => simState.good + simState.bad)
export const yieldRate = computed(() =>
  totalCount.value === 0 ? 100 : Math.round((simState.good / totalCount.value) * 1000) / 10
)

let eventId = 0
export function pushEvent(text: string, kind: SimEvent['kind'] = 'info') {
  simState.events.push({ id: eventId++, text, kind })
  if (simState.events.length > 60) simStateEventsTrim()
}

function simStateEventsTrim() {
  simState.events.splice(0, simState.events.length - 60)
}

export function formatClock(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
