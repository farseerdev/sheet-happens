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

export const forRange = (min: number, max: number, callback: (i: number) => void) => {
    for (let i = min; i <= max; ++i) callback(i);
};

export const forSelectionColumns = (selection: Rectangle) => (callback: (i: number) => void) => {
    const [[left], [right]] = normalizeSelection(selection);
    forRange(left, right, callback);
};

export const forSelectionRows = (selection: Rectangle) => (callback: (i: number) => void) => {
    const [[, top], [, bottom]] = normalizeSelection(selection);
    forRange(top, bottom, callback);
};

const forToMap = <A extends Array<any>>(forLoop: (callback: (...args: A) => void) => void) => <B>(
    map: (...args: A) => B
) => {
    const out: B[] = [];
    forLoop((...args: A) => out.push(map(...args)));
    return out;
};

export const mapSelectionColumns = (selection: Rectangle) => forToMap(forSelectionColumns(selection));
export const mapSelectionRows = (selection: Rectangle) => forToMap(forSelectionRows(selection));

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

// Validate selections to avoid half-infinite anchor/head
export const validateSelection = (selection: Rectangle): Rectangle => {
    let [anchor, head] = selection;
    anchor = anchor.slice() as XY;
    head = head.slice() as XY;

    const min = minXY(anchor, head);
    if (min[0] === -1) anchor[0] = head[0] = -1;
    if (min[1] === -1) anchor[1] = head[1] = -1;

    return [anchor, head];
};

// Normalize rectangle to min/max pair
export const normalizeSelection = (selection: Rectangle): Rectangle => {
    const [anchor, head] = selection;
    return [minXY(anchor, head), maxXY(anchor, head)];
};

// Orient normalized rectangle to match existing orientation
export const orientSelection = (normalized: Rectangle, to: Rectangle): Rectangle => {
    const [[left, top], [right, bottom]] = normalized;

    const [anchor, head] = to;
    const [ax, ay] = anchor;
    const [hx, hy] = head;

    const swapX = (ax - hx || 1) * (right - left || 1) < 0;
    const swapY = (ay - hy || 1) * (bottom - top || 1) < 0;

    return [
        [swapX ? right : left, swapY ? bottom : top],
        [swapX ? left : right, swapY ? top : bottom],
    ];
};

// Clip rectangle to max range
export const clipSelection = (selection: Rectangle, max: XY): Rectangle => {
    const [anchor, head] = selection;
    return [minXY(anchor, max), minXY(head, max)];
};
