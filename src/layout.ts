import { XY, CellLayout, VisibleLayout, LayoutCache } from './types';
import { seq } from './util';
import { ORIGIN } from './constants';

const INITIAL_SIZE = 256;

// Local cell layout (virtualized with frozen columns/rows)
//
// - converts cell indices to (x, y) canvas pixels for any cell, including off-screen
// - maps (x, y) canvas pixels back to cell index for any visible cell
// - can also generate absolute, unscrolled offsets relative to (0,0) to drive scrolling
// - generates list of visible cols/rows in view
//
// Note that adjacent column indices are not necessarily adjacent, i.e. end of [i] != start of [i + 1].
export const makeCellLayout = (
    freeze: XY,
    indent: XY,
    offset: XY,

    columns: LayoutCache,
    rows: LayoutCache,
): CellLayout => {
    const [freezeX, freezeY] = freeze;
    const [indentX, indentY] = indent;
    const [offsetX, offsetY] = offset;

    const getIndentX = () => indentX;
    const getIndentY = () => indentY;

    // Origin for cell, frozen or relative
    const getBaseOriginFor = (index: number, freeze: number, offset: number) => {
        return index < freeze ? 0 : offset + freeze;
    };
    
    // Get visible pixel x of cell
    const columnToPixel = (column: number, anchor: number = 0): number => {
        const base = getBaseOriginFor(column, freezeX, offsetX);
        const relative = columns.getStart(column) - columns.getStart(base);
        const adjust = column < freezeX ? 0 : columns.getStart(freezeX) - columns.getStart(0);
        const size = column < 0 ? indentX : columns.getSize(column);

        return column < 0 ? 0 : indentX + relative + adjust + anchor * size;
    };

    // Get visible pixel y of cell
    const rowToPixel = (row: number, anchor: number = 0): number => {
        const base = getBaseOriginFor(row, freezeY, offsetY);
        const relative = rows.getStart(row) - rows.getStart(base);
        const adjust = row < freezeY ? 0 : rows.getStart(freezeY) - rows.getStart(0);
        const size = row < 0 ? indentY : rows.getSize(row);

        return row < 0 ? 0 : indentY + relative + adjust + anchor * size;
    };

    // Get visible pixel position of cell, offset with anchor [0..1, 0..1]
    const cellToPixel = (cell: XY, anchor: XY = ORIGIN): XY => {
        const [cellX, cellY] = cell;
        const [anchorX, anchorY] = anchor;
        return [
            columnToPixel(cellX, anchorX),
            rowToPixel(cellY, anchorY),
        ];
    };

    // Get absolute / unscrolled pixel x of cell
    const columnToAbsolute = (column: number, anchorX: number = 0): number => {
        const relative = columns.getStart(column);
        const size = column < 0 ? 0 : columns.getSize(column);

        return relative + anchorX * size;
    };

    // Get absolute / unscrolled pixel y of cell
    const rowToAbsolute = (row: number, anchorY: number = 0): number => {
        const relative = rows.getStart(row);
        const size = row < 0 ? 0 : rows.getSize(row);

        return relative + anchorY * size;
    };

    // Get absolute / unscrolled pixel position of cell, offset with anchor [0..1, 0..1]
    const cellToAbsolute = (cell: XY, anchor: XY = ORIGIN): XY => {
        const [cellX, cellY] = cell;
        const [anchorX, anchorY] = anchor;
        return [
            columnToAbsolute(cellX, anchorX),
            rowToAbsolute(cellY, anchorY),
        ];
    };

    // Lookup pixel X or Y in cell layout
    const pixelToIndex = (pixel: number, anchor: number, indent: number, freeze: number, offset: number, layout: LayoutCache) => {
        const relative = pixel - indent;
        if (relative < 0) return -1;

        const {getStart, lookupIndex} = layout;
        const frozen = getStart(freeze);
        if (relative < frozen) {
            return lookupIndex(relative, anchor);
        }
        else {
            const base = getStart(offset + freeze);
            const adjust = getStart(freeze) - getStart(0);
            return lookupIndex(base + relative - adjust, anchor);
        }
    };

    // Lookup pixel X or Y in cell layout (helpers)
    const pixelToColumn = (pixelX: number, anchorX: number = 0) => pixelToIndex(pixelX, anchorX, indentX, freezeX, offsetX, columns);
    const pixelToRow = (pixelY: number, anchorY: number = 0) => pixelToIndex(pixelY, anchorY, indentY, freezeY, offsetY, rows);

    // Lookup pixel XY in cell layout
    const pixelToCell = (pixel: XY, anchor: XY = ORIGIN): XY => {
        const [pixelX, pixelY] = pixel;
        const [anchorX, anchorY] = anchor;
        return [
            pixelToColumn(pixelX, anchorX),
            pixelToRow(pixelY, anchorY),
        ];
    };

    // Lookup absolute / unscrolled pixel X or Y in cell layout
    const absoluteToIndex = (pixel: number, anchor: number, layout: LayoutCache) => {
        if (pixel < 0) return -1;

        const {lookupIndex} = layout;
        return lookupIndex(pixel, anchor);
    };

    // Lookup absolute / unscrolled X or Y in cell layout (helpers)
    const absoluteToColumn = (pixelX: number, anchorX: number = 0) => absoluteToIndex(pixelX, anchorX, columns);
    const absoluteToRow = (pixelY: number, anchorY: number = 0) => absoluteToIndex(pixelY, anchorY, rows);

    // Lookup absolute / unscrolled XY in cell layout
    const absoluteToCell = (pixel: XY, anchor: XY = ORIGIN): XY => {
        const [pixelX, pixelY] = pixel;
        const [anchorX, anchorY] = anchor;
        return [
            absoluteToColumn(pixelX, anchorX),
            absoluteToRow(pixelY, anchorY),
        ];
    };

    // Get visible range of columns or rows
    const getVisibleIndices = (view: number, indent: number, freeze: number, offset: number, layout: LayoutCache) => {
        const indices = [...seq(freeze)];

        const {getStart} = layout;
        const relative = view - indent + getStart(offset);
        for (let i = offset + freeze; getStart(i) <= relative; ++i) {
            indices.push(i);
        }

        return indices;
    };

    // Get visible range for an XY viewport
    const getVisibleCells = (view: XY): VisibleLayout => {
        const [viewX, viewY] = view;
        return {
            columns: getVisibleIndices(viewX, indentX, freezeX, offsetX, columns),
            rows: getVisibleIndices(viewY, indentY, freezeY, offsetY, rows),
        };
    };

    const getVersion = () => columns.getVersion() + rows.getVersion();

    return {
        columnToPixel,
        rowToPixel,
        cellToPixel,

        columnToAbsolute,
        rowToAbsolute,
        cellToAbsolute,

        pixelToColumn,
        pixelToRow,
        pixelToCell,

        absoluteToColumn,
        absoluteToRow,
        absoluteToCell,

        getVisibleCells,
        getIndentX,
        getIndentY,

        getVersion,
    };
}

