import * as THREE from 'three'
import { CFG, clamp, easeInOut } from './config'
import { FactoryScene } from './scene'
import { Conveyor } from './conveyor'
import { Product } from './product'
import { ProcessingMachine, InspectionStation, Bin } from './stations'
import { RobotArm } from './robot'
import type { DeviceStatus, Snapshot } from './types'

type ItemState =
  | 'onA'
  | 'atMachine'
  | 'processing'
  | 'postMachine'
  | 'atPickA'
  | 'carriedR1'
  | 'onB'
  | 'atInspect'
  | 'inspecting'
  | 'postInspect'
  | 'atDecision'
  | 'toGoodEnd'
  | 'carriedR2'
  | 'done'

interface Item {
  product: Product
  bad: boolean
  state: ItemState
  x: number
  spin: number
}

interface FreeTween {
  product: Product
  from: THREE.Vector3
  to: THREE.Vector3
  rotFrom: number
  rotTo: number
  t: number
  dur: number
  recycle: boolean
  drop: boolean
}

interface HeldSpin {
  item: Item
  from: number
  to: number
  t: number
  dur: number
  resolve: () => void
}

const BELT_Y = CFG.beltHeight + CFG.product.h / 2
const M_CENTER = CFG.machine.x
const M_ENTRY = M_CENTER - CFG.machine.length / 2 - 0.1
const M_EXIT = M_CENTER + CFG.machine.length / 2
const I_CENTER = CFG.inspect.x
const I_ENTRY = I_CENTER + CFG.inspect.length / 2 + 0.1
const I_EXIT = I_CENTER - CFG.inspect.length / 2
const PICK = CFG.pickA.x
const DROP = CFG.dropB.x
const DECISION = CFG.decision.x
const GOOD_END = CFG.goodEnd.x

export class Simulation {
  readonly scene: FactoryScene
  private convA: Conveyor
  private convB: Conveyor
  private machine: ProcessingMachine
  private inspect: InspectionStation
  private r1: RobotArm
  private r2: RobotArm
  private rejectBin: Bin
  private goodBin: Bin

  private items: Item[] = []
  private free: FreeTween[] = []
  private spins: HeldSpin[] = []
  private pool: Product[] = []

  running = true
  speed = 1
  defectRate = CFG.defectRate
  private spawnTimer = 0.6
  private machineTimer = 0
  private inspectTimer = 0
  private r1Busy = false
  private r2Busy = false
  private simClock = 0
  private eventSeq = 0
  private stats = { total: 0, good: 0, bad: 0 }
  private eventsLog: Snapshot['events'] = []
  onSnapshot: ((s: Snapshot) => void) | null = null
  private snapAccum = 0

  constructor(container: HTMLElement) {
    this.scene = new FactoryScene(container)
    this.convA = new Conveyor(0, 0, 16, '输送带 A · 加工线（→）', '#ffd98a', 1)
    this.convB = new Conveyor(0, 3, 16, '输送带 B · 质检线（←）', '#8fd0ff', -1)
    this.machine = new ProcessingMachine()
    this.inspect = new InspectionStation()
    this.r1 = new RobotArm(CFG.r1.x, CFG.r1.z, 0xff9d2e)
    this.r2 = new RobotArm(CFG.r2.x, CFG.r2.z, 0x2fb7ff)
    this.rejectBin = new Bin(CFG.rejectBin.x, CFG.rejectBin.z, 0xff4d5e, '异常品区', '#ff9aa4')
    this.goodBin = new Bin(CFG.goodEnd.x, CFG.goodEnd.z, 0x22e06a, '良品区', '#8affb5')

    this.scene.root.add(
      this.convA.group,
      this.convB.group,
      this.machine.group,
      this.inspect.group,
      this.r1.group,
      this.r2.group,
      this.rejectBin.group,
      this.goodBin.group,
    )

    for (let i = 0; i < 26; i++) {
      const p = new Product()
      p.group.visible = false
      this.pool.push(p)
      this.scene.root.add(p.group)
    }

    this.scene.onTick((dt) => this.update(dt))
    this.addEvent('info', '系统启动，流水线开始运行')
  }

  private addEvent(kind: Snapshot['events'][number]['kind'], text: string) {
    const m = Math.floor(this.simClock / 60)
    const s = Math.floor(this.simClock % 60)
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    this.eventsLog.unshift({ id: ++this.eventSeq, time, kind, text })
    if (this.eventsLog.length > 8) this.eventsLog.pop()
  }

