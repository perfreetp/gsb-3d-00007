import * as THREE from 'three'
import { CFG } from './config'
import { makeTextSprite } from './labels'

export class ProcessingMachine {
  group = new THREE.Group()
  state: 'idle' | 'running' = 'idle'
  private readonly head: THREE.Mesh
  private readonly headBaseY = 1.85
  private readonly beaconMat: THREE.MeshStandardMaterial
  private readonly beacon: THREE.Mesh

  constructor() {
    const x = CFG.machine.x
    const metal = new THREE.MeshStandardMaterial({ color: 0x46586d, metalness: 0.7, roughness: 0.35 })
    const dark = new THREE.MeshStandardMaterial({ color: 0x26303d, metalness: 0.6, roughness: 0.5 })

    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(CFG.machine.length, 1.9, 0.12), side === 1 ? metal : dark)
      wall.position.set(x, CFG.beltHeight + 0.95, side * (CFG.beltWidth / 2 + 0.12))
      wall.castShadow = true
      this.group.add(wall)
    }
    const roof = new THREE.Mesh(new THREE.BoxGeometry(CFG.machine.length, 0.16, CFG.beltWidth + 0.36), metal)
    roof.position.set(x, CFG.beltHeight + 1.95, 0)
    this.group.add(roof)

    const gateMat = new THREE.MeshStandardMaterial({
      color: 0xffb020,
      transparent: true,
      opacity: 0.28,
      emissive: 0x553300,
    })
    for (const gx of [x - CFG.machine.length / 2, x + CFG.machine.length / 2]) {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.5, CFG.beltWidth + 0.2), gateMat)
      gate.position.set(gx, CFG.beltHeight + 0.75, 0)
      this.group.add(gate)
    }

    this.head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.28, 0.5, 18),
      new THREE.MeshStandardMaterial({ color: 0xd7e2ee, metalness: 0.85, roughness: 0.25 }),
    )
    this.head.position.set(x, this.headBaseY, 0)
    this.group.add(this.head)
    const drill = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.1, 0.34),
      new THREE.MeshStandardMaterial({ color: 0xffb020, metalness: 0.4, roughness: 0.4, emissive: 0x332000 }),
    )
    drill.position.y = -0.3
    this.head.add(drill)

    this.beaconMat = new THREE.MeshStandardMaterial({ color: 0x22e06a, emissive: 0x0c5a26 })
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), this.beaconMat)
    this.beacon.position.set(x - CFG.machine.length / 2 + 0.25, CFG.beltHeight + 2.12, 0)
    this.group.add(this.beacon)

    const label = makeTextSprite('加工设备', '#ffcf6e')
    label.position.set(x, CFG.beltHeight + 2.6, 0)
    this.group.add(label)
  }

  update(dt: number, cycleT: number) {
    if (this.state === 'running') {
      const p = cycleT
      const stroke = p < 0.5 ? ease(p * 2) : ease(1 - (p - 0.5) * 2)
      this.head.position.y = this.headBaseY - stroke * 0.55
      this.beaconMat.color.setHex(0xffb020)
      this.beaconMat.emissive.setHex(0x8a5a00)
      this.beacon.scale.setScalar(1 + Math.sin(performance.now() * 0.01) * 0.12)
    } else {
      this.head.position.y += (this.headBaseY - this.head.position.y) * Math.min(1, dt * 6)
      this.beaconMat.color.setHex(0x22e06a)
      this.beaconMat.emissive.setHex(0x0c5a26)
      this.beacon.scale.setScalar(1)
    }
  }
}

export class InspectionStation {
  group = new THREE.Group()
  state: 'idle' | 'running' = 'idle'
  private readonly beamMat: THREE.MeshBasicMaterial
  private readonly beam: THREE.Mesh
  private readonly beaconMat: THREE.MeshStandardMaterial
  private readonly beacon: THREE.Mesh

