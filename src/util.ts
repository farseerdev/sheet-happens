export const tail = <T,>(list: T[]): T => list[list.length - 1];

export const clamp = (x: number, min: number, max: number) => Math.max(Math.min(max, x), min);

export const seq = (n: number, s: number = 0, d: number = 1): number[] => Array.from({ length: n }).map((_, i: number) => s + d * i);

export const isInRange = (x: number, min: number, max: number) => min <= x && x <= max;
export const isInRangeLeft = (x: number, min: number, max: number) => min <= x && x < max;
export const isInRangeRight = (x: number, min: number, max: number) => min < x && x <= max;
export const isInRangeCenter = (x: number, min: number, max: number) => min < x && x < max;

