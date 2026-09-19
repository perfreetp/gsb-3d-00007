import * as THREE from 'three'
import { CFG } from './config'
import { makeTextSprite } from './labels'

export class FactoryScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly root = new THREE.Group()
  private cb: ((dt: number) => void) | null = null
  private last = 0
  private frameId = 0
  private disposed = false

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.renderer.setClearColor(0x0a0f1a, 1)
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    )
    this.camera.position.set(15, 13, 21)
    this.camera.lookAt(-0.5, 0.9, 2.2)

    this.scene.fog = new THREE.Fog(0x0a0f1a, 38, 80)

    this.buildLights()
    this.buildFloor()
    this.buildZones()
    this.scene.add(this.root)

    this.loop = this.loop.bind(this)
    this.frameId = requestAnimationFrame(this.loop)
  }

  onTick(cb: (dt: number) => void) {
    this.cb = cb
  }

  private loop(now: number) {
    if (this.disposed) return
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0.016
    this.last = now
    this.cb?.(dt)
    this.renderer.render(this.scene, this.camera)
    this.frameId = requestAnimationFrame(this.loop)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frameId)
  }

  resize(w: number, h: number) {
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  private buildLights() {
    const hemi = new THREE.HemisphereLight(0xbfd9ff, 0x1a2230, 0.75)
    this.scene.add(hemi)

    const dir = new THREE.DirectionalLight(0xffffff, 1.5)
    dir.position.set(12, 20, 8)
    dir.castShadow = true
    dir.shadow.mapSize.set(2048, 2048)
    dir.shadow.camera.left = -16
    dir.shadow.camera.right = 16
    dir.shadow.camera.top = 16
    dir.shadow.camera.bottom = -16
    dir.shadow.camera.far = 60
    this.scene.add(dir)

    const fill = new THREE.PointLight(0x38bdf8, 0.5, 40)
    fill.position.set(-10, 8, 6)
    this.scene.add(fill)
  }

  private buildFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 40),
      new THREE.MeshStandardMaterial({ color: 0x141c2a, roughness: 0.95, metalness: 0.05 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.scene.add(floor)

    const grid = new THREE.GridHelper(60, 60, 0x2a4a66, 0x1c2c3e)
    grid.position.y = 0.01
    ;(grid.material as THREE.Material).transparent = true
    ;(grid.material as THREE.Material).opacity = 0.5
    this.scene.add(grid)
  }

  private buildZones() {
    this.decal(-8, 0, 2.4, CFG.beltWidth + 0.6, 0x22e06a, '上料区', '#8affb5')
    this.decal(CFG.decision.x, CFG.decision.z, 2.2, CFG.beltWidth + 0.6, 0xffb020, '分拣点', '#ffd98a')
    this.decal(CFG.rejectBin.x, CFG.rejectBin.z, 2.4, 2.4, 0xff4d5e, '异常区', '#ff9aa4')
    this.decal(CFG.goodEnd.x, CFG.goodEnd.z, 2.2, 2.2, 0x22e06a, '良品区', '#8affb5')
  }

  private decal(x: number, z: number, w: number, d: number, color: number, text: string, labelColor: string) {
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    })
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
    plane.rotation.x = -Math.PI / 2
    plane.position.set(x, 0.02, z)
    this.scene.add(plane)

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)),
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    )
    edge.rotation.x = -Math.PI / 2
    edge.position.set(x, 0.025, z)
    this.scene.add(edge)

    const label = makeTextSprite(text, labelColor, 'rgba(8,18,32,0.55)', 0.8)
    label.position.set(x, 0.35, z)
    this.scene.add(label)
  }
}
