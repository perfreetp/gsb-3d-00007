import * as THREE from 'three'

export function makeTextSprite(
  text: string,
  color = '#7df9ff',
  scale = 0.0026
): THREE.Sprite {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const font = '600 52px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.font = font
  const w = Math.ceil(ctx.measureText(text).width) + 56
  canvas.width = w
  canvas.height = 96
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(8, 20, 32, 0.62)'
  roundRect(ctx, 4, 14, w - 8, 68, 16)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  roundRect(ctx, 4, 14, w - 8, 68, 16)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.fillText(text, w / 2, 50)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(w * scale, 96 * scale, 1)
  return sprite
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function makeZoneDecal(
  label: string,
  w: number,
  d: number,
  border: string
): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 256, 256)
  ctx.strokeStyle = border
  ctx.lineWidth = 8
  ctx.setLineDash([22, 12])
  ctx.strokeRect(14, 14, 228, 228)
  ctx.setLineDash([])
  ctx.fillStyle = border
  ctx.font = '700 44px "Microsoft YaHei", "PingFang SC", sans-serif'
  ctx.textAlign = 'center'
  ctx.globalAlpha = 0.85
  ctx.fillText(label, 128, 216)

  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), material)
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = 0.012
  return mesh
}

export function makeBeltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#2b3340'
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = '#46505f'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(0, 10)
  ctx.lineTo(64, 54)
  ctx.moveTo(0, 54)
  ctx.lineTo(64, 10)
  ctx.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}