// Offset cache in 1 dimension.
//
// Allows O(1) queries of distance between any two points, once warmed up.
// Can do reverse lookup back to index with binary search, once warmed up.
//
// - caches sizer(i), each is only called once
// - offset[0] = 0
// - adds up offset[i] = sizer(0) + sizer(1) + ... + sizer(i - 1)
// - cache can be truncated during resizing ops at split
// - to replace sizer function, cache must be destroyed
export const makeLayoutCache = (
    sizer: (index: number) => number,
): LayoutCache => {
    const offsets = makeIntMap(INITIAL_SIZE);
    const sizes = makeIntMap(INITIAL_SIZE);

    let version = 0;
    offsets.set(0, 0);

    // Cache size lookup directly
    const getSize = (i: number): number => {
        if (i < 0) return 0;
        if (sizes.has(i)) return sizes.get(i)!;

        const size = sizer(i) || 0;
        sizes.set(i, size);
        return size;
    };

    // Cache offset sum recursively
    const getOffset = (i: number): number => {
        if (i < 0) return 0;
        if (offsets.has(i)) return offsets.get(i)!;

        let j = (offsets.tail() || 0);

        // Use a while loop to avoid stack overflow
        while (j < i) {
            const size = getSize(j);
            const offset = (offsets.get(j) || 0) + size;
            offsets.set(++j, offset);
        }

        return offsets.get(i)!;
    };

    // Boundary points
    const getStart = (i: number) => getOffset(i);
    const getEnd = (i: number) => getOffset(i + 1);

    // Reverse lookup from offset to index
    const lookupIndex = (x: number, anchor: number = 0) => {
        // Get end of offsets array
        let last = offsets.tail() || 0;

        // Extend cache if value exceeds current end
        while (getOffset(last) < x && getSize(last)) last += 64;

        // Do binary search for exact position
        let start = 0;
        let end = last;
        while (start < end) {
            let mid = start + Math.floor((end - start) / 2) + 1;
            let value = getOffset(mid) - (anchor ? anchor * getSize(mid - 1) : 0);
            if (value <= x) start = mid;
            else end = mid - 1;
        }

        return start;
    };

    const clearAfter = (index: number) => {
        index = Math.max(0, index);
        offsets.truncate(index);
        sizes.truncate(index);
        version++;
    };

    const setSizer = (s: (index: number) => number) => {
        sizer = s;
    };
    const getVersion = () => version;

    return {getSize, getStart, getEnd, getVersion, lookupIndex, setSizer, clearAfter};
};

// Fast map<integer, integer> that is mostly filled in from start to end.
// Elements are only removed by truncating all indices > n.
const makeIntMap = (initialSize: number = 128) => {
    let used: Uint8Array;
    let values: Uint32Array;
    let last = 0;

    const GROW = 1.2; // 20% growth at a time

    const allocate = (size: number) => {
        let newUsed = new Uint8Array(size);
        let newValues = new Uint32Array(size);
        if (used) copy(used, newUsed);
        if (values) copy(values, newValues);
        used = newUsed;
        values = newValues;
    };
    allocate(initialSize);

    const copy = (from: Uint8Array | Uint32Array, to: Uint8Array | Uint32Array) => {
        let n = Math.min(from.length, to.length);
        for (let i = 0; i < n; ++i) {
            to[i] = from[i];
        }
    };

    const ensure = (size: number) => {
        const l = values.length;
        const grow = Math.round(l * GROW);
        if (l < size) allocate(Math.max(grow, size));
    };

    const truncate = (size: number) => {
        const l = values.length;

        // Do nothing if smaller
        if (l < size) return;

        // If more than 20% bigger, shrink to exact size
        const shrink = Math.round(size * GROW);
        if (l > shrink) allocate(size);
        // Else zero out tail
        else for (let i = size; i < l; ++i) used[i] = 0;

        // Track last filled element
        last = Math.min(last, size);
        while (last > 0 && !used[last]) last--;
    };

    const getTail = () => used[last] ? last : null;

    const setValue = (i: number, value: number) => {
        ensure(i + 1);
        values[i] = value;
        used[i] = 1;
        last = Math.max(last, i);
    };

    const getValue = (i: number) => used[i] ? values[i] : null;
    const hasValue = (i: number) => !!used[i];

    return {truncate, set: setValue, get: getValue, has: hasValue, tail: getTail};
};
