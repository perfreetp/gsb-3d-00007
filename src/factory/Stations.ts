import * as THREE from 'three'
import { CFG } from './config'
import type { DevStatus } from './simState'

const STEEL = new THREE.MeshStandardMaterial({
  color: 0x55607a,
  metalness: 0.75,
  roughness: 0.3
})
const DARK = new THREE.MeshStandardMaterial({
  color: 0x2a3242,
  metalness: 0.6,
  roughness: 0.5
})

function statusMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8a93a6,
    emissive: 0x3a4252,
    emissiveIntensity: 0.8
  })
}

export class ProcessingStation {
  private pressHead: THREE.Mesh
  private lightMat: THREE.MeshStandardMaterial
  private spin: THREE.Group
  private active = false
  private phase = 0

  constructor(scene: THREE.Scene) {
    const g = new THREE.Group()
    g.position.set(CFG.beltA.x, 0, CFG.beltA.processZ)

    const legGeo = new THREE.BoxGeometry(0.16, 2.1, 0.16)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, DARK)
        leg.position.set(sx * 0.85, 1.05, sz * 0.75)
        leg.castShadow = true
        g.add(leg)
      }
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.2, 1.65), STEEL)
    top.position.y = 2.15
    top.castShadow = true
    g.add(top)

    this.spin = new THREE.Group()
    this.spin.position.y = 2.02
    g.add(this.spin)
    const drill = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12), DARK)
    drill.position.y = -0.22
    drill.castShadow = true
    this.spin.add(drill)
    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.08), STEEL)
      const a = (i * Math.PI * 2) / 3
      blade.position.set(Math.cos(a) * 0.2, -0.46, Math.sin(a) * 0.2)
      blade.rotation.y = -a
      this.spin.add(blade)
    }

    this.pressHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.22, 0.62),
      new THREE.MeshStandardMaterial({
        color: 0xff9d2e,
        metalness: 0.5,
        roughness: 0.35,
        emissive: 0x6b3500,
        emissiveIntensity: 0.4
      })
    )
    this.pressHead.position.y = 1.72
    this.pressHead.castShadow = true
    g.add(this.pressHead)

    this.lightMat = statusMaterial()
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), this.lightMat)
    lamp.position.set(0.78, 2.32, 0.55)
    g.add(lamp)

    scene.add(g)
  }

  setActive(active: boolean) {
    this.active = active
  }

  setStatus(status: DevStatus) {
    if (status === 'running') {
      this.lightMat.color.setHex(0x35e07a)
      this.lightMat.emissive.setHex(0x17c964)
    } else if (status === 'warning') {
      this.lightMat.color.setHex(0xff4d57)
      this.lightMat.emissive.setHex(0xe5323d)
    } else {
      this.lightMat.color.setHex(0x8a93a6)
      this.lightMat.emissive.setHex(0x3a4252)
    }
  }

  update(dt: number) {
    if (this.active) {
      this.phase += dt * 4.2
      const cycle = (Math.sin(this.phase) + 1) / 2
      this.pressHead.position.y = 1.42 + cycle * 0.3
      this.spin.rotation.y += dt * 14
    } else {
      this.pressHead.position.y = THREE.MathUtils.lerp(this.pressHead.position.y, 1.72, dt * 4)
    }
  }
}

export class InspectionStation {
  private beamMat: THREE.MeshBasicMaterial
  private lightMat: THREE.MeshStandardMaterial
  private cameraHead: THREE.Group
  private active = false
  private warning = 0
  private phase = 0