  private acquire(): Product {
    const p = this.pool.pop()
    if (p) {
      p.reset()
      return p
    }
    const created = new Product()
    this.scene.root.add(created.group)
    return created
  }

  private recycle(product: Product, hidden: boolean) {
    if (hidden) {
      product.group.visible = false
      this.pool.push(product)
    }
  }

  private update(dtReal: number) {
    const dt = this.running ? dtReal * this.speed : 0
    this.simClock += dt
    this.convA.running = this.running
    this.convB.running = this.running
    this.convA.update(dtReal)
    this.convB.update(dtReal)
    this.machine.update(dtReal, 1 - this.machineTimer / CFG.processTime)
    this.inspect.update(dtReal, 1 - this.inspectTimer / CFG.inspectTime)
    this.r1.update(dt)
    this.r2.update(dt)
    this.updateSpins(dt)

    if (this.running) {
      this.handleSpawn(dt)
      this.moveItems(dt)
      this.updateStations(dt)
      this.startJobs()
    }
    this.updateFree(dt)

    this.snapAccum += dtReal
    if (this.snapAccum >= 0.2) {
      this.snapAccum = 0
      this.emitSnapshot()
    }
  }

  private handleSpawn(dt: number) {
    this.spawnTimer -= dt
    if (this.spawnTimer > 0) return
    this.spawnTimer = CFG.spawnInterval / this.speed
    const blocked = this.items.some(
      (it) =>
        it.state !== 'done' &&
        (it.state === 'onA' || it.state === 'atMachine' || it.state === 'processing') &&
        it.x < CFG.convA.start + 2.2,
    )
    if (blocked) return
    const product = this.acquire()
    const item: Item = {
      product,
      bad: Math.random() < this.defectRate,
      state: 'onA',
      x: CFG.convA.start - 0.4,
      spin: 0,
    }
    product.group.position.set(item.x, BELT_Y, 0)
    this.items.push(item)
  }

  private machineBusy() {
    return this.items.some((it) => it.state === 'atMachine' || it.state === 'processing')
  }

  private inspectBusy() {
    return this.items.some((it) => it.state === 'atInspect' || it.state === 'inspecting')
  }

  private blockedBy(it: Item, states: ItemState[], gap: number, ahead: 1 | -1): boolean {
    return this.items.some(
      (o) =>
        o !== it &&
        states.includes(o.state) &&
        Math.sign(o.x - it.x) === ahead &&
        Math.abs(o.x - it.x) < gap,
    )
  }

  private moveItems(dt: number) {
    const v = CFG.beltSpeed
    for (const it of this.items) {
      it.product.group.rotation.y = it.spin
      switch (it.state) {
        case 'onA': {
          const gate = this.machineBusy() && it.x >= M_ENTRY - CFG.spacing * 0.5
          const block = this.blockedBy(
            it,
            ['onA', 'postMachine', 'atPickA'],
            CFG.spacing,
            1,
          )
          if (!gate && !block) it.x += v * dt
          it.product.group.position.x = it.x
          if (it.x >= M_ENTRY && !this.machineBusy()) {
            it.state = 'atMachine'
            it.x = M_CENTER
            it.product.group.position.x = M_CENTER
          }
          break
        }
        case 'postMachine': {
          const block = this.blockedBy(it, ['postMachine', 'atPickA'], CFG.spacing, 1)
          if (!block) it.x += v * dt
          it.product.group.position.x = it.x
          if (it.x >= PICK) {
            it.state = 'atPickA'
            it.x = PICK
            it.product.group.position.x = PICK
          }
          break
        }
        case 'onB': {
          const gate = this.inspectBusy() && it.x <= I_ENTRY + CFG.spacing * 0.5
          const block = this.blockedBy(
            it,
            ['onB', 'atInspect', 'inspecting', 'postInspect', 'toGoodEnd'],
            CFG.spacing,
            -1,
          )
          if (!gate && !block) it.x -= v * dt
          it.product.group.position.set(it.x, BELT_Y, CFG.convB.z)
          if (it.x <= I_ENTRY && !this.inspectBusy()) {
            it.state = 'atInspect'
            it.x = I_CENTER
            it.product.group.position.x = I_CENTER
          }
          break
        }
        case 'postInspect': {
          const block = this.blockedBy(
            it,
            ['postInspect', 'atDecision', 'toGoodEnd'],
            CFG.spacing,
            -1,
          )
          if (!block) it.x -= v * dt
          it.product.group.position.set(it.x, BELT_Y, CFG.convB.z)
          if (it.x <= DECISION) {
            it.x = DECISION
            it.product.group.position.x = DECISION
            if (it.product.quality === 'bad') it.state = 'atDecision'
            else it.state = 'toGoodEnd'
          }
          break
        }
        case 'toGoodEnd': {
          const block = this.blockedBy(it, ['toGoodEnd'], CFG.spacing, -1)
          if (!block) it.x -= v * dt
          it.product.group.position.set(it.x, BELT_Y, CFG.convB.z)
          if (it.x <= GOOD_END) {
            it.x = GOOD_END
            it.product.group.position.x = GOOD_END
            this.sendGood(it)
          }
          break
        }
        case 'atPickA':
          it.product.group.position.x = PICK
          break
        case 'atDecision':
          it.product.group.position.set(DECISION, BELT_Y, CFG.convB.z)
          break
        case 'atMachine':
        case 'processing':
          it.product.group.position.set(M_CENTER, BELT_Y, 0)
          break
        case 'atInspect':
        case 'inspecting':
          it.product.group.position.set(I_CENTER, BELT_Y, CFG.convB.z)
          break
        default:
          break
      }
    }
  }

