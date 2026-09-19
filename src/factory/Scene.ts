import * as THREE from 'three'
import { CFG } from './config'
import { makeTextSprite, makeZoneDecal } from './labels'

export function createEnvironment(scene: THREE.Scene) {
  scene.background = new THREE.Color(0x0a121d)
  scene.fog = new THREE.Fog(0x0a121d, 22, 48)

  const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x1a2230, 0.75)
  scene.add(hemi)

  const key = new THREE.DirectionalLight(0xffffff, 2.1)
  key.position.set(8, 14, 6)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = -14
  key.shadow.camera.right = 14
  key.shadow.camera.top = 14
  key.shadow.camera.bottom = -14
  key.shadow.camera.near = 1
  key.shadow.camera.far = 40
  key.shadow.bias = -0.0004
  scene.add(key)

  const fill = new THREE.DirectionalLight(0x4aa8ff, 0.5)
  fill.position.set(-8, 6, -6)
  scene.add(fill)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(CFG.floor.w, CFG.floor.d),
    new THREE.MeshStandardMaterial({ color: 0x131c2a, roughness: 0.92, metalness: 0.1 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const grid = new THREE.GridHelper(CFG.floor.w, 30, 0x2a3c52, 0x1b2735)
  grid.position.y = 0.004
  ;(grid.material as THREE.Material).transparent = true
  ;(grid.material as THREE.Material).opacity = 0.55
  scene.add(grid)

  addZone(scene, '加工区', CFG.beltA.x - 0.2, CFG.beltA.processZ, 2.6, 2.4, 0x4aa8ff)
  addZone(scene, '上料 / 输送带 A', CFG.beltA.x, CFG.beltA.z0 + 0.7, 2.4, 2.2, 0x4aa8ff)
  addZone(scene, '搬运区', CFG.beltA.pickZ, CFG.beltA.pickZ + 0.1, 3.0, 1.7, 0xffa93b)
  addZone(scene, '质检区', CFG.beltB.x, CFG.beltB.scanZ, 2.4, 1.8, 0x2fe7ff)
  addZone(scene, '异常品区', CFG.bin.x, CFG.bin.z, 2.1, 2.1, 0xff4d57)
  addZone(scene, '成品区', CFG.pallet.x, CFG.pallet.z, 2.4, 2.4, 0x35e07a)

  addLabel(scene, '加工设备', CFG.beltA.x, CFG.beltA.processZ, 2.95)
  addLabel(scene, '输送带 A', CFG.beltA.x, CFG.beltA.z0 - 0.35, 1.5)
  addLabel(scene, '输送带 B · 质检线', CFG.beltB.x, CFG.beltB.z0 - 0.2, 1.5)
  addLabel(scene, '机械臂', CFG.robot.x, CFG.robot.z, 3.15)
  addLabel(scene, '异常品区', CFG.bin.x, CFG.bin.z - 1.18, 1.25, '#ff8a92')
  addLabel(scene, '成品区', CFG.pallet.x, CFG.pallet.z - 1.18, 1.25, '#7df0b0')
}

function addZone(
  scene: THREE.Scene,
  label: string,
  x: number,
  z: number,
  w: number,
  d: number,
  color: number
) {
  const hex = '#' + color.toString(16).padStart(6, '0')
  const decal = makeZoneDecal(label, w, d, hex)
  decal.position.x = x
  decal.position.z = z
  scene.add(decal)
}

function addLabel(
  scene: THREE.Scene,
  text: string,
  x: number,
  z: number,
  y: number,
  color = '#7df9ff'
) {
  const sprite = makeTextSprite(text, color)
  sprite.position.set(x, y, z)
  scene.add(sprite)
}
