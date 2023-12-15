import { XY, Rectangle } from './types';
import { clamp } from './util';

export const addXY = (a: XY, b: XY): XY => [a[0] + b[0], a[1] + b[1]];
export const subXY = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]];
export const mulXY = (a: XY, b: XY): XY => [a[0] * b[0], a[1] * b[1]];
export const maxXY = (a: XY, b: XY): XY => [Math.max(a[0], b[0]), Math.max(a[1], b[1])];
export const minXY = (a: XY, b: XY): XY => [Math.min(a[0], b[0]), Math.min(a[1], b[1])];
export const clampXY = (p: XY, min: XY, max: XY = [Infinity, Infinity]): XY => [
    clamp(p[0], min[0], max[0]),
    clamp(p[1], min[1], max[1]),
];

export const getDirectionStep = (direction: string): XY => {
    if (direction === 'left') return [-1, 0];
    if (direction === 'right') return [1, 0];
    if (direction === 'up') return [0, -1];
    if (direction === 'down') return [0, 1];
    return [0, 0];
};

export const isSameXY = (a: XY, b: XY) => a[0] === b[0] && a[1] === b[1];

export const isSameSelection = (a: Rectangle, b: Rectangle) => {
    const [a1, a2] = a;
    const [b1, b2] = b;
    return isSameXY(a1, b1) && isSameXY(a2, b2);
};

// Selection is infinite horizontally
export const isMaybeRowSelection = (selection: Rectangle) => {
    const [[left], [right]] = selection;
    return left === -1 && right === -1;
};

// Selection is infinite vertically
export const isMaybeColumnSelection = (selection: Rectangle) => {
    const [[, top], [, bottom]] = selection;
    return top === -1 && bottom === -1;
};

// Selection is ONLY infinite horizontally
export const isRowSelection = (selection: Rectangle) => {
    const [[left, top], [right, bottom]] = selection;
    return left === -1 && right === -1 && top !== -1 && bottom !== -1;
};

// Selection is ONLY infinite vertically
export const isColumnSelection = (selection: Rectangle) => {
    const [[left, top], [right, bottom]] = selection;
    return top === -1 && bottom === -1 && left !== -1 && right !== -1;
};

// Selection is not infinite
export const isCellSelection = (selection: Rectangle) => {
    const [[left, top], [right, bottom]] = selection;
    return left !== -1 && right !== -1 && top !== -1 && bottom !== -1;
};

// Selection is null
export const isEmptySelection = (selection: Rectangle) => {
    const [[left, top], [right, bottom]] = selection;
    return left === -1 && right === -1 && top === -1 && bottom === -1;
};

// Test cell inside selection (inclusive edges)
export const isPointInsideSelection = (selection: Rectangle, point: XY) => {
    const [[left, top], [right, bottom]] = normalizeSelection(selection);
    const [x, y] = point;
    return x >= left && x <= right && y >= top && y <= bottom;
};

// Normalize rectangle to min/max pair
export const normalizeSelection = (selection: Rectangle): Rectangle => {
    const [anchor, head] = selection;
    const [ax, ay] = anchor;
    const [hx, hy] = head;

    const left = Math.min(ax, hx);
    const right = Math.max(ax, hx);
    const top = Math.min(ay, hy);
    const bottom = Math.max(ay, hy);

    return [
        [left, top],
        [right, bottom],
    ];
};

// Orient normalized rectangle to match existing orientation
export const orientSelection = (normalized: Rectangle, to: Rectangle): Rectangle => {
    const [[left, top], [right, bottom]] = normalized;

    const [anchor, head] = to;
    const [ax, ay] = anchor;
    const [hx, hy] = head;

    const swapX = (ax - hx || 1) * (left - right || 1) < 0;
    const swapY = (ay - hy || 1) * (top - bottom || 1) < 0;

    return [
        [swapX ? right : left, swapY ? bottom : top],
        [swapX ? left : right, swapY ? top : bottom],
    ];
};