  private updateStations(dt: number) {
    if (this.machine.state === 'running') {
      this.machineTimer -= dt
      if (this.machineTimer <= 0) {
        this.machine.state = 'idle'
        const it = this.items.find((q) => q.state === 'processing')
        if (it) {
          it.state = 'postMachine'
          it.x = M_EXIT
          it.product.group.position.x = M_EXIT
        }
      }
    } else {
      const it = this.items.find((q) => q.state === 'atMachine')
      if (it) {
        it.state = 'processing'
        this.machine.state = 'running'
        this.machineTimer = CFG.processTime
        this.addEvent('info', '产品进入加工设备')
      }
    }

    if (this.inspect.state === 'running') {
      this.inspectTimer -= dt
      if (this.inspectTimer <= 0) {
        this.inspect.state = 'idle'
        const it = this.items.find((q) => q.state === 'inspecting')
        if (it) {
          it.product.setQuality(it.bad ? 'bad' : 'good')
          it.state = 'postInspect'
          it.x = I_EXIT
          it.product.group.position.x = I_EXIT
          this.addEvent(it.bad ? 'bad' : 'good', it.bad ? '检出不良品' : '质检合格')
        }
      }
    } else {
      const it = this.items.find((q) => q.state === 'atInspect')
      if (it) {
        it.state = 'inspecting'
        this.inspect.state = 'running'
        this.inspectTimer = CFG.inspectTime
      }
    }
  }

  private startJobs() {
    if (!this.r1Busy) {
      const it = this.items.find((q) => q.state === 'atPickA')
      if (it) {
        this.r1Busy = true
        it.state = 'carriedR1'
        void this.runR1(it).then(() => {
          this.r1Busy = false
        })
      }
    }
    if (!this.r2Busy) {
      const it = this.items.find((q) => q.state === 'atDecision')
      if (it) {
        this.r2Busy = true
        it.state = 'carriedR2'
        void this.runR2(it).then(() => {
          this.r2Busy = false
        })
      }
    }
  }

  private spinHeld(item: Item, delta: number, dur = 0.55) {
    return new Promise<void>((resolve) => {
      this.spins.push({
        item,
        from: item.spin,
        to: item.spin + delta,
        t: 0,
        dur,
        resolve,
      })
    })
  }

  private updateSpins(dt: number) {
    for (let i = this.spins.length - 1; i >= 0; i--) {
      const sp = this.spins[i]
      sp.t += dt
      const k = easeInOut(clamp(sp.t / sp.dur, 0, 1))
      sp.item.spin = sp.from + (sp.to - sp.from) * k
      sp.item.product.group.rotation.y = sp.item.spin
      if (sp.t >= sp.dur) {
        sp.item.spin = sp.to
        this.spins.splice(i, 1)
        sp.resolve()
      }
    }
  }

