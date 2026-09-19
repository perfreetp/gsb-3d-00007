import * as THREE from 'three'
import { clamp, easeInOut } from './config'

interface Pose {
  waist: number
  q1: number
  q2: number
}

interface Tween {
  kind: 'pose' | 'grip'
  from: number[]
  to: number[]
  t: number
  dur: number
  label: string
  resolve: () => void
}

export const ARM = {
  a1: 1.4,
  a2: 1.4,
  shoulderY: 0.64,
  wristOffset: 0.3,
  gripOpen: 0.21,
  gripClose: 0.135,
}

export class RobotArm {
  group = new THREE.Group()
  readonly socket = new THREE.Object3D()
  action = '待机'
  busy = false

  private waist = 0
  private q1 = Math.PI / 2
  private q2 = 0
  private grip = ARM.gripOpen

  private readonly waistNode = new THREE.Group()
  private readonly shoulderNode = new THREE.Group()
  private readonly elbowNode = new THREE.Group()
  private readonly wristNode = new THREE.Group()
  private readonly fingerL: THREE.Mesh
  private readonly fingerR: THREE.Mesh

  private tween: Tween | null = null
  private chain: Promise<void> = Promise.resolve()

  constructor(x: number, z: number, accent: number) {
    this.group.position.set(x, 0, z)

    const baseMat = new THREE.MeshStandardMaterial({ color: 0x33404f, metalness: 0.7, roughness: 0.4 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.56, 0.4, 24), baseMat)
    base.position.y = 0.2
    base.castShadow = true
    this.group.add(base)

    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.3, 20), baseMat)
    pillar.position.y = 0.5
    this.group.add(pillar)

    const accentMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.5, roughness: 0.35 })
    const armMat = new THREE.MeshStandardMaterial({ color: 0xd7e2ee, metalness: 0.35, roughness: 0.45 })
    const jointMat = new THREE.MeshStandardMaterial({ color: accent, metalness: 0.6, roughness: 0.3 })

    this.waistNode.position.y = 0.58
    this.group.add(this.waistNode)

    const turnDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.16, 20), accentMat)
    turnDisc.position.y = 0.02
    this.waistNode.add(turnDisc)

    this.shoulderNode.position.set(0, 0.06, 0)
    this.waistNode.add(this.shoulderNode)
    this.shoulderNode.add(new THREE.Mesh(new THREE.SphereGeometry(0.19, 20, 16), jointMat))

    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.2, ARM.a1, 0.26), armMat)
    upper.position.y = ARM.a1 / 2
    upper.castShadow = true
    this.shoulderNode.add(upper)

    this.elbowNode.position.set(0, ARM.a1, 0)
    this.shoulderNode.add(this.elbowNode)
    this.elbowNode.add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 20, 16), jointMat))

    const fore = new THREE.Mesh(new THREE.BoxGeometry(0.17, ARM.a2, 0.22), accentMat)
    fore.position.y = ARM.a2 / 2
    fore.castShadow = true
    this.elbowNode.add(fore)

    this.wristNode.position.set(0, ARM.a2, 0)
    this.elbowNode.add(this.wristNode)
    const wristBlock = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.26), armMat)
    wristBlock.position.y = -0.08
    this.wristNode.add(wristBlock)

    const fingerMat = new THREE.MeshStandardMaterial({ color: 0x9fb4c8, metalness: 0.8, roughness: 0.25 })
    this.fingerL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.13), fingerMat)
    this.fingerR = this.fingerL.clone()
    this.fingerL.castShadow = true
    this.fingerR.castShadow = true
    this.wristNode.add(this.fingerL, this.fingerR)

    this.socket.position.set(0, -ARM.wristOffset, 0)
    this.wristNode.add(this.socket)

    this.applyPose()
  }

  private schedule(task: (done: () => void) => void) {
    this.chain = this.chain.then(
      () =>
        new Promise<void>((resolve) => {
          task(() => {
            this.tween = null
            this.busy = false
            this.action = '待机'
            resolve()
          })
        }),
    )
    return this.chain
  }

  private solveIK(target: THREE.Vector3): Pose {
    const local = target.clone().sub(this.group.position)
    const waist = Math.atan2(local.z, local.x)
    const r = Math.hypot(local.x, local.z)
    const dy = local.y - ARM.shoulderY
    const c = clamp(
      (r * r + dy * dy - ARM.a1 * ARM.a1 - ARM.a2 * ARM.a2) / (2 * ARM.a1 * ARM.a2),
      -0.995,
      0.995,
    )
    const q2 = -Math.acos(c)
    const q1 =
      Math.atan2(dy, r) - Math.atan2(ARM.a2 * Math.sin(q2), ARM.a1 + ARM.a2 * Math.cos(q2))
    return { waist, q1, q2 }
  }

  move(target: THREE.Vector3, label: string, dur?: number) {
    const pose = this.solveIK(target)
    const dist = Math.hypot(
      target.x - this.group.position.x,
      target.z - this.group.position.z,
    )
    const time = dur ?? 0.45 + dist * 0.22
    return this.schedule((done) => {
      this.busy = true
      this.action = label
      this.tween = {
        kind: 'pose',
        from: [this.waist, this.q1, this.q2],
        to: [pose.waist, pose.q1, pose.q2],
        t: 0,
        dur: time,
        label,
        resolve: done,
      }
    })
  }

  setGrip(g: number, label: string) {
    return this.schedule((done) => {
      this.action = label
      this.tween = {
        kind: 'grip',
        from: [this.grip],
        to: [g],
        t: 0,
        dur: 0.2,
        label,
        resolve: done,
      }
    })
  }

  open(label = '张开夹爪') {
    return this.setGrip(ARM.gripOpen, label)
  }

  close(label = '夹紧工件') {
    return this.setGrip(ARM.gripClose, label)
  }

  homeTarget() {
    return new THREE.Vector3(this.group.position.x + 0.4, 2.2, this.group.position.z + 0.2)
  }

  home() {
    return this.move(this.homeTarget(), '返回原点', 0.55)
  }

  reset() {
    if (this.tween) {
      const resolve = this.tween.resolve
      this.tween = null
      resolve()
    }
    this.chain = Promise.resolve()
    this.busy = false
    this.action = '待机'
    const p = this.solveIK(this.homeTarget())
    this.waist = p.waist
    this.q1 = p.q1
    this.q2 = p.q2
    this.grip = ARM.gripOpen
    this.applyPose()
    this.chain = Promise.resolve()
  }

  update(dt: number) {
    const tw = this.tween
    if (!tw) return
    tw.t += dt
    const k = easeInOut(clamp(tw.t / tw.dur, 0, 1))
    if (tw.kind === 'pose') {
      this.waist = tw.from[0] + (tw.to[0] - tw.from[0]) * k
      this.q1 = tw.from[1] + (tw.to[1] - tw.from[1]) * k
      this.q2 = tw.from[2] + (tw.to[2] - tw.from[2]) * k
    } else {
      this.grip = tw.from[0] + (tw.to[0] - tw.from[0]) * k
    }
    this.applyPose()
    if (tw.t >= tw.dur) {
      const resolve = tw.resolve
      resolve()
    }
  }

  private applyPose() {
    this.waistNode.rotation.y = this.waist
    this.shoulderNode.rotation.z = this.q1 - Math.PI / 2
    this.elbowNode.rotation.z = this.q2
    this.wristNode.rotation.z = Math.PI / 2 - this.q1 - this.q2
    this.fingerL.position.x = -this.grip
    this.fingerR.position.x = this.grip
  }
}
