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

            // TODO: smooth scrolling
            // const pixel = subXY(cellToAbsolute(cell), xy);
            //if (!isSameXY(pixel, pixelOffset)) {
            //     setPixelOffset(pixel);
            //}

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
        const [nudgeX, nudgeY] = cellToAbsolute([0, 0], [0.5, 0.5]);

        callback(newOffset, maxXY(maxScroll, scroll));
        setTimeout(() => {
            const [scrollX, scrollY] = scroll;
            element.scrollLeft = scrollX - nudgeX;
            element.scrollTop = scrollY - nudgeY;
        });
    }
};
