import * as THREE from 'three'
import { CFG } from './config'
import { makeBeltTexture } from './labels'

const FRAME_MAT = new THREE.MeshStandardMaterial({
  color: 0x3a4356,
  metalness: 0.7,
  roughness: 0.35
})
const LEG_MAT = new THREE.MeshStandardMaterial({
  color: 0x2c3444,
  metalness: 0.6,
  roughness: 0.5
})

export class Conveyor {
  readonly group: THREE.Group
  private beltMat: THREE.MeshStandardMaterial
  private speed: number
  private moving = false
  private texture: THREE.CanvasTexture

  constructor(x: number, z0: number, z1: number, speed: number) {
    this.group = new THREE.Group()
    const length = z1 - z0
    const centerZ = (z0 + z1) / 2
    this.speed = speed

    this.texture = makeBeltTexture()
    this.texture.repeat.set(1.4, length / 0.9)
    this.beltMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.85,
      metalness: 0.15
    })

    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(CFG.beltWidth, 0.14, length),
      this.beltMat
    )
    belt.position.set(x, CFG.beltTopY - 0.07, centerZ)
    belt.receiveShadow = true
    this.group.add(belt)

    const railGeo = new THREE.BoxGeometry(0.09, 0.16, length)
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(railGeo, FRAME_MAT)
      rail.position.set(
        x + side * (CFG.beltWidth / 2 + 0.05),
        CFG.beltTopY + 0.02,
        centerZ
      )
      rail.castShadow = true
      this.group.add(rail)
    }

    const legGeo = new THREE.BoxGeometry(0.14, CFG.beltTopY - 0.14, 0.14)
    const legCount = Math.max(2, Math.round(length / 1.6) + 1)
    for (let i = 0; i < legCount; i++) {
      const z = z0 + (length * i) / (legCount - 1)
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(legGeo, LEG_MAT)
        leg.position.set(x + side * (CFG.beltWidth / 2 - 0.08), (CFG.beltTopY - 0.14) / 2, z)
        leg.castShadow = true
        this.group.add(leg)
      }
    }

    const rollerGeo = new THREE.CylinderGeometry(0.13, 0.13, CFG.beltWidth + 0.1, 20)
    for (const z of [z0, z1]) {
      const roller = new THREE.Mesh(rollerGeo, FRAME_MAT)
      roller.rotation.z = Math.PI / 2
      roller.position.set(x, CFG.beltTopY - 0.07, z)
      this.group.add(roller)
    }
  }

  setMoving(moving: boolean) {
    this.moving = moving
  }

  update(dt: number) {
    if (this.moving) {
      this.texture.offset.y -= (this.speed * dt) / 0.9
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.geometry.dispose()
    })
    this.texture.dispose()
    this.beltMat.dispose()
  }
}