  private attach(item: Item, robot: RobotArm) {
    robot.socket.attach(item.product.group)
  }

  private detach(item: Item) {
    this.scene.root.attach(item.product.group)
  }

  private async runR1(item: Item) {
    const pick = new THREE.Vector3(PICK, CFG.transitLift, CFG.pickA.z)
    const drop = new THREE.Vector3(DROP, CFG.transitLift, CFG.convB.z)
    await this.r1.open('前往取料')
    await this.r1.move(pick, 'R1 取料：定位')
    pick.y = CFG.tcpGrab
    await this.r1.move(pick, 'R1 取料：下降')
    this.attach(item, this.r1)
    await this.r1.close('R1 夹紧工件')
    pick.y = CFG.approachLift
    await this.r1.move(pick, 'R1 抓取：抬升')
    await this.spinHeld(item, Math.PI / 2, 0.45)
    pick.y = CFG.transitLift
    await this.r1.move(pick, 'R1 搬运：抬臂')
    await this.r1.move(drop, 'R1 搬运：旋转跨越')
    await this.spinHeld(item, -Math.PI / 2, 0.45)
    drop.y = CFG.approachLift
    await this.r1.move(drop, 'R1 放料：下降')
    drop.y = CFG.tcpGrab
    await this.r1.move(drop, 'R1 放料：就位')
    this.detach(item)
    item.spin = 0
    item.product.group.rotation.y = 0
    item.x = DROP
    item.state = 'onB'
    item.product.group.position.set(DROP, BELT_Y, CFG.convB.z)
    await this.r1.open('R1 松开放置')
    drop.y = CFG.approachLift
    await this.r1.move(drop, 'R1 抬臂离位')
    await this.r1.home()
    this.addEvent('info', '机械臂 R1 完成抓取、旋转与放置')
  }

  private async runR2(item: Item) {
    const pick = new THREE.Vector3(DECISION, CFG.transitLift, CFG.decision.z)
    await this.r2.open('前往分拣')
    await this.r2.move(pick, 'R2 分拣：定位')
    pick.y = CFG.tcpGrab
    await this.r2.move(pick, 'R2 分拣：下降')
    this.attach(item, this.r2)
    await this.r2.close('R2 抓取不良品')
    pick.y = CFG.approachLift
    await this.r2.move(pick, 'R2 抬升')
    await this.spinHeld(item, Math.PI, 0.55)
    pick.y = CFG.transitLift
    await this.r2.move(pick, 'R2 转运不良品')

    const overflow = this.rejectBin.full
    const slot = overflow
      ? new THREE.Vector3(CFG.rejectBin.x, 1.5, CFG.rejectBin.z)
      : this.rejectBin.nextSlot()
    const target = new THREE.Vector3(slot.x, CFG.binLift, slot.z)
    await this.r2.move(target, 'R2 移至异常区')
    target.y = slot.y + 0.3
    await this.r2.move(target, 'R2 下放')
    this.detach(item)
    await this.r2.open('R2 释放不良品')
    this.stats.total++
    this.stats.bad++
    this.addEvent('bad', overflow ? '异常区已满，不良品被回收' : '不良品已分拣到异常区')
    this.freeFall(item, slot, overflow)

    target.y = CFG.binLift
    await this.r2.move(target, 'R2 抬臂')
    await this.r2.home()
  }

  private freeFall(item: Item, target: THREE.Vector3, recycle: boolean) {
    this.free.push({
      product: item.product,
      from: item.product.group.position.clone(),
      to: target.clone(),
      rotFrom: item.spin,
      rotTo: item.spin + 0.35,
      t: 0,
      dur: 0.35,
      recycle,
      drop: true,
    })
    item.state = 'done'
  }

  private sendGood(item: Item) {
    const overflow = this.goodBin.full
    const slot = overflow
      ? new THREE.Vector3(GOOD_END - 0.4, 1.2, CFG.convB.z)
      : this.goodBin.nextSlot()
    this.free.push({
      product: item.product,
      from: new THREE.Vector3(GOOD_END, BELT_Y, CFG.convB.z),
      to: slot,
      rotFrom: 0,
      rotTo: 0.2,
      t: 0,
      dur: 0.6,
      recycle: overflow,
      drop: false,
    })
    item.state = 'done'
    this.stats.total++
    this.stats.good++
    this.addEvent('good', overflow ? '良品区已满，产品被回收' : '良品进入良品区')
  }

