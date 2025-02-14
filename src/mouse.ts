import { MouseEvent, PointerEvent, RefObject, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    CellContentRender,
    CellLayout,
    CellPropertyFunction,
    Change,
    Rectangle,
    RowOrColumnPropertyFunction,
    SheetMouseEvent,
    SheetStyle,
    VisibleLayout,
    XY,
} from './types';
import {
    normalizeSelection,
    mapSelectionColumns,
    mapSelectionRows,
    isColumnSelection,
    isRowSelection,
    isCellSelection,
    isMaybeRowSelection,
    isPointInsideRectangle,
    isPointInsideSelection,
    isSameRectangle,
    addXY,
    subXY,
    maxXY,
} from './coordinate';
import { ONE_ONE, ORIGIN, SIZES } from './constants';
import { isBoundaryInsideGroup, expandSelectionToRowOrColumnGroups } from './group';
import { findApproxMaxEditDataIndex } from './props';
import { isInRange, seq } from './util';

type DragOp = {
    anchor: XY;
    offset: XY;
    size: number;
    indices: number[];
};

export const useMouse = (
    elementRef: RefObject<HTMLDivElement>,
    dataOffset: XY,

    hitmapRef: RefObject<CellContentRender[]>,
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

    columnGroupKeys: RowOrColumnPropertyFunction<string | number | null>,
    rowGroupKeys: RowOrColumnPropertyFunction<string | number | null>,
    selectedColumnGroups: Set<string | number | null> | null,
    selectedRowGroups: Set<string | number | null> | null,

    getAutoSizeWidth: (column: number) => number,
    getAutoSizeHeight: (row: number) => number,

    onEdit?: (cell: XY) => void,
    onCommit?: () => void,
    onKnobAreaChange?: (knobArea: Rectangle | null) => void,
    onDragIndicesChange?: (indices: [number[] | null, number[] | null]) => void,
    onDragOffsetChange?: (dragOffset: XY | null) => void,
    onDropTargetChange?: (selection: Rectangle | null) => void,
    onSelectionChange?: (selection: Rectangle, scrollTo?: boolean, toHead?: boolean) => void,
    onFocusChange?: (focus: boolean) => void,

    onInvalidateColumn?: (column: number) => void,
    onInvalidateRow?: (row: number) => void,

    onChange?: (changes: Change[]) => void,
    onColumnOrderChange?: (indices: number[], order: number) => void,
    onRowOrderChange?: (indices: number[], order: number) => void,
    onCellWidthChange?: (indices: number[], values: number[]) => void,
    onCellHeightChange?: (indices: number[], values: number[]) => void,
    onRightClick?: (e: SheetMouseEvent) => void,

    dontCommitEditOnSelectionChange?: boolean,
    dontChangeSelectionOnOrderChange?: boolean,
) => {
    const [columnResize, setColumnResize] = useState<DragOp | null>(null);
    const [rowResize, setRowResize] = useState<DragOp | null>(null);
    const [columnDrag, setColumnDrag] = useState<DragOp | null>(null);
    const [rowDrag, setRowDrag] = useState<DragOp | null>(null);

    const [hitTestDown, setHitTestDown] = useState<CellContentRender | null>(null);
    const [autoScroll, setAutoScroll] = useState<XY | null>(null);

    const [draggingKnob, setDraggingKnob] = useState(false);
    const [draggingSelection, setDraggingSelection] = useState(false);
    const [draggingRowSelection, setDraggingRowSelection] = useState(false);
    const [draggingColumnSelection, setDraggingColumnSelection] = useState(false);

    const { hideRowHeaders, hideColumnHeaders } = sheetStyle;
    const { cellToPixel, getVersion } = cellLayout;
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
        dataOffset,

        knobArea,
        editMode,
        editData,
        sourceData,
        cellLayout,
        visibleCells,

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
    const getMousePosition = useCallback((e: PointerEvent<any> | MouseEvent<any>, strict?: boolean) => {
        if (!e.target || !(e.target instanceof Element)) {
            return null;
        }

        const rect = e.target.getBoundingClientRect();
        const xy: XY = [e.clientX - rect.left, e.clientY - rect.top];

        // Ignore clicks on scrollbar
        if (strict && (xy[0] > e.target.clientWidth || xy[1] > e.target.clientHeight)) {
            return null;
        }

        return xy;
    }, []);

    // Check if mouse is out of bounds and in what direction
    const getMouseOutOfBounds = useCallback(
        (e: PointerEvent<any> | MouseEvent<any>, allowX: boolean, allowY: boolean) => {
            if (!e.target || !(e.target instanceof Element)) {
                return null;
            }

            const rect = e.target.getBoundingClientRect();
            const xy: XY = [e.clientX - rect.left, e.clientY - rect.top];

            const indentX = cellLayout.getIndentX();
            const indentY = cellLayout.getIndentY();

            const xSign = allowX ? (xy[0] < indentX ? -1 : xy[0] > e.target.clientWidth ? 1 : 0) : 0;
            const ySign = allowY ? (xy[1] < indentY ? -1 : xy[1] > e.target.clientHeight ? 1 : 0) : 0;

            return xSign || ySign ? ([xSign, ySign] as XY) : null;
        },
        [cellLayout],
    );

    const getMouseHit = useCallback(
        (xy: XY) => {
            const { current: hitmap } = hitmapRef;
            if (!hitmap) return null;

            for (const object of hitmap) {
                const { box } = object;
                if (isPointInsideRectangle(box, xy)) {
                    return object;
                }
            }

            return null;
        },
        [hitmapRef],
    );

    const onPointerLeave = useCallback(() => {
        window.document.body.style.cursor = 'auto';
    }, []);

    const onPointerDown = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            const {
                current: {
                    selection,
                    dataOffset,
                    cellLayout: { columnToPixel, rowToPixel, pixelToCell, getIndentX, getIndentY },
                    visibleCells: { columns, rows },
                    knobPosition,
                },
            } = ref;

            onFocusChange?.(true);

            if (e.button !== 0) return;

            (e.target as Element)?.setPointerCapture?.(e.pointerId);

            const xy = getMousePosition(e, true);
            if (!xy) return;

            const hitTarget = getMouseHit(xy);
            setHitTestDown(hitTarget);

            const [x, y] = xy;

            const normalized = normalizeSelection(selection);
            const [[minX, minY], [maxX, maxY]] = normalized;

            const selectedColumns = mapSelectionColumns(selection)((i) => i);
            const selectedRows = mapSelectionRows(selection)((i) => i);

            // Column header
            if (!hideColumnHeaders && y < getIndentY()) {
                // Grab selected columns in column selection
                if (onColumnOrderChange) {
                    // Trim off start/end so resize works there
                    const start = columnToPixel(minX) + SIZES.resizeZone;
                    const end = columnToPixel(maxX, 1) - SIZES.resizeZone;
                    if (isInRange(x, start, end) || selectedColumnGroups) {
                        for (const index of columns) {
                            const start = columnToPixel(index, 0);
                            const end = columnToPixel(index, 1);

                            if (
                                isColumnSelection(selection) &&
                                isInRange(x, start, end) &&
                                (isInRange(index, minX, maxX) || selectedColumnGroups?.has(columnGroupKeys(index))) &&
                                canOrderColumn(index)
                            ) {
                                window.document.body.style.cursor = 'grabbing';

                                // Find all indices that need to be moved, from selection or matching groups
                                const indices = Array.from(
                                    new Set([
                                        ...selectedColumns,
                                        ...(selectedColumnGroups
                                            ? columns.filter((index) =>
                                                  selectedColumnGroups.has(columnGroupKeys(index)),
                                              )
                                            : []),
                                    ]).values(),
                                );
                                indices.sort((a, b) => a - b);

                                // Make one continuous drag shadow around the cursor for a contiguous group
                                let dragIndices = indices;
                                if (selectedColumnGroups) {
                                    const clickSelection: Rectangle = [
                                        [index, -1],
                                        [index, -1],
                                    ];
                                    const [[left], [right]] = expandSelectionToRowOrColumnGroups(
                                        clickSelection,
                                        columnGroupKeys,
                                        selectedColumnGroups,
                                        0,
                                    );

                                    // Extend to whole selection if it's part of the same 'chunk'
                                    const connected = !(minX > right || maxX < left);
                                    const dragStart = connected ? Math.min(minX, left) : left;
                                    const dragEnd = connected ? Math.max(maxX, right) : right;
                                    dragIndices = seq(dragEnd - dragStart + 1, dragStart);
                                }

                                const size = columnToPixel(maxX, 1) - columnToPixel(minX);

                                setColumnDrag({
                                    anchor: xy,
                                    offset: dataOffset,
                                    size,
                                    indices,
                                });
                                onDragOffsetChange?.([0, 0]);
                                onDragIndicesChange?.([dragIndices, null]);
                                return;
                            }
                        }
                    }
                }

                // Resize columns
                if (onCellWidthChange) {
                    for (const index of [-1, ...columns]) {
                        const edge = columnToPixel(index, 1);

                        if (Math.abs(edge - x) < SIZES.resizeZone && canSizeColumn(index)) {
                            window.document.body.style.cursor = 'col-resize';

                            const asGroup = isColumnSelection(selection) && maxX === index;
                            const indices = asGroup ? selectedColumns : [index];

                            const size = asGroup
                                ? columnToPixel(maxX, 1) - columnToPixel(minX)
                                : columnToPixel(index, 1) - columnToPixel(index);

                            setColumnResize({
                                anchor: xy,
                                offset: dataOffset,
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

                    if (isInRange(y, start, end) || selectedRowGroups) {
                        for (const index of rows) {
                            const start = rowToPixel(index, 0);
                            const end = rowToPixel(index, 1);

                            if (
                                isRowSelection(selection) &&
                                isInRange(y, start, end) &&
                                (isInRange(index, minY, maxY) || selectedRowGroups?.has(rowGroupKeys(index))) &&
                                canOrderRow(index)
                            ) {
                                window.document.body.style.cursor = 'grabbing';

                                // Find all indices that need to be moved, from selection or matching groups
                                const indices = Array.from(
                                    new Set([
                                        ...selectedRows,
                                        ...(selectedRowGroups
                                            ? rows
                                                  .map((_, i) => i)
                                                  .filter((index) => selectedRowGroups.has(rowGroupKeys(index)))
                                            : []),
                                    ]).values(),
                                );
                                indices.sort((a, b) => a - b);

                                // Make one continuous drag shadow around the cursor for a contiguous group
                                let dragIndices = indices;
                                if (selectedRowGroups) {
                                    const clickSelection: Rectangle = [
                                        [-1, index],
                                        [-1, index],
                                    ];
                                    const [[, top], [, bottom]] = expandSelectionToRowOrColumnGroups(
                                        clickSelection,
                                        rowGroupKeys,
                                        selectedRowGroups,
                                        1,
                                    );

                                    // Extend to whole selection if it's part of the same 'chunk'
                                    const connected = !(minY > bottom || maxY < top);
                                    const dragStart = connected ? Math.min(minY, top) : top;
                                    const dragEnd = connected ? Math.max(maxY, bottom) : bottom;
                                    dragIndices = seq(dragEnd - dragStart + 1, dragStart);
                                }

                                const size = rowToPixel(maxY, 1) - rowToPixel(minY);

                                setRowDrag({
                                    anchor: xy,
                                    offset: dataOffset,
                                    size,
                                    indices,
                                });
                                onDragOffsetChange?.([0, 0]);
                                onDragIndicesChange?.([null, dragIndices]);
                                return;
                            }
                        }
                    }
                }

                // Resize rows
                if (onCellHeightChange) {
                    for (const index of [-1, ...rows]) {
                        const edge = rowToPixel(index, 1);

                        if (Math.abs(edge - y) < SIZES.resizeZone && canSizeRow(index)) {
                            window.document.body.style.cursor = 'row-resize';

                            const asGroup = isRowSelection(selection) && maxY === index;
                            const indices = asGroup ? selectedRows : [index];

                            const size = asGroup
                                ? rowToPixel(maxY, 1) - rowToPixel(minY)
                                : rowToPixel(index, 1) - rowToPixel(index);

                            setRowResize({
                                anchor: xy,
                                offset: dataOffset,
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
        },
        [
            getMousePosition,
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
            dontCommitEditOnSelectionChange,
            columnGroupKeys,
            rowGroupKeys,
            selectedColumnGroups,
            selectedRowGroups,
        ],
    );

    const onPointerUp = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            const {
                current: {
                    knobArea,
                    selection,
                    sourceData,
                    editData,

                    columnDrag,
                    rowDrag,

                    draggingKnob,

                    cellLayout: { pixelToColumn, pixelToRow },
                },
            } = ref;

            onFocusChange?.(true);

            if (knobArea && draggingKnob) {
                const changes = parseKnobOperation(knobArea, selection, sourceData, editData, cellReadOnly);

                onChange?.(changes);
                onSelectionChange?.(knobArea, true, true);
                onKnobAreaChange?.(null);
            }

            const xy = getMousePosition(e);
            if (xy && (columnDrag || rowDrag)) {
                window.document.body.style.cursor = 'auto';
                onDragIndicesChange?.([null, null]);
                onDragOffsetChange?.(null);
                onDropTargetChange?.(null);

                const [x, y] = xy;
                const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

                const cellX = pixelToColumn(x, 0.5);
                const cellY = pixelToRow(y, 0.5);

                if (columnDrag) {
                    const { indices } = columnDrag;

                    const insideSelection = cellX >= minX && cellX <= maxX + 1;
                    const insideGroup = selectedColumnGroups?.has(columnGroupKeys(x));
                    if (!insideSelection && !insideGroup) {
                        const preceding = indices.filter((i) => i < cellX);
                        const order = cellX - preceding.length;
                        dontChangeSelectionOnOrderChange ||
                            onSelectionChange?.([
                                [order, minY],
                                [order + indices.length - 1, maxY],
                            ]);
                        onColumnOrderChange?.(indices, order);
                        onInvalidateColumn?.(Math.min(minX, order));
                    }
                }
                if (rowDrag) {
                    const { indices } = rowDrag;

                    const insideSelection = cellY >= minY && cellY <= maxY + 1;
                    const insideGroup = selectedRowGroups?.has(rowGroupKeys(y));
                    if (!insideSelection && !insideGroup) {
                        const preceding = indices.filter((i) => i < cellY);
                        const order = cellY - preceding.length;
                        dontChangeSelectionOnOrderChange ||
                            onSelectionChange?.([
                                [minX, order],
                                [maxX, order + indices.length - 1],
                            ]);
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
            setAutoScroll(null);
        },
        [
            getMousePosition,
            getMouseHit,
            onChange,
            onSelectionChange,
            onKnobAreaChange,
            onDropTargetChange,
            onColumnOrderChange,
            onRowOrderChange,
            dontChangeSelectionOnOrderChange,
        ],
    );

    const onPointerMove = useCallback(
        (e: PointerEvent<HTMLDivElement>) => {
            const {
                current: {
                    selection,
                    dataOffset,
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

                    cellLayout: {
                        cellToPixel,
                        columnToPixel,
                        rowToPixel,
                        pixelToCell,
                        pixelToColumn,
                        pixelToRow,
                        getIndentX,
                        getIndentY,
                    },
                },
            } = ref;

            window.document.body.style.cursor = 'auto';

            const isDraggingX =
                !!columnResize || !!columnDrag || draggingColumnSelection || draggingSelection || draggingKnob;

            const isDraggingY = !!rowResize || !!rowDrag || draggingRowSelection || draggingSelection || draggingKnob;

            const isDragging = isDraggingX || isDraggingY;

            const outOfBounds = getMouseOutOfBounds(e, isDraggingX, isDraggingY);
            if (isDragging) setAutoScroll(outOfBounds);

            const xy = getMousePosition(e);
            if (!xy) return;

            const hitTarget = getMouseHit(xy);

            if (columnDrag || rowDrag) {
                window.document.body.style.cursor = 'grabbing';
            } else if (columnResize) {
                window.document.body.style.cursor = 'col-resize';
                e.preventDefault();
            } else if (rowResize) {
                window.document.body.style.cursor = 'row-resize';
                e.preventDefault();
            } else if (draggingRowSelection || draggingColumnSelection) {
                e.preventDefault();
            } else if (hitTarget) {
                window.document.body.style.cursor = 'pointer';
            }

            const { columns, rows } = visibleCells;
            const [x, y] = xy;
            const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

            const getDragScrollOffset = (startOffset: XY): XY => {
                return subXY(cellToPixel(dataOffset), cellToPixel(startOffset));
            };

            if (!isDragging) {
                if (!hideColumnHeaders && y < getIndentY()) {
                    if (onColumnOrderChange) {
                        // Trim off start/end so resize works there
                        const start = columnToPixel(minX) + SIZES.resizeZone;
                        const end = columnToPixel(maxX, 1) - SIZES.resizeZone;
                        if (isInRange(x, start, end) || selectedColumnGroups) {
                            for (const index of columns) {
                                const start = columnToPixel(index);
                                const end = columnToPixel(index, 1);

                                if (
                                    !draggingColumnSelection &&
                                    isColumnSelection(selection) &&
                                    isInRange(x, start, end) &&
                                    (isInRange(index, minX, maxX) ||
                                        selectedColumnGroups?.has(columnGroupKeys(index))) &&
                                    canOrderColumn(index)
                                ) {
                                    window.document.body.style.cursor = 'grab';
                                    return;
                                }
                            }
                        }
                    }
                    if (onCellWidthChange) {
                        for (const index of [-1, ...columns]) {
                            const edge = columnToPixel(index, 1);
                            if (Math.abs(edge - x) < SIZES.resizeZone && canSizeColumn(index)) {
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
                        if (isInRange(y, start, end) || selectedRowGroups) {
                            for (const index of rows) {
                                const start = rowToPixel(index);
                                const end = rowToPixel(index, 1);

                                if (
                                    !draggingRowSelection &&
                                    isRowSelection(selection) &&
                                    isInRange(y, start, end) &&
                                    (isInRange(index, minY, maxY) || selectedRowGroups?.has(rowGroupKeys(index))) &&
                                    canOrderRow(index)
                                ) {
                                    window.document.body.style.cursor = 'grab';
                                    return;
                                }
                            }
                        }
                    }
                    if (onCellHeightChange) {
                        for (const index of [-1, ...rows]) {
                            const edge = rowToPixel(index, 1);
                            if (Math.abs(edge - y) < SIZES.resizeZone && canSizeRow(index)) {
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
                    const { size, anchor, offset, indices } = columnResize;
                    const [scrollOffset] = getDragScrollOffset(offset);
                    const newWidth = Math.round(
                        Math.max(size + x - anchor[0] + scrollOffset, SIZES.minimumWidth * indices.length),
                    );
                    onInvalidateColumn?.(indices[0] - 1);
                    onCellWidthChange(
                        indices,
                        indices.map((_) => Math.round(newWidth / indices.length)),
                    );
                }
                return;
            }

            if (rowResize) {
                if (onCellHeightChange) {
                    const { size, anchor, offset, indices } = rowResize;
                    const [, scrollOffset] = getDragScrollOffset(offset);
                    const newHeight = Math.round(
                        Math.max(size + y - anchor[1] + scrollOffset, SIZES.minimumHeight * indices.length),
                    );
                    onInvalidateRow?.(indices[0] - 1);
                    onCellHeightChange(
                        indices,
                        indices.map((_) => newHeight / indices.length),
                    );
                }
                return;
            }

            if (draggingSelection) {
                const [anchor] = selection;
                const head = maxXY(dataOffset, pixelToCell(xy));

                const [anchorX, anchorY] = anchor;
                const [headX, headY] = head;

                if (draggingRowSelection) {
                    onSelectionChange?.(
                        [
                            [-1, anchorY],
                            [-1, Math.max(0, headY)],
                        ],
                        false,
                    );
                } else if (draggingColumnSelection) {
                    onSelectionChange?.(
                        [
                            [anchorX, -1],
                            [Math.max(0, headX), -1],
                        ],
                        false,
                    );
                } else {
                    onSelectionChange?.([maxXY(anchor, ORIGIN), maxXY(head, ORIGIN)], false);
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

                onKnobAreaChange?.([
                    [minX, minY],
                    [maxX, maxY],
                ]);
            }

            if (columnDrag || rowDrag) {
                const [x, y] = xy;
                if (columnDrag) {
                    const cellX = pixelToColumn(x, 0.5);
                    const insideSelection = cellX >= minX && cellX <= maxX + 1;
                    const insideGroup = isBoundaryInsideGroup(cellX, columnGroupKeys);

                    const { anchor, offset } = columnDrag;
                    const shift = x - anchor[0];
                    const [scrollOffset] = getDragScrollOffset(offset);

                    onDragOffsetChange?.([shift + scrollOffset, 0]);
                    onDropTargetChange?.(
                        insideSelection || insideGroup
                            ? null
                            : [
                                  [cellX, -1],
                                  [cellX, -1],
                              ],
                    );
                }
                if (rowDrag) {
                    const cellY = pixelToRow(y, 0.5);
                    const insideSelection = cellY >= minY && cellY <= maxY + 1;
                    const insideGroup = isBoundaryInsideGroup(cellY, rowGroupKeys);

                    const { anchor, offset } = rowDrag;
                    const shift = y - anchor[1];
                    const [, scrollOffset] = getDragScrollOffset(offset);

                    onDragOffsetChange?.([0, shift + scrollOffset]);
                    onDropTargetChange?.(
                        insideSelection || insideGroup
                            ? null
                            : [
                                  [-1, cellY],
                                  [-1, cellY],
                              ],
                    );
                }
            }
        },
        [
            getMousePosition,
            getMouseOutOfBounds,
            getMouseHit,
            onCellWidthChange,
            onCellHeightChange,
            onDragIndicesChange,
            onDragOffsetChange,
            onDropTargetChange,
            onSelectionChange,
            onKnobAreaChange,
            onInvalidateRow,
            onInvalidateColumn,
            columnGroupKeys,
            rowGroupKeys,
        ],
    );

    const onClick = useCallback(
        (e: MouseEvent) => {
            const xy = getMousePosition(e);
            if (!xy) return;

            const mouseHit = getMouseHit(xy);

            // Verify if same object was clicked down and up to avoid false clicks due to drags
            if (hitTestDown && mouseHit) {
                if (isSameRectangle(hitTestDown.box, mouseHit.box)) {
                    mouseHit?.item?.onClick?.(e);
                }
            }

            setHitTestDown(null);
        },
        [getMousePosition, getMouseHit, hitTestDown],
    );

    const onDoubleClick = useCallback(
        (e: MouseEvent) => {
            const {
                current: {
                    selection,
                    cellLayout: { pixelToCell, columnToPixel, rowToPixel, getIndentX, getIndentY },
                },
            } = ref;

            e.preventDefault();
            if (e.shiftKey) return;

            const xy = getMousePosition(e);
            if (!xy) return;

            const [x, y] = xy;

            // Double click column divider to autosize
            const indentY = getIndentY();
            const { columns } = visibleCells;
            if (onCellWidthChange && y < indentY) {
                const autosized = [];

                for (const index of columns) {
                    const edge = columnToPixel(index, 1);

                    if (Math.abs(edge - x) < SIZES.resizeZone && canSizeColumn(index)) {
                        const [[minX], [maxX]] = normalizeSelection(selection);

                        // Autosize entire selection if double-clicking a right edge
                        const indices =
                            isColumnSelection(selection) && index >= minX && index <= maxX
                                ? mapSelectionColumns(selection)((i) => i)
                                : [index];

                        autosized.push(...indices);
                    }
                }

                for (const column of autosized) {
                    onInvalidateColumn?.(column - 1);
                }
                onCellWidthChange(
                    autosized,
                    autosized.map((column) => getAutoSizeWidth(column)),
                );
                if (autosized.length) return;
            }

            // Double click row divider to autosize
            const indentX = getIndentX();
            const { rows } = visibleCells;
            if (onCellHeightChange && x < indentX) {
                const autosized = [];

                for (const index of [-1, ...rows]) {
                    const edge = index < 0 ? rowToPixel(0) : rowToPixel(index, 1);

                    if (Math.abs(edge - y) < SIZES.resizeZone && canSizeRow(index)) {
                        const [[, minY], [, maxY]] = normalizeSelection(selection);

                        // Autosize entire selection if double-clicking a right edge
                        const indices =
                            isRowSelection(selection) && index >= minY && index <= maxY
                                ? mapSelectionRows(selection)((i) => i)
                                : [index];

                        autosized.push(...indices);
                    }
                }

                for (const row of autosized) {
                    onInvalidateRow?.(row - 1);
                }
                onCellHeightChange(
                    autosized,
                    autosized.map((row) => getAutoSizeHeight(row)),
                );
                if (autosized.length) return;
            }

            const hitTarget = getMouseHit(xy);
            if (hitTarget) {
                window.document.body.style.cursor = 'pointer';
                return;
            }

            const editCell = pixelToCell(xy);
            if (editMode) onCommit?.();
            onEdit?.(editCell);
        },
        [
            getMousePosition,
            getMouseHit,
            onCommit,
            onEdit,
            onInvalidateColumn,
            onCellWidthChange,
            getAutoSizeWidth,
            visibleCells,
            canSizeColumn,
        ],
    );

    const onContextMenu = useCallback(
        (e: MouseEvent) => {
            const {
                current: {
                    cellLayout: { pixelToCell, getIndentX, getIndentY },
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
        },
        [getMousePosition, onSelectionChange, onPointerMove, onRightClick],
    );

    useLayoutEffect(() => {
        if (!autoScroll) return;

        const loop = () => {
            const { current: element } = elementRef;
            if (!element) return;

            const [x, y] = autoScroll;
            const speed = 4;
            element.scrollLeft += x * speed * 2;
            element.scrollTop += y * speed;
        };

        const timer = setInterval(loop, 33);
        loop();

        return () => {
            clearInterval(timer);
        };
    }, [elementRef, autoScroll]);

    const mouseHandlers = {
        onPointerLeave,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onClick,
        onDoubleClick,
        onContextMenu,
    };

    return { knobPosition, mouseHandlers };
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
};
