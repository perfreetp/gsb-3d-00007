import type * as THREE from 'three'
import type { Product } from './Product'
import type { Conveyor } from './Conveyor'
import type { RobotArm } from './RobotArm'
import type { ProcessingStation, InspectionStation, DefectBin, Pallet } from './Stations'

export interface SimComponents {
  scene: THREE.Scene
  beltA: Conveyor
  beltB: Conveyor
  robot: RobotArm
  processor: ProcessingStation
  inspector: InspectionStation
  bin: DefectBin
  pallet: Pallet
}

export interface SimRuntime {
  products: Product[]
  spawnTimer: number
  processorBusy: boolean
  processRemaining: number
  processing: Product | null
  pickTarget: Product | null
  inspectorBusy: boolean
  scanRemaining: number
  scanning: Product | null
  defectTarget: Product | null
  goodTarget: Product | null
  armJobActive: boolean
  falling: Set<Product>
  palletCount: number
  binCount: number
  fps: number
}

export function createRuntime(): SimRuntime {
  return {
    products: [],
    spawnTimer: 0.6,
    processorBusy: false,
    processRemaining: 0,
    processing: null,
    pickTarget: null,
    inspectorBusy: false,
    scanRemaining: 0,
    scanning: null,
    defectTarget: null,
    goodTarget: null,
    armJobActive: false,
    falling: new Set<Product>(),
    palletCount: 0,
    binCount: 0,
    fps: 0
  }
}