  private updateFree(dt: number) {
    for (let i = this.free.length - 1; i >= 0; i--) {
      const f = this.free[i]
      f.t += dt
      const k = easeInOut(clamp(f.t / f.dur, 0, 1))
      const pos = f.from.clone().lerp(f.to, k)
      if (f.drop) pos.y -= Math.sin(k * Math.PI) * 0.12
      f.product.group.position.copy(pos)
      f.product.group.rotation.y = f.rotFrom + (f.rotTo - f.rotFrom) * k
      if (f.t >= f.dur) {
        this.recycle(f.product, f.recycle)
        this.free.splice(i, 1)
      }
    }
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i]
      if (it.state === 'done' && !this.free.some((f) => f.product === it.product)) {
        this.items.splice(i, 1)
      }
    }
  }

  private emitSnapshot() {
    if (!this.onSnapshot) return
    const m = Math.floor(this.simClock / 60)
    const s = Math.floor(this.simClock % 60)
    const beltMoving = this.running
    const devices: DeviceStatus[] = [
      {
        name: '输送带 A',
        state: beltMoving ? 'running' : 'idle',
        detail: beltMoving ? `运行中 ${CFG.beltSpeed.toFixed(1)} m/s` : '已停止',
      },
      {
        name: '加工设备',
        state: this.machine.state === 'running' ? 'busy' : 'idle',
        detail:
          this.machine.state === 'running'
            ? `加工中 ${Math.max(0, this.machineTimer).toFixed(1)}s`
            : '待机上料',
      },
      {
        name: '机械臂 R1',
        state: this.r1Busy ? 'busy' : 'idle',
        detail: this.r1.action,
      },
      {
        name: '质检工位',
        state: this.inspect.state === 'running' ? 'busy' : 'idle',
        detail:
          this.inspect.state === 'running'
            ? `检测中 ${Math.max(0, this.inspectTimer).toFixed(1)}s`
            : '待检',
      },
      {
        name: '机械臂 R2',
        state: this.r2Busy ? 'busy' : 'idle',
        detail: this.r2.action,
      },
      {
        name: '输送带 B',
        state: beltMoving ? 'running' : 'idle',
        detail: beltMoving ? `运行中 ${CFG.beltSpeed.toFixed(1)} m/s` : '已停止',
      },
    ]
    this.onSnapshot({
      running: this.running,
      time: `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      total: this.stats.total,
      good: this.stats.good,
      bad: this.stats.bad,
      yieldRate: this.stats.total ? (this.stats.good / this.stats.total) * 100 : 100,
      speed: this.speed,
      defectRate: this.defectRate * 100,
      beltA: beltMoving,
      beltB: beltMoving,
      devices,
      events: this.eventsLog,
    })
  }

  setRunning(v: boolean) {
    this.running = v
    if (v) this.addEvent('warn', '流水线恢复运行')
    else this.addEvent('warn', '流水线已暂停')
  }

  setSpeed(v: number) {
    this.speed = v
  }

  setDefectRate(v: number) {
    this.defectRate = v
  }

  reset() {
    for (const it of this.items) {
      it.product.group.visible = false
      this.pool.push(it.product)
    }
    this.items = []
    for (const f of this.free) {
      f.product.group.visible = false
      this.pool.push(f.product)
    }
    this.free = []
    this.spins = []
    this.r1.reset()
    this.r2.reset()
    this.machine.state = 'idle'
    this.inspect.state = 'idle'
    this.machineTimer = 0
    this.inspectTimer = 0
    this.r1Busy = false
    this.r2Busy = false
    this.spawnTimer = 0.6
    this.simClock = 0
    this.stats = { total: 0, good: 0, bad: 0 }
    this.rejectBin.reset()
    this.goodBin.reset()
    this.eventsLog = []
    this.addEvent('info', '系统已复位，重新开始生产')
  }

  get domElement() {
    return this.scene.renderer.domElement
  }

  get camera() {
    return this.scene.camera
  }

  resize(w: number, h: number) {
    this.scene.resize(w, h)
  }

  dispose() {
    this.scene.dispose()
    this.scene.renderer.dispose()
    this.scene.renderer.domElement.remove()
  }
}
