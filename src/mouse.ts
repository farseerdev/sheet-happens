import { CellLayout, CellPropertyFunction, Change, Clickable, Rectangle, RowOrColumnPropertyFunction, SheetMouseEvent, SheetStyle, VisibleLayout, XY } from './types';
import { MouseEvent, PointerEvent, RefObject, useCallback, useMemo, useRef, useState } from 'react';
import { normalizeSelection, isColumnSelection, isRowSelection, isCellSelection, isMaybeRowSelection, isPointInsideSelection, addXY, subXY, maxXY } from './coordinate';
import { ONE_ONE, ORIGIN, SIZES } from './constants';
import { findApproxMaxEditDataIndex } from './props';
import { isInRange } from './util';

type DragOp = {
    anchor: number,
    scroll: number,
    size: number,
    indices: number[],
};

export const useMouse = (
    hitmapRef: RefObject<Clickable[]>,
    selection: Rectangle,
    knobArea: Rectangle | null,
    editMode: boolean,
    editData: CellPropertyFunction<string>,
    sourceData: CellPropertyFunction<string | number | null>,
    cellReadOnly: CellPropertyFunction<boolean | null>,

    canSizeColumn: RowOrColumnPropertyFunction<boolean | null>,
    canSizeRow: RowOrColumnPropertyFunction<boolean | null>,
    canOrderColumn: RowOrColumnPropertyFunction<boolean | null>,
    canOrderRow: RowOrColumnPropertyFunction<boolean | null>,

    cellLayout: CellLayout,
    visibleCells: VisibleLayout,
    sheetStyle: SheetStyle,

    onEdit?: (cell: XY) => void,
    onCommit?: () => void,
    onKnobAreaChange?: (knobArea: Rectangle | null) => void,
    onDragOffsetChange?: (dragOffset: XY | null) => void,
    onDropTargetChange?: (selection: Rectangle | null) => void,
    onSelectionChange?: (selection: Rectangle, scrollTo?: boolean, toHead?: boolean) => void,

    onInvalidateColumn?: (column: number) => void,
    onInvalidateRow?: (row: number) => void,

    onChange?: (changes: Change[]) => void,
    onColumnOrderChange?: (indices: number[], order: number) => void,
    onRowOrderChange?: (indices: number[], order: number) => void,
    onCellWidthChange?: (indices: number[], value: number) => void,
    onCellHeightChange?: (indices: number[], value: number) => void,
    onRightClick?: (e: SheetMouseEvent) => void,

    dontCommitEditOnSelectionChange?: boolean,
) => {
    const [hitTarget, setHitTarget] = useState<Clickable | null>(null);

    const [columnResize, setColumnResize] = useState<DragOp | null>(null);
    const [rowResize, setRowResize] = useState<DragOp | null>(null);
    const [columnDrag, setColumnDrag] = useState<DragOp | null>(null);
    const [rowDrag, setRowDrag] = useState<DragOp | null>(null);

    const [draggingKnob, setDraggingKnob] = useState(false);
    const [draggingSelection, setDraggingSelection] = useState(false);
    const [draggingRowSelection, setDraggingRowSelection] = useState(false);
    const [draggingColumnSelection, setDraggingColumnSelection] = useState(false);

    const {hideRowHeaders, hideColumnHeaders} = sheetStyle;
    const {cellToPixel, getVersion} = cellLayout;
    const version = getVersion();

    const knobPosition = useMemo((): XY | null => {
        const [, [maxX, maxY]] = normalizeSelection(selection);
        if (isRowSelection(selection)) {
            return subXY(addXY(cellToPixel([0, maxY], [0, 1]), [SIZES.knobArea * 0.5, 0]), ONE_ONE);
        }
        if (isColumnSelection(selection)) {
            return subXY(addXY(cellToPixel([maxX, 0], [1, 0]), [0, SIZES.knobArea * 0.5]), ONE_ONE);
        }
        if (isCellSelection(selection)) {
            return subXY(cellToPixel([maxX, maxY], ONE_ONE), ONE_ONE);
        }
        return null;
    }, [selection, cellToPixel, version]);

    // Pass pointer/dragging state into handlers via ref so they don't need to rebind during resizes/drags
    const refState = {
        selection,
        knobArea,
        editMode,
        editData,
        sourceData,
        cellLayout,
        visibleCells,
        hitTarget,

        knobPosition,
        columnResize,
        rowResize,
        columnDrag,
        rowDrag,

        draggingKnob,
        draggingSelection,
        draggingRowSelection,
        draggingColumnSelection,
    };
    const ref = useRef(refState);
    ref.current = refState;

    // Hit-testing for rendered objects
    const getMousePosition = useCallback((e: PointerEvent<any> | MouseEvent<any>) => {
        if (!e.target || !(e.target instanceof Element)) {
            return null;
        }

        const rect = e.target.getBoundingClientRect();
        const xy: XY = [
            e.clientX - rect.left,
            e.clientY - rect.top,
        ];
        return xy;
    }, []);

    const getScrollPosition = useCallback((e: PointerEvent<any> | MouseEvent<any>) => {
        if (!e.target || !(e.target instanceof Element)) {
            return [0, 0];
        }

        const {scrollLeft, scrollTop} = e.target as any;
        const xy: XY = [scrollLeft, scrollTop];

        return xy;
    }, []);

    const getMouseHit = useCallback((xy: XY) => {
        const {current: hitmap} = hitmapRef;
        if (!hitmap) return null;

        for (const object of hitmap) {
            const {rect} = object;
            if (isPointInsideSelection(rect, xy)) {
                return object;
            }
        }

        return null;
    }, [hitmapRef]);

    const onPointerLeave = useCallback(() => {
        window.document.body.style.cursor = 'auto';
    }, []);

    const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const {
            current: {
                selection,
                cellLayout: {columnToPixel, rowToPixel, pixelToCell, getIndentX, getIndentY},
                visibleCells: {columns, rows},
                knobPosition,
            },
        } = ref;

        if (e.button !== 0) return;

        (e.target as Element)?.setPointerCapture?.(e.pointerId);

        const xy = getMousePosition(e);
        if (!xy) return;

        const [x, y] = xy;
        const hitTarget = getMouseHit(xy);
        if (hitTarget) {
            setHitTarget(hitTarget);
            // Update hitTarget in ref in case there is no re-render between pointerDown and pointerUp
            ref.current.hitTarget = hitTarget;
            return;
        }

        const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

        const selectedColumns = [];
        const selectedRows = [];
        for (let i = minX; i <= maxX; i++) selectedColumns.push(i);
        for (let i = minY; i <= maxY; i++) selectedRows.push(i);

        // Column header
        if (!hideColumnHeaders && y < getIndentY()) {
            // Grab selected columns in column selection
            if (onColumnOrderChange) {
                // Trim off start/end so resize works there
                const start = columnToPixel(minX) + SIZES.resizeZone;
                const end = columnToPixel(maxX, 1) - SIZES.resizeZone;
                if (isInRange(x, start, end)) {

                    for (const index of columns) {
                        const start = columnToPixel(index, 0);
                        const end = columnToPixel(index, 1);

                        if (
                            isColumnSelection(selection) &&
                            isInRange(x, start, end) &&
                            isInRange(index, minX, maxX) &&
                            canOrderColumn(index)
                        ) {
                            window.document.body.style.cursor = 'grabbing';

                            const indices = selectedColumns;
                            const size = columnToPixel(maxX, 1) - columnToPixel(minX);
                            const [scroll] = getScrollPosition(e);

                            setColumnDrag({
                                anchor: x,
                                scroll,
                                size,
                                indices,
                            });
                            onDragOffsetChange?.([0, 0]);
                            return;
                        }
                    }
                }
            }

            // Resize columns
            if (onCellWidthChange) {
                for (const index of columns) {
                    const edge = columnToPixel(index, 1);

                    if ((Math.abs(edge - x) < SIZES.resizeZone) && canSizeColumn(index)) {
                        window.document.body.style.cursor = 'col-resize';

                        const asGroup = isColumnSelection(selection) && maxX === index;
                        const indices = asGroup
                            ? selectedColumns
                            : [index];

                        const size = asGroup
                            ? columnToPixel(maxX, 1) - columnToPixel(minX)
                            : columnToPixel(index, 1) - columnToPixel(index);
                        const [scroll] = getScrollPosition(e);

                        setColumnResize({
                            anchor: x,
                            scroll,
                            size,
                            indices,
                        });
                        return;
                    }
                }
            }
        }

        if (!hideRowHeaders && x < getIndentX()) {
            // Grab selected rows in row selection
            if (onRowOrderChange) {
                // Trim off start/end so resize works there
                const start = rowToPixel(minY) + SIZES.resizeZone;
                const end = rowToPixel(maxY, 1) - SIZES.resizeZone;
                if (isInRange(y, start, end)) {

                    for (const index of rows) {
                        const start = rowToPixel(index, 0);
                        const end = rowToPixel(index, 1);

                        if (
                            isRowSelection(selection) &&
                            isInRange(y, start, end) &&
                            isInRange(index, minY, maxY) &&
                            canOrderRow(index)
                        ) {
                            window.document.body.style.cursor = 'grabbing';

                            const indices = selectedRows;
                            const size = rowToPixel(maxY, 1) - rowToPixel(minY);
                            const [, scroll] = getScrollPosition(e);

                            setRowDrag({
                                anchor: y,
                                scroll,
                                size,
                                indices,
                            });
                            onDragOffsetChange?.([0, 0]);
                            return;
                        }
                    }
                }
            }

            // Resize rows
            if (onCellHeightChange) {
                for (const index of rows) {
                    const edge = rowToPixel(index, 1);

                    if ((Math.abs(edge - y) < SIZES.resizeZone) && canSizeRow(index)) {
                        window.document.body.style.cursor = 'row-resize';

                        const asGroup = isRowSelection(selection) && maxY === index;
                        const indices = asGroup
                            ? selectedRows
                            : [index];

                        const size = asGroup
                            ? rowToPixel(maxY, 1) - rowToPixel(minY)
                            : rowToPixel(index, 1) - rowToPixel(index);
                        const [, scroll] = getScrollPosition(e);

                        setRowResize({
                            anchor: y,
                            scroll,
                            size,
                            indices,
                        });
                        return;
                    }
                }
            }
        }

        // Knob drag mode
        if (knobPosition) {
            const [knobX, knobY] = knobPosition;
            if (Math.abs(x - knobX) < SIZES.knobArea && Math.abs(y - knobY) < SIZES.knobArea) {
                setDraggingKnob(true);
                onKnobAreaChange?.(selection);
                return;
            }
        }

        // Normal cell click
        const head = pixelToCell(xy);
        const anchor: XY = e.shiftKey ? [...selection[0]] : head;

        if (editMode) {
            if (!dontCommitEditOnSelectionChange) {
                onCommit?.();
            }
        }

        let scrollTo = true;

        if (!hideRowHeaders && x < getIndentX()) {
            scrollTo = false;
            setDraggingRowSelection(true);
            anchor[0] = -1;
            head[0] = -1;
        }

        if (!hideColumnHeaders && y < getIndentY()) {
            scrollTo = false;
            setDraggingColumnSelection(true);
            anchor[1] = -1;
            head[1] = -1;
        }

        setDraggingSelection(true);
        onSelectionChange?.([anchor, head], scrollTo, true);
    }, [
        getMousePosition,
        getScrollPosition,
        getMouseHit,
        onColumnOrderChange,
        onRowOrderChange,
        onCellWidthChange,
        onCellHeightChange,
        onKnobAreaChange,
        onSelectionChange,
        onCommit,
        canSizeColumn,
        canSizeRow,
        canOrderColumn,
        canOrderRow,
    ]);

    const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const {
            current: {
                knobArea,
                selection,
                sourceData,
                editData,

                columnDrag,
                rowDrag,

                draggingKnob,
                hitTarget,

                cellLayout: {pixelToColumn, pixelToRow, getIndentX, getIndentY},
            },
        } = ref;

        if (knobArea && draggingKnob) {
            const changes = parseKnobOperation(knobArea, selection, sourceData, editData, cellReadOnly);

            onChange?.(changes);
            onSelectionChange?.(knobArea, true, true);
            onKnobAreaChange?.(null);
        }

        const xy = getMousePosition(e);
        if (xy && (columnDrag || rowDrag)) {
            window.document.body.style.cursor = 'auto';
            onDragOffsetChange?.(null);
            onDropTargetChange?.(null);

            const [x, y] = xy;
            const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

            const cellX = pixelToColumn(Math.max(x, getIndentX()), 0.5);
            const cellY = pixelToRow(Math.max(y, getIndentY()), 0.5);

            if (columnDrag) {
                const {indices} = columnDrag;

                const insideSelection = cellX >= minX && cellX <= maxX + 1;
                if (!insideSelection) {
                    const order = cellX > minX ? cellX - indices.length : cellX;
                    onSelectionChange?.([[order, minY], [order + maxX - minX, maxY]]);
                    onColumnOrderChange?.(indices, order);
                    onInvalidateColumn?.(Math.min(minX, order));
                }
            }
            if (rowDrag) {
                const {indices} = rowDrag;

                const insideSelection = cellY >= minY && cellY <= maxY + 1;
                if (!insideSelection) {
                    const order = cellY > minY ? cellY - indices.length : cellY;
                    onSelectionChange?.([[minX, order], [maxX, order + maxY - minY]]);
                    onRowOrderChange?.(indices, order);
                    onInvalidateRow?.(Math.min(minY, order));
                }
            }
        }

        setDraggingSelection(false);
        setDraggingRowSelection(false);
        setDraggingColumnSelection(false);
        setDraggingKnob(false);
        setColumnResize(null);
        setColumnDrag(null);
        setRowResize(null);
        setRowDrag(null);

        if (!xy || !hitTarget) return;
        setHitTarget(null);

        // Check hit target rect to see if it is the same as pointerDown
        // (object identity might have changed due to react re-render)
        const previousRect = JSON.stringify(hitTarget.rect);
        const currentRect = JSON.stringify(getMouseHit(xy)?.rect);
        if (previousRect === currentRect) {
            const {obj} = hitTarget;
            obj.onClick?.(e);
        }

    }, [
        getMousePosition,
        getMouseHit,
        onChange,
        onSelectionChange,
        onKnobAreaChange,
        onDropTargetChange,
        onColumnOrderChange,
        onRowOrderChange,
    ]);

    const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
        const {
            current: {
                selection,
                visibleCells,

                knobPosition,
                columnResize,
                columnDrag,
                rowResize,
                rowDrag,

                draggingKnob,
                draggingSelection,
                draggingColumnSelection,
                draggingRowSelection,

                cellLayout: {columnToPixel, rowToPixel, pixelToCell, pixelToColumn, pixelToRow, getIndentX, getIndentY},
            },
        } = ref;

        const xy = getMousePosition(e);
        if (!xy) return;

        window.document.body.style.cursor = 'auto';

        const hitTarget = getMouseHit(xy);
        if (hitTarget) {
            window.document.body.style.cursor = 'pointer';
        }
        else if (columnDrag || rowDrag) {
            window.document.body.style.cursor = 'grabbing';
        }
        else if (columnResize) {
            window.document.body.style.cursor = 'col-resize';
            e.preventDefault();
        }
        else if (rowResize) {
            window.document.body.style.cursor = 'row-resize';
            e.preventDefault();
        }
        else if (draggingRowSelection || draggingColumnSelection) {
            e.preventDefault();
        }

        const {columns, rows} = visibleCells;
        const [x, y] = xy;
        const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

        const isDragging = columnResize || columnDrag || rowResize || rowDrag || draggingRowSelection || draggingColumnSelection;

        if (!isDragging) {
            if (!hideColumnHeaders && y < getIndentY()) {
                if (onColumnOrderChange) {
                    // Trim off start/end so resize works there
                    const start = columnToPixel(minX) + SIZES.resizeZone;
                    const end = columnToPixel(maxX, 1) - SIZES.resizeZone;
                    if (isInRange(x, start, end)) {

                        for (const index of columns) {
                            const start = columnToPixel(index);
                            const end = columnToPixel(index, 1);

                            if (
                                !draggingColumnSelection &&
                                isColumnSelection(selection) &&
                                isInRange(x, start, end) &&
                                isInRange(index, minX, maxX) &&
                                canOrderColumn(index)
                            ) {
                                window.document.body.style.cursor = 'grab';
                                return;
                            }
                        }
                    }
                }
                if (onCellWidthChange) {
                    for (const index of columns) {
                        const edge = columnToPixel(index, 1);
                        if ((Math.abs(edge - x) < SIZES.resizeZone) && canSizeColumn(index)) {
                            window.document.body.style.cursor = 'col-resize';
                            return;
                        }
                    }
                }
            }

            if (!hideRowHeaders && x < getIndentX()) {
                if (onRowOrderChange) {
                    // Trim off start/end so resize works there
                    const start = rowToPixel(minY) + SIZES.resizeZone;
                    const end = rowToPixel(maxY, 1) - SIZES.resizeZone;
                    if (isInRange(y, start, end)) {

                        for (const index of rows) {
                            const start = rowToPixel(index);
                            const end = rowToPixel(index, 1);

                            if (
                                !draggingRowSelection &&
                                isRowSelection(selection) &&
                                isInRange(y, start, end) &&
                                isInRange(index, minY, maxY) &&
                                canOrderRow(index)
                            ) {
                                window.document.body.style.cursor = 'grab';
                                return;
                            }
                        }
                    }
                }
                if (onCellHeightChange) {
                    for (const index of rows) {
                        const edge = rowToPixel(index, 1);
                        if ((Math.abs(edge - y) < SIZES.resizeZone) && canSizeRow(index)) {
                            window.document.body.style.cursor = 'row-resize';
                            return;
                        }
                    }
                }
            }

            if (knobPosition) {
                const [knobX, knobY] = knobPosition;
                if (Math.abs(x - knobX) < SIZES.knobArea && Math.abs(y - knobY) < SIZES.knobArea) {
                    window.document.body.style.cursor = 'crosshair';
                    return;
                }
            }
        }

        if (columnResize) {
            if (onCellWidthChange) {
                const {size, anchor, scroll, indices} = columnResize;
                const [currentScroll] = getScrollPosition(e);
                const newWidth = Math.max(size + x - anchor + scroll - currentScroll, SIZES.minimumWidth * indices.length);
                onInvalidateColumn?.(indices[0] - 1);
                onCellWidthChange(indices, newWidth / indices.length);
            }
            return;
        }

        if (rowResize) {
            if (onCellHeightChange) {
                const {size, anchor, scroll, indices} = rowResize;
                const [, currentScroll] = getScrollPosition(e);
                const newHeight = Math.max(size + y - anchor + scroll - currentScroll, SIZES.minimumHeight * indices.length);
                onInvalidateRow?.(indices[0] - 1);
                onCellHeightChange(indices, newHeight / indices.length);
            }
            return;
        }

        if (draggingSelection) {
            const [anchor] = selection;
            const head = pixelToCell(xy);

            const [anchorX, anchorY] = anchor;
            const [headX, headY] = head;

            if (draggingRowSelection) {
                onSelectionChange?.([[-1, anchorY], [-1, Math.max(0, headY)]], false);
            } else if (draggingColumnSelection) {
                onSelectionChange?.([[anchorX, -1], [Math.max(0, headX), -1]], false);
            } else {
                onSelectionChange?.([
                    maxXY(anchor, ORIGIN),
                    maxXY(head, ORIGIN),
                ], false);
            }
        }

        if (draggingKnob) {
            window.document.body.style.cursor = 'crosshair';

            const [cellX, cellY] = pixelToCell(xy);
            let [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

            // check if vertical or horizontal
            let xCellDiff = Math.min(cellX - minX, maxX - cellX, 0); // zero or less
            let yCellDiff = Math.min(cellY - minY, maxY - cellY, 0); // zero or less

            if (isMaybeRowSelection(selection) || xCellDiff > yCellDiff) {
                if (cellY < minY) {
                    minY = cellY;
                } else if (cellY > maxY) {
                    maxY = cellY;
                }
            } else {
                if (cellX < minX) {
                    minX = cellX;
                } else if (cellX > maxX) {
                    maxX = cellX;
                }
            }

            onKnobAreaChange?.([[minX, minY], [maxX, maxY]]);
        }

        if (columnDrag || rowDrag) {
            const [x, y] = xy;
            if (columnDrag) {
                const cellX = pixelToColumn(Math.max(x, getIndentX()), 0.5);
                const insideSelection = cellX >= minX && cellX <= maxX + 1;

                const {anchor, scroll} = columnDrag;
                const shift = x - anchor;
                const [currentScroll] = getScrollPosition(e);

                onDragOffsetChange?.([shift + currentScroll - scroll, 0]);
                onDropTargetChange?.(insideSelection ? null : [[cellX, -1], [cellX, -1]]);
            }
            if (rowDrag) {
                const cellY = pixelToRow(Math.max(y, getIndentY()), 0.5);
                const insideSelection = cellY >= minY && cellY <= maxY + 1;

                const {anchor, scroll} = rowDrag;
                const shift = y - anchor;
                const [, currentScroll] = getScrollPosition(e);

                onDragOffsetChange?.([0, shift + currentScroll - scroll]);
                onDropTargetChange?.(insideSelection ? null : [[-1, cellY], [-1, cellY]]);
            }
        }
    }, [
        getMousePosition,
        getScrollPosition,
        getMouseHit,
        onCellWidthChange,
        onCellHeightChange,
    ]);

    const onDoubleClick = useCallback((e: MouseEvent) => {
        const {
            current: {
                cellLayout: {pixelToCell},
            },
        } = ref;

        e.preventDefault();
        if (e.shiftKey) return;

        const xy = getMousePosition(e);
        if (!xy) return;

        const hitTarget = getMouseHit(xy);
        if (hitTarget) {
            window.document.body.style.cursor = 'pointer';
            return;
        }

        const editCell = pixelToCell(xy);
        if (editMode) onCommit?.();
        onEdit?.(editCell);
    }, [getMousePosition, getMouseHit, onCommit, onEdit]);

    const onContextMenu = useCallback((e: MouseEvent) => {
        const {
            current: {
                cellLayout: {pixelToCell, getIndentX, getIndentY},
            },
        } = ref;

        const xy = getMousePosition(e);
        if (!xy) return;

        const [x, y] = xy;
        if (x <= getIndentX() || y <= getIndentY()) {
            return;
        }

        // If click is not inside of selection, select the right clicked cell
        const cell = pixelToCell(xy);
        if (!isPointInsideSelection(selection, cell)) {
            onSelectionChange?.([cell, cell]);
        }

        onPointerMove(e as any);

        const [cellX, cellY] = cell;
        const event: SheetMouseEvent = {
            ...e,
            cellX,
            cellY,
        };
        onRightClick?.(event);
    }, [getMousePosition, onSelectionChange, onPointerMove, onRightClick]);

    const mouseHandlers = {
        onPointerLeave,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onDoubleClick,
        onContextMenu,
    };

    return {knobPosition, mouseHandlers};
};