  constructor(scene: THREE.Scene) {
    const g = new THREE.Group()
    g.position.set(CFG.beltB.x, 0, CFG.beltB.scanZ)

    const legGeo = new THREE.BoxGeometry(0.14, 2.0, 0.14)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, DARK)
        leg.position.set(sx * 0.8, 1.0, sz * 0.55)
        leg.castShadow = true
        g.add(leg)
      }
    }
    const arch = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.18, 1.25), STEEL)
    arch.position.y = 2.05
    arch.castShadow = true
    g.add(arch)

    this.cameraHead = new THREE.Group()
    this.cameraHead.position.y = 1.86
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.34), DARK)
    cam.castShadow = true
    this.cameraHead.add(cam)
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.16, 20),
      new THREE.MeshStandardMaterial({
        color: 0x101826,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x2fe7ff,
        emissiveIntensity: 0.5
      })
    )
    lens.position.y = -0.2
    this.cameraHead.add(lens)
    g.add(this.cameraHead)

    this.beamMat = new THREE.MeshBasicMaterial({
      color: 0x2fe7ff,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide
    })
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.18, 1.0, 24, 1, true), this.beamMat)
    beam.position.y = 1.32
    g.add(beam)

    this.lightMat = statusMaterial()
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), this.lightMat)
    lamp.position.set(0.72, 2.22, 0.42)
    g.add(lamp)

    scene.add(g)
  }

  setActive(active: boolean) {
    this.active = active
  }

  flashWarning() {
    this.warning = 1.2
  }

  setStatus(status: DevStatus) {
    if (status === 'running') {
      this.lightMat.color.setHex(0x35e07a)
      this.lightMat.emissive.setHex(0x17c964)
    } else if (status === 'warning') {
      this.lightMat.color.setHex(0xff4d57)
      this.lightMat.emissive.setHex(0xe5323d)
    } else {
      this.lightMat.color.setHex(0x8a93a6)
      this.lightMat.emissive.setHex(0x3a4252)
    }
  }

  update(dt: number) {
    this.phase += dt
    if (this.active) {
      this.beamMat.opacity = 0.14 + 0.1 * (0.5 + 0.5 * Math.sin(this.phase * 10))
    } else {
      this.beamMat.opacity = THREE.MathUtils.lerp(this.beamMat.opacity, 0.06, dt * 4)
    }
    if (this.warning > 0) {
      this.warning -= dt
      const blink = Math.sin(this.phase * 24) > 0
      this.beamMat.color.setHex(blink ? 0xff4d57 : 0x2fe7ff)
    } else {
      this.beamMat.color.setHex(0x2fe7ff)
    }
  }
}

export class DefectBin {
  readonly group: THREE.Group

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group()
    this.group.position.set(CFG.bin.x, 0, CFG.bin.z)
    const s = CFG.bin.size
    const h = CFG.bin.height
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xb03a44,
      metalness: 0.35,
      roughness: 0.6,
      transparent: true,
      opacity: 0.55
    })
    const bottom = new THREE.Mesh(
      new THREE.BoxGeometry(s, 0.08, s),
      new THREE.MeshStandardMaterial({ color: 0x5a2228, roughness: 0.7 })
    )
    bottom.position.y = 0.04
    bottom.receiveShadow = true
    this.group.add(bottom)

    const t = 0.08
    const walls: [number, number, number, number, number, number][] = [
      [s, h, t, 0, h / 2, s / 2 - t / 2],
      [s, h, t, 0, h / 2, -s / 2 + t / 2],
      [t, h, s, s / 2 - t / 2, h / 2, 0],
      [t, h, s, -s / 2 + t / 2, h / 2, 0]
    ]
    for (const [w, hh, dd, x, y, z] of walls) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, hh, dd), wallMat)
      wall.position.set(x, y, z)
      wall.castShadow = true
      this.group.add(wall)
    }
    scene.add(this.group)
  }
}

export class Pallet {
  readonly group: THREE.Group

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group()
    this.group.position.set(CFG.pallet.x, 0, CFG.pallet.z)
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2f6e4f,
      metalness: 0.3,
      roughness: 0.6
    })
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 1.7), baseMat)
    base.position.y = 0.05
    base.receiveShadow = true
    base.castShadow = true
    this.group.add(base)

    const lineMat = new THREE.MeshBasicMaterial({ color: 0x7df9ff })
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const slot = new THREE.Mesh(
          new THREE.BoxGeometry(CFG.productSize + 0.12, 0.012, CFG.productSize + 0.12),
          new THREE.MeshBasicMaterial({ color: 0x0e2a33 })
        )
        slot.position.set((i - 0.5) * 0.62, 0.106, (j - 0.5) * 0.62)
        this.group.add(slot)
        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(CFG.productSize + 0.12, 0.02, 0.02),
          lineMat
        )
        frame.position.set((i - 0.5) * 0.62, 0.112, (j - 0.5) * 0.62 + (CFG.productSize + 0.12) / 2)
        this.group.add(frame)
      }
    }
    scene.add(this.group)
  }
}
