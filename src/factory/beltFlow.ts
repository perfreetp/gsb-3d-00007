import { CFG } from './config'
import type { SimRuntime } from './simData'

export function advanceBeltA(rt: SimRuntime, dt: number) {
  const list = rt.products
    .filter((p) => p.state === 'onA' || p.state === 'afterProcess')
    .sort((a, b) => b.group.position.z - a.group.position.z)

  for (const p of list) {
    let stop: number = CFG.beltA.pickZ
    if (p.state === 'onA' && p.group.position.z < CFG.beltA.processZ - 0.01) {
      stop = CFG.beltA.processZ
    }
    const ahead = list.find(
      (q) =>
        q !== p &&
        q.group.position.z > p.group.position.z + 0.001 &&
        Math.abs(q.group.position.x - p.group.position.x) < CFG.beltWidth
    )
    if (ahead) stop = Math.min(stop, ahead.group.position.z - CFG.gap)

    if (p.group.position.z < stop - 0.005) {
      p.group.position.z = Math.min(stop, p.group.position.z + CFG.speedA * dt)
    }

    if (
      p.state === 'onA' &&
      !rt.processorBusy &&
      Math.abs(p.group.position.z - CFG.beltA.processZ) < 0.02
    ) {
      p.state = 'processing'
      p.setMark('process')
      rt.processorBusy = true
      rt.processing = p
      rt.processRemaining = CFG.processDuration
    }
  }
}

export function advanceBeltB(rt: SimRuntime, dt: number) {
  const list = rt.products
    .filter((p) => p.state === 'onB')
    .sort((a, b) => b.group.position.z - a.group.position.z)

  for (const p of list) {
    const scanned = p.group.position.z >= CFG.beltB.scanZ - 0.02
    let stop: number
    if (!scanned) {
      stop = CFG.beltB.scanZ
    } else if (p.defective) {
      stop = CFG.beltB.defectZ
    } else {
      stop = CFG.beltB.endZ
    }

    const ahead = list.find(
      (q) =>
        q !== p &&
        q.group.position.z > p.group.position.z + 0.001 &&
        Math.abs(q.group.position.x - p.group.position.x) < CFG.beltWidth
    )
    if (ahead) stop = Math.min(stop, ahead.group.position.z - CFG.gap)

    if (p.group.position.z < stop - 0.005) {
      p.group.position.z = Math.min(stop, p.group.position.z + CFG.speedB * dt)
    }

    if (
      !scanned &&
      !rt.inspectorBusy &&
      Math.abs(p.group.position.z - CFG.beltB.scanZ) < 0.02
    ) {
      p.state = 'scanning'
      rt.inspectorBusy = true
      rt.scanning = p
      rt.scanRemaining = CFG.scanDuration
    }
  }
}
