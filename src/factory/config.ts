export const CFG = {
  floor: { w: 30, d: 26 },
  beltTopY: 0.95,
  beltWidth: 1.1,
  productSize: 0.55,
  productHalf: 0.275,
  speedA: 1.05,
  speedB: 0.95,
  gap: 0.78,
  beltA: { x: -2.4, z0: -6, z1: 6, processZ: -3, pickZ: 2.0 },
  beltB: { x: 2.4, z0: 0, z1: 4.3, placeZ: 0.5, scanZ: 2.1, defectZ: 2.6, endZ: 4.0 },
  robot: { x: 0, z: 2.4, shoulderY: 1.75, l1: 1.75, l2: 1.7, hang: 0.95 },
  bin: { x: 0, z: -0.4, size: 1.5, height: 0.8 },
  pallet: { x: 2.4, z: 5.3 },
  spawnZ: -5.5,
  gripY: 1.225,
  liftY: 1.95,
  defectLiftY: 1.55,
  binDropY: 1.12,
  processDuration: 1.7,
  scanDuration: 0.9,
  spawnInterval: 3.6,
  maxProducts: 26,
  palletCap: 8,
  binCap: 10
} as const

export type DeviceKey =
  | 'conveyorA'
  | 'conveyorB'
  | 'processor'
  | 'robot'
  | 'inspector'

export const DEVICE_NAMES: Record<DeviceKey, string> = {
  conveyorA: '输送带 A',
  conveyorB: '输送带 B',
  processor: '加工设备',
  robot: '机械臂',
  inspector: '质检工位'
}
