import { UIEvent, useCallback } from 'react';
import { XY, CellLayout } from './types';
import { isSameXY, maxXY, mulXY } from './coordinate';
import { ONE_ONE } from './constants';

export const useScroll = (
    offset: XY,
    maxScroll: XY,
    cellLayout: CellLayout,
    onOffsetChange?: (offset: XY) => void,
    onMaxScrollChange?: (maxScroll: XY) => void
) => {
    return useCallback(
        (e: UIEvent) => {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const { absoluteToCell, cellToAbsolute } = cellLayout;

            // Zero scroll position is considered in the center of the top/left cell
            const [nudgeX, nudgeY] = cellToAbsolute([0, 0], [0.5, 0.5]);

            const xy: XY = [e.target.scrollLeft + nudgeX, e.target.scrollTop + nudgeY];

            const cell = absoluteToCell(xy);
            if (!isSameXY(cell, offset)) {
                onOffsetChange?.(cell);
            }

            const [x, y] = xy;
            const [maxScrollX, maxScrollY] = maxScroll;
            const growX = maxScrollX < x + 1 ? 1.5 : 1;
            const growY = maxScrollY < y + 1 ? 1.5 : 1;
            if (growX > 1 || growY > 1) {
                onMaxScrollChange?.(mulXY(maxScroll, [growX, growY]));
            }
        },
        [cellLayout, onOffsetChange, onMaxScrollChange]
    );
};

// If view extends past end of table
// Limit view to table contents
export const clipDataOffset = (view: XY, offset: XY, freeze: XY, maxCells: XY, cellLayout: CellLayout): XY => {
    let [newX, newY] = offset;
    const [freezeX, freezeY] = freeze;
    const [maxColumns, maxRows] = maxCells;

    const { absoluteToColumn, columnToAbsolute, absoluteToRow, rowToAbsolute } = cellLayout;

    const {
        edge: [rightEdge, bottomEdge],
        viewport: [scrollW, scrollH],
    } = getViewExtent(view, [newX, newY], freeze, cellLayout);

    // Move extra space on the right/bottom to equivalent on the left/top
    if (rightEdge > maxColumns) {
        const remainder = columnToAbsolute(maxColumns) - columnToAbsolute(newX + freezeX);
        newX = Math.max(0, absoluteToColumn(columnToAbsolute(newX + freezeX) - scrollW + remainder) - freezeX + 1);
    }
    if (bottomEdge > maxRows) {
        const remainder = rowToAbsolute(maxRows) - rowToAbsolute(newY + freezeY);
        newY = Math.max(0, absoluteToRow(rowToAbsolute(newY + freezeY) - scrollH + remainder) - freezeY + 1);
    }

    return [newX, newY];
};

// Get bottom-right corner cell + non-frozen viewport size
export const getViewExtent = (
    view: XY,
    offset: XY,
    freeze: XY,
    cellLayout: CellLayout
): {
    edge: XY;
    viewport: XY;
} => {
    const {
        cellToAbsolute,
        absoluteToColumn,
        columnToAbsolute,
        absoluteToRow,
        rowToAbsolute,
        getIndentX,
        getIndentY,
    } = cellLayout;

    const [x, y] = offset;
    const [w, h] = view;
    const [frozenX, frozenY] = cellToAbsolute(freeze);

    const scrollW = w - frozenX - getIndentX();
    const scrollH = h - frozenY - getIndentY();

    const leftEdge = x + freeze[0];
    const topEdge = y + freeze[1];
    const rightEdge = absoluteToColumn(columnToAbsolute(leftEdge) + scrollW);
    const bottomEdge = absoluteToRow(rowToAbsolute(topEdge) + scrollH);

    return {
        edge: [rightEdge, bottomEdge],
        viewport: [scrollW, scrollH],
    };
};

export const scrollToCell = (
    element: HTMLDivElement,
    cell: XY,
    view: XY,
    freeze: XY,
    offset: XY,
    maxScroll: XY,
    cellLayout: CellLayout,
    callback: (offset: XY, maxScroll: XY) => void
) => {
    const [x, y] = cell;
    const [w, h] = view;
    const [offsetX, offsetY] = offset;

    const { cellToAbsolute, cellToPixel, columnToPixel, rowToPixel } = cellLayout;

    const [frozenX, frozenY] = cellToAbsolute(freeze);
    const [left, top] = cellToPixel(cell);
    const [right, bottom] = cellToPixel(cell, ONE_ONE);

    let [newX, newY] = offset;

    // If moving left/up, scroll to head
    if (left <= frozenX) {
        newX = x - freeze[0];
    }
    if (top <= frozenY) {
        newY = y - freeze[1];
    }

    // If moving right/down, scroll cell by cell until right/bottom of cell is visible
    if (right > w) {
        let edge = right - w + columnToPixel(newX);
        while (columnToPixel(++newX) < edge) {}
    }
    if (bottom > h) {
        let edge = bottom - h + rowToPixel(newY);
        while (rowToPixel(++newY) < edge) {}
    }

    // Don't scroll on infinite axis
    const newOffset: XY = [newX >= 0 ? newX : offsetX, newY >= 0 ? newY : offsetY];

    if (!isSameXY(newOffset, offset)) {
        const scroll = cellToAbsolute(newOffset);
        callback(newOffset, maxXY(maxScroll, scroll));

        setTimeout(() => {
            updateScrollPosition(element, newOffset, cellLayout);
        });
    }
};

export const updateScrollPosition = (element: HTMLDivElement, dataOffset: XY, cellLayout: CellLayout) => {
    const { cellToAbsolute } = cellLayout;

    const scroll = cellToAbsolute(dataOffset);
    const [nudgeX, nudgeY] = cellToAbsolute([0, 0], [0.5, 0.5]);

    const [scrollX, scrollY] = scroll;
    element.scrollLeft = scrollX - nudgeX;
    element.scrollTop = scrollY - nudgeY;
};
