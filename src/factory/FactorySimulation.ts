import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CFG } from './config'
import { simState, pushEvent } from './simState'
import { createEnvironment } from './Scene'
import { Conveyor } from './Conveyor'
import { RobotArm } from './RobotArm'
import { Product } from './Product'
import {
  ProcessingStation,
  InspectionStation,
  DefectBin,
  Pallet
} from './Stations'
import { createRuntime, type SimRuntime, type SimComponents } from './simData'
import { advanceBeltA, advanceBeltB } from './beltFlow'
import {
  startTransferJob,
  startDefectJob,
  startGoodJob,
  updateFalling,
  clearAllProducts
} from './armJobs'

export class FactorySimulation {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private comp: SimComponents
  private rt: SimRuntime = createRuntime()
  private raf = 0
  private last = 0
  private fpsAccum = 0
  private fpsFrames = 0
  private warnTimer = 0

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    this.camera.position.set(11.5, 10.5, 13.5)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0.4, 0.7, 0.8)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxPolarAngle = Math.PI / 2.15
    this.controls.minDistance = 5
    this.controls.maxDistance = 34

    createEnvironment(this.scene)

    const beltA = new Conveyor(CFG.beltA.x, CFG.beltA.z0, CFG.beltA.z1, CFG.speedA)
    const beltB = new Conveyor(CFG.beltB.x, CFG.beltB.z0, CFG.beltB.z1, CFG.speedB)
    this.scene.add(beltA.group, beltB.group)

    const robot = new RobotArm(this.scene)
    const processor = new ProcessingStation(this.scene)
    const inspector = new InspectionStation(this.scene)
    const bin = new DefectBin(this.scene)
    const pallet = new Pallet(this.scene)

    this.comp = {
      scene: this.scene,
      beltA,
      beltB,
      robot,
      processor,
      inspector,
      bin,
      pallet
    }

    window.addEventListener('resize', this.onResize)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
    pushEvent('仿真系统启动，产线开始运行', 'info')
  }

  spawnOnce() {
    if (this.rt.products.length >= CFG.maxProducts) return
    const defective = Math.random() * 100 < simState.defectRate
    const p = new Product(defective)
    p.group.position.set(CFG.beltA.x, CFG.gripY, CFG.spawnZ)
    this.scene.add(p.group)
    this.rt.products.push(p)
  }

  reset() {
    clearAllProducts(this.comp, this.rt)
    this.rt = createRuntime()
    simState.good = 0
    simState.bad = 0
    simState.elapsed = 0
    simState.events.length = 0
    this.warnTimer = 0
    this.comp.robot.reset()
    pushEvent('产线已重置', 'info')
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    clearAllProducts(this.comp, this.rt)
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private onResize = () => {
    const el = this.renderer.domElement.parentElement
    if (!el) return
    this.camera.aspect = el.clientWidth / el.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(el.clientWidth, el.clientHeight)
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    const realDt = Math.min((now - this.last) / 1000, 0.05)
    this.last = now

    this.fpsAccum += realDt
    this.fpsFrames++
    if (this.fpsAccum >= 0.5) {
      this.rt.fps = Math.round(this.fpsFrames / this.fpsAccum)
      this.fpsAccum = 0
      this.fpsFrames = 0
    }

    if (simState.running) {
      const dt = realDt * simState.simSpeed
      simState.elapsed += dt
      this.update(dt)
    }
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    const { comp, rt } = this

    if (this.warnTimer > 0) this.warnTimer -= dt

    rt.spawnTimer -= dt
    if (rt.spawnTimer <= 0) {
      this.spawnOnce()
      rt.spawnTimer = CFG.spawnInterval / simState.simSpeed
    }

    if (rt.processorBusy && rt.processing) {
      rt.processRemaining -= dt
      if (rt.processRemaining <= 0) {
        const p = rt.processing
        p.state = 'afterProcess'
        rt.processing = null
        rt.processorBusy = false
      }
    }

    if (rt.inspectorBusy && rt.scanning) {
      rt.scanRemaining -= dt
      if (rt.scanRemaining <= 0) {
        const p = rt.scanning
        p.setMark(p.defective ? 'bad' : 'good')
        p.state = 'onB'
        rt.scanning = null
        rt.inspectorBusy = false
        if (p.defective) {
          comp.inspector.flashWarning()
          this.warnTimer = 1.6
          pushEvent(`产品 #${p.id} 完成质检：发现缺陷`, 'bad')
        }
      }
    }

    advanceBeltA(rt, dt)
    advanceBeltB(rt, dt)
    updateFalling(comp, rt, dt)

    if (!rt.armJobActive && comp.robot.isIdle()) {
      const defect = rt.products.find(
        (p) =>
          p.state === 'onB' &&
          p.defective &&
          Math.abs(p.group.position.z - CFG.beltB.defectZ) < 0.03
      )
      const pickA = rt.products.find(
        (p) =>
          (p.state === 'afterProcess' || p.state === 'onA') &&
          p.group.position.z >= CFG.beltA.pickZ - 0.03
      )
      const good = rt.products.find(
        (p) =>
          p.state === 'onB' &&
          !p.defective &&
          Math.abs(p.group.position.z - CFG.beltB.endZ) < 0.03
      )

      if (defect) {
        startDefectJob(comp, rt, defect)
      } else if (good) {
        startGoodJob(comp, rt, good)
      } else if (pickA && pickA.state === 'afterProcess') {
        startTransferJob(comp, rt, pickA)
      }
    }

    comp.processor.setActive(rt.processorBusy)
    comp.processor.update(dt)
    comp.inspector.setActive(rt.inspectorBusy)
    comp.inspector.update(dt)
    comp.robot.update(dt)

    const beltsBusy = rt.products.some(
      (p) =>
        p.state === 'onA' ||
        p.state === 'afterProcess' ||
        p.state === 'onB' ||
        p.state === 'scanning' ||
        p.state === 'processing'
    )
    comp.beltA.setMoving(beltsBusy)
    comp.beltB.setMoving(rt.products.some((p) => p.state === 'onB' || p.state === 'scanning'))
    comp.beltA.update(dt)
    comp.beltB.update(dt)

    simState.devices.conveyorA = beltsBusy ? 'running' : 'idle'
    simState.devices.conveyorB = rt.products.some(
      (p) => p.state === 'onB' || p.state === 'scanning' || p.state === 'falling'
    )
      ? 'running'
      : 'idle'
    simState.devices.processor = rt.processorBusy ? 'running' : 'idle'
    simState.devices.robot = rt.armJobActive ? 'running' : 'idle'
    simState.devices.inspector = rt.inspectorBusy
      ? 'running'
      : this.warnTimer > 0
        ? 'warning'
        : 'idle'

    comp.processor.setStatus(simState.devices.processor)
    comp.inspector.setStatus(simState.devices.inspector)
    comp.robot.setStatus(rt.armJobActive || comp.robot.busy)
  }
}
