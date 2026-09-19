import * as THREE from 'three'

export function makeTextSprite(
  text: string,
  color = '#bfe6ff',
  bg = 'rgba(8,18,32,0.72)',
  scale = 1,
): THREE.Sprite {
  const fontSize = 44
  const pad = 18
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `600 ${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2
  const h = fontSize + pad
  canvas.width = w
  canvas.height = h

  ctx.font = `600 ${fontSize}px "PingFang SC","Microsoft YaHei",sans-serif`
  ctx.fillStyle = bg
  roundRect(ctx, 0, 0, w, h, 12)
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3
  roundRect(ctx, 1.5, 1.5, w - 3, h - 3, 10)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(text, pad, h / 2 + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  const worldH = 0.55 * scale
  sprite.scale.set((worldH * w) / h, worldH, 1)
  return sprite
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}
