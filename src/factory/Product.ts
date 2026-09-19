import * as THREE from 'three'
import { CFG } from './config'

export type ProductState =
  | 'onA'
  | 'processing'
  | 'afterProcess'
  | 'carried'
  | 'onB'
  | 'scanning'
  | 'defectWait'
  | 'falling'
  | 'settled'

type MarkKind = 'none' | 'process' | 'good' | 'bad'

let productSeq = 0

export class Product {
  readonly id: number
  readonly defective: boolean
  state: ProductState = 'onA'
  group: THREE.Group
  velY = 0
  fallDone: (() => void) | null = null
  private mark: THREE.Mesh
  private markMat: THREE.MeshStandardMaterial
  private glow: THREE.PointLight

  constructor(defective: boolean) {
    this.id = productSeq++
    this.defective = defective
    const s = CFG.productSize
    this.group = new THREE.Group()

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x6fa8c9,
      metalness: 0.35,
      roughness: 0.45
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), bodyMat)
    body.castShadow = true
    body.receiveShadow = true
    this.group.add(body)

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s)),
      new THREE.LineBasicMaterial({ color: 0x21465c })
    )
    this.group.add(edge)

    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(s * 0.55, 0.03, s * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x37485a, roughness: 0.6 })
    )
    plate.position.y = s / 2 + 0.016
    this.group.add(plate)

    this.markMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x000000,
      emissiveIntensity: 1.4
    })
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(s * 0.12, 0.02, s * 0.8),
      new THREE.MeshStandardMaterial({
        color: 0xffd23f,
        emissive: 0x8a6a00,
        emissiveIntensity: 0.5
      })
    )
    stripe.position.set(s * 0.18, s / 2 + 0.012, 0)
    this.group.add(stripe)

    this.mark = new THREE.Mesh(
      new THREE.CylinderGeometry(s * 0.16, s * 0.16, 0.04, 24),
      this.markMat
    )
    this.mark.position.y = s / 2 + 0.045
    this.mark.visible = false
    this.group.add(this.mark)

    this.glow = new THREE.PointLight(0x000000, 0, 1.4)
    this.glow.position.set(0, s * 0.55, 0)
    this.group.add(this.glow)
  }

  setMark(kind: MarkKind) {
    if (kind === 'none') {
      this.mark.visible = false
      this.glow.color.setHex(0x000000)
      this.glow.intensity = 0
      return
    }
    this.mark.visible = true
    if (kind === 'process') {
      this.markMat.color.setHex(0xffb340)
      this.markMat.emissive.setHex(0xff8c00)
      this.glow.color.setHex(0xff8c00)
      this.glow.intensity = 0.6
    } else if (kind === 'good') {
      this.markMat.color.setHex(0x35e07a)
      this.markMat.emissive.setHex(0x17c964)
      this.glow.color.setHex(0x17c964)
      this.glow.intensity = 0.8
    } else {
      this.markMat.color.setHex(0xff4d57)
      this.markMat.emissive.setHex(0xe5323d)
      this.glow.color.setHex(0xe5323d)
      this.glow.intensity = 0.9
    }
  }

  dispose() {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
  }
}
