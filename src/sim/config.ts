export const CFG = {
  beltHeight: 0.9,
  beltWidth: 1.0,

  convA: { x: 0, z: 0, start: -8, end: 8, length: 16 },
  convB: { x: 0, z: 3, start: -8, end: 8, length: 16 },

  machine: { x: -4.6, length: 2.2 },
  inspect: { x: 2.5, length: 2.0 },

  pickA: { x: 6.2, z: 0 },
  dropB: { x: 6.2, z: 3 },
  decision: { x: -1.5, z: 3 },

  r1: { x: 6.2, z: 1.5 },
  r2: { x: -1.5, z: 4.6 },

  rejectBin: { x: -3.2, z: 6.2 },
  goodEnd: { x: -7.9, z: 3 },

  product: { w: 0.5, h: 0.36, d: 0.5 },
  spacing: 1.0,
  defectRate: 0.25,
  spawnInterval: 3.2,
  beltSpeed: 1.1,
  processTime: 2.6,
  inspectTime: 1.8,

  tcpGrab: 1.36,
  approachLift: 1.9,
  transitLift: 2.5,
  binLift: 2.1,
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