const parseKnobOperation = (
    knobArea: Rectangle,
    selection: Rectangle,
    sourceData: CellPropertyFunction<string | number | null>,
    editData: CellPropertyFunction<string>,
    cellReadOnly: CellPropertyFunction<boolean | null>,
): Change[] => {
    const [[kx1, ky1], [kx2, ky2]] = normalizeSelection(knobArea);
    const [[sx1, sy1], [sx2, sy2]] = normalizeSelection(selection);

    let fx1 = kx1;
    let fy1 = ky1;
    let fx2 = kx2;
    let fy2 = ky2;

    const changes: Change[] = [];

    // TODO: this should be made less cryptic, using logical selection ops/fns

    if (fx2 - fx1 === sx2 - sx1) {
        // vertical
        if (fy1 === sy1) {
            fy1 = sy2 + 1;
        } else {
            fy2 = sy1 - 1;
        }
        if (fx1 === -1 && fx2 === -1) {
            const [maxX] = findApproxMaxEditDataIndex(editData);
            fx1 = 0;
            fx2 = maxX;
        }
        let srcY = sy1;
        for (let y = fy1; y <= fy2; y++) {
            for (let x = fx1; x <= fx2; x++) {
                const value = sourceData(x, srcY);
                if (!cellReadOnly(x, y)) {
                    changes.push({ x: x, y: y, value: value, source: { x: x, y: srcY } });
                }
            }
            srcY = srcY + 1;
            if (srcY > sy2) {
                srcY = sy1;
            }
        }
    } else {
        // horizontal
        if (fx1 === sx1) {
            fx1 = sx2 + 1;
        } else {
            fx2 = sx1 - 1;
        }
        if (fy1 === -1 && fy2 === -1) {
            const [, maxY] = findApproxMaxEditDataIndex(editData);
            fy1 = 0;
            fy2 = maxY;
        }
        let srcX = sx1;
        for (let x = fx1; x <= fx2; x++) {
            for (let y = fy1; y <= fy2; y++) {
                const value = sourceData(srcX, y);
                if (!cellReadOnly(x, y)) {
                    changes.push({ x: x, y: y, value: value, source: { x: srcX, y: y } });
                }
            }
            srcX = srcX + 1;
            if (srcX > sx2) {
                srcX = sx1;
            }
        }
    }

    return changes;
}