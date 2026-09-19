import { CFG } from './config'
import { simState, pushEvent } from './simState'
import type { Product } from './Product'
import type { SimRuntime, SimComponents } from './simData'

function slotPosition(index: number, x: number, z: number): [number, number, number] {
  const col = index % 2
  const row = Math.floor(index / 2) % 2
  const layer = Math.floor(index / 4)
  return [
    x + (col - 0.5) * 0.62,
    CFG.beltTopY - 0.07 + CFG.productSize * layer + 0.01,
    z + (row - 0.5) * 0.62
  ]
}

export function startTransferJob(comp: SimComponents, rt: SimRuntime, p: Product) {
  rt.armJobActive = true
  const robot = comp.robot
  const px = p.group.position.x
  const pz = p.group.position.z
  p.state = 'carried'
  robot.holdProduct(p.group)

  robot.enqueueMove(px, CFG.liftY, pz, 0)
  robot.enqueueMove(px, CFG.gripY, pz, 0)
  void robot.enqueueGrip().then(() => {
    robot.enqueueMove(px, CFG.liftY, pz, 0)
    robot.enqueueMove(CFG.beltB.x, CFG.liftY, CFG.beltB.placeZ, Math.PI)
    robot.enqueueMove(CFG.beltB.x, CFG.gripY, CFG.beltB.placeZ, Math.PI)
    robot.enqueueRelease(() => {
      robot.releaseProduct(p.group)
      p.group.position.set(CFG.beltB.x, CFG.gripY, CFG.beltB.placeZ)
      p.state = 'onB'
      rt.armJobActive = false
    })
    robot.enqueueMove(CFG.beltB.x, CFG.liftY, CFG.beltB.placeZ, Math.PI)
  })
}

export function startDefectJob(comp: SimComponents, rt: SimRuntime, p: Product) {
  rt.armJobActive = true
  const robot = comp.robot
  const px = p.group.position.x
  const pz = p.group.position.z
  p.state = 'carried'
  robot.holdProduct(p.group)

  robot.enqueueMove(px, CFG.defectLiftY, pz, 0)
  robot.enqueueMove(px, CFG.gripY, pz, 0)
  void robot.enqueueGrip().then(() => {
    robot.enqueueMove(px, CFG.defectLiftY, pz, 0)
    robot.enqueueMove(CFG.bin.x, CFG.defectLiftY, CFG.bin.z, Math.PI)
    robot.enqueueMove(CFG.bin.x, CFG.binDropY, CFG.bin.z, Math.PI)
    robot.enqueueRelease(() => {
      robot.releaseProduct(p.group)
      p.group.position.set(CFG.bin.x, CFG.binDropY, CFG.bin.z)
      p.velY = 0
      p.state = 'falling'
      p.fallDone = () => settleDefect(comp, rt, p)
      rt.falling.add(p)
      simState.bad++
      simState.devices.inspector = 'warning'
      pushEvent(`产品 #${p.id} 判定为不良品，分拣至异常区`, 'bad')
      rt.armJobActive = false
    })
    robot.enqueueMove(CFG.bin.x, CFG.defectLiftY, CFG.bin.z, Math.PI)
  })
}

export function startGoodJob(comp: SimComponents, rt: SimRuntime, p: Product) {
  if (rt.palletCount >= CFG.palletCap) {
    removeProduct(comp, rt, p)
    return
  }
  rt.armJobActive = true
  const robot = comp.robot
  const px = p.group.position.x
  const pz = p.group.position.z
  const index = rt.palletCount
  p.state = 'carried'
  robot.holdProduct(p.group)

  const [sx, sy, sz] = slotPosition(index, CFG.pallet.x, CFG.pallet.z)
  robot.enqueueMove(px, CFG.liftY, pz, 0)
  robot.enqueueMove(px, CFG.gripY, pz, 0)
  void robot.enqueueGrip().then(() => {
    robot.enqueueMove(px, CFG.liftY, pz, 0)
    robot.enqueueMove(sx, Math.max(CFG.liftY, sy + 0.7), sz, Math.PI)
    robot.enqueueMove(sx, sy + 0.34, sz, Math.PI)
    robot.enqueueRelease(() => {
      robot.releaseProduct(p.group)
      p.group.position.set(sx, sy + 0.34, sz)
      p.velY = 0
      p.state = 'falling'
      p.fallDone = () => settleGood(rt, p, sy)
      rt.falling.add(p)
      rt.palletCount++
      simState.good++
      pushEvent(`产品 #${p.id} 质检合格，入库成品区`, 'good')
      rt.armJobActive = false
    })
    robot.enqueueMove(sx, Math.max(CFG.liftY, sy + 0.7), sz, Math.PI)
  })
}

function settleDefect(comp: SimComponents, rt: SimRuntime, p: Product) {
  rt.falling.delete(p)
  if (rt.binCount < CFG.binCap) {
    const index = rt.binCount++
    const col = index % 3
    const row = Math.floor(index / 3)
    p.group.position.set(
      CFG.bin.x + (col - 1) * 0.46 + (Math.random() - 0.5) * 0.08,
      CFG.productSize / 2 + 0.09,
      CFG.bin.z + (row - 1) * 0.46 + (Math.random() - 0.5) * 0.08
    )
    p.group.rotation.set(0, Math.random() * Math.PI, 0)
    p.state = 'settled'
  } else {
    removeProduct(comp, rt, p)
  }
}

function settleGood(rt: SimRuntime, p: Product, sy: number) {
  rt.falling.delete(p)
  p.group.position.y = sy
  p.group.rotation.set(0, 0, 0)
  p.state = 'settled'
}

export function updateFalling(comp: SimComponents, rt: SimRuntime, dt: number) {
  for (const p of [...rt.falling]) {
    p.velY -= 6.2 * dt
    p.group.position.y += p.velY * dt
    const floor = CFG.productSize / 2 + 0.09
    if (p.group.position.y <= floor) {
      p.group.position.y = floor
      p.velY = 0
      p.fallDone?.()
      p.fallDone = null
    }
  }
  void comp
}

export function removeProduct(comp: SimComponents, rt: SimRuntime, p: Product) {
  const idx = rt.products.indexOf(p)
  if (idx >= 0) rt.products.splice(idx, 1)
  comp.scene.remove(p.group)
  p.dispose()
}

export function clearAllProducts(comp: SimComponents, rt: SimRuntime) {
  for (const p of rt.products) {
    comp.scene.remove(p.group)
    p.dispose()
  }
  rt.products.length = 0
  rt.falling.clear()
}
