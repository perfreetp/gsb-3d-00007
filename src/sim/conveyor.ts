import * as THREE from 'three'
import { CFG } from './config'
import { makeTextSprite } from './labels'

function makeBeltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1c2530'
  ctx.fillRect(0, 0, 128, 128)
  ctx.strokeStyle = 'rgba(90,120,150,0.5)'
  ctx.lineWidth = 6
  for (let y = -64; y < 192; y += 64) {
    ctx.beginPath()
    ctx.moveTo(20, y)
    ctx.lineTo(64, y + 32)
    ctx.lineTo(108, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(40,55,70,0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, 64)
  ctx.lineTo(128, 64)
  ctx.stroke()
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 8)
  return tex
}

export class Conveyor {
  group = new THREE.Group()
  running = true
  private readonly beltTex: THREE.CanvasTexture
  readonly topY: number

  constructor(
    x: number,
    z: number,
    length: number,
    label: string,
    labelColor: string,
    private readonly dir: 1 | -1 = 1,
  ) {
    const width = CFG.beltWidth
    this.topY = CFG.beltHeight

    this.beltTex = makeBeltTexture()
    const beltMat = new THREE.MeshStandardMaterial({
      map: this.beltTex,
      roughness: 0.9,
      metalness: 0.1,
    })
    const belt = new THREE.Mesh(new THREE.BoxGeometry(length, 0.12, width), beltMat)
    belt.position.set(x, this.topY - 0.06, z)
    belt.receiveShadow = true
    this.group.add(belt)

    const railMat = new THREE.MeshStandardMaterial({
      color: 0x3a4a5e,
      metalness: 0.7,
      roughness: 0.4,
    })
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(length, 0.18, 0.08),
        railMat,
      )
      rail.position.set(x, this.topY + 0.05, z + (side * (width / 2 + 0.06)))
      this.group.add(rail)
    }

    const legMat = new THREE.MeshStandardMaterial({ color: 0x2b3646, metalness: 0.6, roughness: 0.5 })
    for (let lx = x - length / 2 + 1; lx < x + length / 2; lx += 2.6) {
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.14, this.topY - 0.1, 0.14),
          legMat,
        )
        leg.position.set(lx, (this.topY - 0.1) / 2, z + side * (width / 2 + 0.06))
        leg.castShadow = true
        this.group.add(leg)
      }
    }

    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x6b7c90, metalness: 0.8, roughness: 0.3 })
    for (const end of [x - length / 2, x + length / 2]) {
      const roller = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, width + 0.1, 16),
        rollerMat,
      )
      roller.rotation.x = Math.PI / 2
      roller.position.set(end, this.topY - 0.06, z)
      this.group.add(roller)
    }

    const sprite = makeTextSprite(label, labelColor)
    sprite.position.set(x, this.topY + 1.5, z)
    this.group.add(sprite)
  }

  update(dt: number) {
    if (this.running) {
      this.beltTex.offset.y -= dt * CFG.beltSpeed * 0.55 * this.dir
    }
  }
}
