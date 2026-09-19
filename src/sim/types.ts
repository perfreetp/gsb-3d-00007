export type Quality = 'unknown' | 'good' | 'bad'

export type ProductState =
  | 'onA'
  | 'processing'
  | 'waitR1'
  | 'carriedR1'
  | 'onB'
  | 'inspecting'
  | 'waitDecision'
  | 'carriedR2'
  | 'goodDone'
  | 'badDone'

export type EventKind = 'info' | 'good' | 'bad' | 'warn'

export interface SimEvent {
  id: number
  time: string
  kind: EventKind
  text: string
}

export interface DeviceStatus {
  name: string
  state: 'idle' | 'running' | 'busy' | 'fault'
  detail: string
}

export interface Snapshot {
  running: boolean
  time: string
  total: number
  good: number
  bad: number
  yieldRate: number
  speed: number
  defectRate: number
  beltA: boolean
  beltB: boolean
  devices: DeviceStatus[]
  events: SimEvent[]
}
