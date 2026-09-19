import * as THREE from 'three'
import { CFG } from './config'
import type { Quality } from './types'

const COLORS: Record<Quality, { c: number; e: number }> = {
  unknown: { c: 0x5f93c9, e: 0x000000 },
  good: { c: 0x2fe07a, e: 0x0c5a26 },
  bad: { c: 0xff4d5e, e: 0x6e0c16 },
}

export class Product {
  group = new THREE.Group()
  quality: Quality = 'unknown'
  readonly bodyMat: THREE.MeshStandardMaterial
  readonly capMat: THREE.MeshStandardMaterial
  private readonly ring: THREE.Mesh
  private readonly ringMat: THREE.MeshBasicMaterial

  constructor() {
    const { w, h, d } = CFG.product
    this.bodyMat = new THREE.MeshStandardMaterial({
      color: COLORS.unknown.c,
      metalness: 0.55,
      roughness: 0.35,
    })
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.bodyMat)
    body.castShadow = true
    this.group.add(body)

    this.capMat = new THREE.MeshStandardMaterial({
      color: 0x9fd0ff,
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x000000,
    })
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.05, d * 0.55), this.capMat)
    cap.position.y = h / 2 + 0.025
    this.group.add(cap)

    this.ringMat = new THREE.MeshBasicMaterial({
      color: 0x2fe07a,
      transparent: true,
      opacity: 0.0,
    })
    this.ring = new THREE.Mesh(
      new THREE.TorusGeometry(Math.max(w, d) * 0.72, 0.02, 10, 32),
      this.ringMat,
    )
    this.ring.rotation.x = Math.PI / 2
    this.ring.position.y = h / 2 + 0.04
    this.group.add(this.ring)

    this.group.position.y = CFG.beltHeight + h / 2
  }

  setQuality(q: Quality) {
    this.quality = q
    const c = COLORS[q]
    this.bodyMat.color.setHex(c.c)
    this.bodyMat.emissive.setHex(c.e)
    if (q === 'unknown') {
      this.ringMat.opacity = 0
    } else if (q === 'good') {
      this.ringMat.color.setHex(0x2fe07a)
      this.ringMat.opacity = 0.9
      this.capMat.emissive.setHex(0x0c5a26)
    } else {
      this.ringMat.color.setHex(0xff4d5e)
      this.ringMat.opacity = 0.9
      this.capMat.emissive.setHex(0x6e0c16)
    }
  }

  reset() {
    this.setQuality('unknown')
    this.group.visible = true
    this.group.rotation.set(0, 0, 0)
  }

  dispose() {
    this.bodyMat.dispose()
    this.capMat.dispose()
    this.ringMat.dispose()
  }
}
