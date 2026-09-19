import * as THREE from 'three'
import { CFG } from './config'

interface MoveStep {
  kind: 'move'
  x: number
  y: number
  z: number
  roll: number
  speed: number
}
interface GripStep {
  kind: 'grip'
}
interface ReleaseStep {
  kind: 'release'
  onRelease: (() => void) | null
}
type ArmStep = MoveStep | GripStep | ReleaseStep

const READY: [number, number, number] = [CFG.robot.x, 1.92, CFG.robot.z + 0.25]
const MOVE_SPEED = 4.6
const ACTION_TIME = 0.11
const HALF_OPEN = 0.24
const HALF_CLOSE = 0.175

export class RobotArm {
  readonly group: THREE.Group
  private steps: ArmStep[] = []
  private current: MoveStep | null = null
  private from = new THREE.Vector3(...READY)
  private tcp = new THREE.Vector3(...READY)
  private roll = 0
  private targetRoll = 0
  private fromRoll = 0
  private rollDelta = 0
  private actionTimer = 0
  private action: 'grip' | 'release' | null = null
  private releaseCb: (() => void) | null = null
  busy = false

  private basePivot: THREE.Group
  private shoulderPivot: THREE.Group
  private wristTilt: THREE.Group
  private wristRoll: THREE.Group
  private fingerL: THREE.Mesh
  private fingerR: THREE.Mesh
  private fingerOpen = HALF_OPEN
  private gripResolve: (() => void) | null = null
  private statusLightMat: THREE.MeshStandardMaterial
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.group = new THREE.Group()
    this.group.position.set(CFG.robot.x, 0, CFG.robot.z)

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xd98a2b,
      metalness: 0.55,
      roughness: 0.4
    })
    const armMat = new THREE.MeshStandardMaterial({
      color: 0xf2a93b,
      metalness: 0.5,
      roughness: 0.35
    })
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x4b5568,
      metalness: 0.8,
      roughness: 0.3
    })

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.52, 0.55, 28),
      new THREE.MeshStandardMaterial({ color: 0x2e3748, metalness: 0.7, roughness: 0.4 })
    )
    pedestal.position.y = 0.275
    pedestal.castShadow = true
    pedestal.receiveShadow = true
    this.group.add(pedestal)

    const baseCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 28), baseMat)
    baseCyl.position.y = 0.78
    baseCyl.castShadow = true
    this.basePivot = new THREE.Group()
    this.basePivot.position.y = 0.98
    this.group.add(baseCyl)
    this.group.add(this.basePivot)

    const shoulderJoint = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), jointMat)
    shoulderJoint.castShadow = true
    this.shoulderPivot = new THREE.Group()
    this.shoulderPivot.position.y = CFG.robot.shoulderY
    this.shoulderPivot.add(shoulderJoint)
    this.basePivot.add(this.shoulderPivot)

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.13, CFG.robot.l1, 20),
      armMat
    )
    upper.position.y = CFG.robot.l1 / 2
    upper.castShadow = true
    this.shoulderPivot.add(upper)

    this.wristTilt = new THREE.Group()
    this.wristTilt.position.y = CFG.robot.l1
    const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 16), jointMat)
    elbowJoint.castShadow = true
    this.wristTilt.add(elbowJoint)

    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.11, CFG.robot.l2, 20),
      armMat
    )
    forearm.position.y = CFG.robot.l2 / 2
    forearm.castShadow = true
    this.wristTilt.add(forearm)
    this.shoulderPivot.add(this.wristTilt)

    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), jointMat)
    wrist.position.y = CFG.robot.l2
    wrist.castShadow = true
    this.wristTilt.add(wrist)

    this.wristRoll = new THREE.Group()
    this.wristRoll.position.y = CFG.robot.l2
    this.wristTilt.add(this.wristRoll)

    const hang = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, CFG.robot.hang, 16),
      jointMat
    )
    hang.position.y = -CFG.robot.hang / 2
    hang.castShadow = true
    this.wristRoll.add(hang)

    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.1, 0.24), armMat)
    palm.position.y = -CFG.robot.hang - 0.05
    palm.castShadow = true
    this.wristRoll.add(palm)

    const fingerGeo = new THREE.BoxGeometry(0.06, 0.3, 0.16)
    const fingerMat = new THREE.MeshStandardMaterial({
      color: 0x9aa7bd,
      metalness: 0.85,
      roughness: 0.25
    })
    this.fingerL = new THREE.Mesh(fingerGeo, fingerMat)
    this.fingerR = new THREE.Mesh(fingerGeo, fingerMat)
    this.fingerL.position.set(-HALF_OPEN, -CFG.robot.hang - 0.24, 0)
    this.fingerR.position.set(HALF_OPEN, -CFG.robot.hang - 0.24, 0)
    this.fingerL.castShadow = true
    this.fingerR.castShadow = true
    this.wristRoll.add(this.fingerL, this.fingerR)

    this.statusLightMat = new THREE.MeshStandardMaterial({
      color: 0x35e07a,
      emissive: 0x17c964,
      emissiveIntensity: 0.9
    })
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), this.statusLightMat)
    light.position.set(0.36, 0.78, 0)
    this.group.add(light)

    scene.add(this.group)
    this.applyPose()
  }

  enqueueMove(x: number, y: number, z: number, roll: number, speed = MOVE_SPEED) {
    this.steps.push({ kind: 'move', x, y, z, roll, speed })
  }

  enqueueGrip(): Promise<void> {
    return new Promise((resolve) => {
      this.steps.push({ kind: 'grip' })
      this.gripResolve = resolve
    })
  }

  enqueueRelease(onRelease: (() => void) | null = null) {
    this.steps.push({ kind: 'release', onRelease })
  }

  isIdle() {
    return this.steps.length === 0 && this.current === null && this.action === null
  }

  setStatus(running: boolean, warning = false) {
    if (warning) {
      this.statusLightMat.color.setHex(0xff4d57)
      this.statusLightMat.emissive.setHex(0xe5323d)
    } else if (running) {
      this.statusLightMat.color.setHex(0x35e07a)
      this.statusLightMat.emissive.setHex(0x17c964)
    } else {
      this.statusLightMat.color.setHex(0x8a93a6)
      this.statusLightMat.emissive.setHex(0x3a4252)
    }
  }

  holdProduct(obj: THREE.Object3D) {
    this.wristRoll.attach(obj)
  }

  releaseProduct(obj: THREE.Object3D) {
    this.scene.attach(obj)
  }

  getTCPWorld(target: THREE.Vector3) {
    return target.set(
      this.group.position.x + this.tcp.x,
      this.tcp.y,
      this.group.position.z + this.tcp.z
    )
  }

  reset() {
    this.steps = []
    this.current = null
    this.action = null
    this.actionTimer = 0
    this.tcp.set(...READY)
    this.from.copy(this.tcp)
    this.roll = 0
    this.targetRoll = 0
    this.fingerOpen = HALF_OPEN
    this.fingerL.position.x = -HALF_OPEN
    this.fingerR.position.x = HALF_OPEN
    this.applyPose()
  }

  update(dt: number) {
    this.busy = !this.isIdle()
    if (this.action) {
      this.actionTimer -= dt
      const t = THREE.MathUtils.clamp(1 - this.actionTimer / ACTION_TIME, 0, 1)
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      if (this.action === 'grip') {
        this.fingerOpen = THREE.MathUtils.lerp(HALF_OPEN, HALF_CLOSE, e)
      } else {
        this.fingerOpen = THREE.MathUtils.lerp(HALF_CLOSE, HALF_OPEN, e)
        if (t >= 1 && this.releaseCb) {
          const cb = this.releaseCb
          this.releaseCb = null
          cb()
        }
      }
      this.fingerL.position.x = -this.fingerOpen
      this.fingerR.position.x = this.fingerOpen
      if (this.actionTimer <= 0) {
        if (this.action === 'grip' && this.gripResolve) {
          const resolve = this.gripResolve
          this.gripResolve = null
          resolve()
        }
        this.action = null
      }
      return
    }

    if (!this.current) {
      const next = this.steps.shift()
      if (!next) return
      if (next.kind === 'grip') {
        this.action = 'grip'
        this.actionTimer = ACTION_TIME
        return
      }
      if (next.kind === 'release') {
        this.action = 'release'
        this.actionTimer = ACTION_TIME
        this.releaseCb = next.onRelease
        return
      }
      this.current = next
      this.from.copy(this.tcp)
      this.fromRoll = normalizeAngle(this.roll)
      this.targetRoll = next.roll
      this.rollDelta = angleDelta(this.fromRoll, this.targetRoll)
    }

    const target = new THREE.Vector3(this.current.x, this.current.y, this.current.z)
    const remaining = this.tcp.distanceTo(target)
    const step = remaining < 1e-5 ? 1 : Math.min(1, (this.current.speed * dt) / remaining)
    this.tcp.lerp(target, step)
    const total = this.from.distanceTo(target)
    const progressed = this.from.distanceTo(this.tcp)
    const rollT = total < 1e-5 ? 1 : THREE.MathUtils.clamp(progressed / total, 0, 1)
    this.roll = this.fromRoll + this.rollDelta * rollT
    this.applyPose()
    if (step >= 1) {
      this.tcp.copy(target)
      this.roll = this.targetRoll
      this.current = null
      this.applyPose()
    }
  }

  private applyPose() {
    const ox = this.tcp.x - CFG.robot.x
    const oz = this.tcp.z - CFG.robot.z
    const wristY = this.tcp.y + CFG.robot.hang + 0.4
    const dy = wristY - CFG.robot.shoulderY
    const rhoH = Math.hypot(ox, oz)
    const rho = Math.hypot(rhoH, dy)
    const r = THREE.MathUtils.clamp(
      rho,
      Math.abs(CFG.robot.l1 - CFG.robot.l2) + 0.001,
      CFG.robot.l1 + CFG.robot.l2 - 0.001
    )

    const baseYaw = Math.atan2(ox, oz)
    const elbow = Math.acos(
      THREE.MathUtils.clamp(
        (CFG.robot.l1 ** 2 + CFG.robot.l2 ** 2 - r * r) /
          (2 * CFG.robot.l1 * CFG.robot.l2),
        -1,
        1
      )
    )
    const alpha = Math.atan2(dy, rhoH)
    const betaAngle = Math.acos(
      THREE.MathUtils.clamp(
        (CFG.robot.l1 ** 2 + r * r - CFG.robot.l2 ** 2) /
          (2 * CFG.robot.l1 * r),
        -1,
        1
      )
    )
    const shoulder = alpha + betaAngle

    this.basePivot.rotation.y = baseYaw
    this.shoulderPivot.rotation.x = shoulder
    this.wristTilt.rotation.x = -elbow - shoulder
    this.wristRoll.rotation.y = this.roll
  }
}

function normalizeAngle(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

function angleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}