  constructor() {
    const x = CFG.inspect.x
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3d6fa8, metalness: 0.7, roughness: 0.3 })
    const halfW = CFG.beltWidth / 2 + 0.25
    const height = 2.1
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, height, 0.16), frameMat)
      post.position.set(x, CFG.beltHeight + height / 2, side * halfW)
      post.castShadow = true
      this.group.add(post)
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, halfW * 2 + 0.16), frameMat)
    top.position.set(x, CFG.beltHeight + height, 0)
    this.group.add(top)

    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    this.beam = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, halfW * 2), this.beamMat)
    this.beam.position.set(x, CFG.beltHeight + 0.85, 0)
    this.group.add(this.beam)

    this.beaconMat = new THREE.MeshStandardMaterial({ color: 0x22e06a, emissive: 0x0c5a26 })
    const beacon: THREE.Mesh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), this.beaconMat)
    this.beacon = beacon
    beacon.position.set(x, CFG.beltHeight + height + 0.2, 0)
    this.group.add(beacon)

    const label = makeTextSprite('质检工位', '#7fd0ff')
    label.position.set(x, CFG.beltHeight + height + 0.6, 0)
    this.group.add(label)
  }

  update(dt: number, cycleT: number) {
    if (this.state === 'running') {
      this.beamMat.opacity = 0.35 + Math.sin(performance.now() * 0.02) * 0.18
      this.beam.position.z = Math.sin(cycleT * Math.PI * 2) * (CFG.beltWidth / 2)
      this.beaconMat.color.setHex(0x38bdf8)
      this.beaconMat.emissive.setHex(0x0b4a78)
    } else {
      this.beamMat.opacity += (0 - this.beamMat.opacity) * Math.min(1, dt * 6)
      this.beaconMat.color.setHex(0x38bdf8)
      this.beacon.position.z = 0
      this.beaconMat.color.setHex(0x22e06a)
      this.beaconMat.emissive.setHex(0x0c5a26)
    }
  }
}

export class Bin {
  group = new THREE.Group()
  private readonly basePos: THREE.Vector3
  private readonly cols: number
  private readonly layers: number
  private count = 0
  readonly capacity: number

  constructor(
    x: number,
    z: number,
    color: number,
    label: string,
    labelColor: string,
    cols = 3,
    layer = 2,
  ) {
    this.basePos = new THREE.Vector3(x, 0, z)
    this.cols = cols
    this.layers = layer
    this.capacity = cols * cols * this.layers

    const w = 1.9
    const h = 0.9
    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.35,
      roughness: 0.6,
      transparent: true,
      opacity: 0.5,
    })
    const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, w), mat)
    floor.position.set(x, 0.04, z)
    floor.receiveShadow = true
    this.group.add(floor)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, 0.08), mat)
        post.position.set(x + sx * w / 2, h / 2, z + sz * w / 2)
        this.group.add(post)
      }
    }
    for (const side of [-1, 1]) {
      const wall1 = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, 0.05), mat)
      wall1.position.set(x, h * 0.35, z + side * w / 2)
      this.group.add(wall1)
      const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.7, w), mat)
      wall2.position.set(x + side * w / 2, h * 0.35, z)
      this.group.add(wall2)
    }

    void label
    void labelColor
  }

  nextSlot(): THREE.Vector3 {
    const i = this.count % this.capacity
    const col = i % this.cols
    const row = Math.floor(i / this.cols) % this.cols
    const level = Math.floor(i / (this.cols * this.cols))
    const step = 0.58
    const p = this.basePos.clone()
    p.x += (col - (this.cols - 1) / 2) * step
    p.z += (row - (this.cols - 1) / 2) * step
    p.y = 0.12 + CFG.product.h / 2 + level * (CFG.product.h + 0.04)
    this.count++
    return p
  }

  get full() {
    return this.count >= this.capacity
  }

  get stacked() {
    return this.count
  }

  reset() {
    this.count = 0
  }
}

function ease(t: number) {
  return t * t * (3 - 2 * t)
}
