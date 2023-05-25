import { CellLayout, CellPropertyFunction, RowOrColumnPropertyFunction, InternalSheetStyle, Rectangle, Selection, Clickable, Style, CellContentType, VisibleLayout, XY } from './types';
import { applyAlignment, resolveCellStyle } from './style';
import { normalizeSelection, isEmptySelection, isRowSelection, isColumnSelection } from './coordinate';
import { isInRange, isInRangeLeft, isInRangeCenter } from './util';
import { COLORS, SIZES, DEFAULT_CELL_STYLE, DEFAULT_COLUMN_HEADER_STYLE, HEADER_SELECTED_STYLE, HEADER_ACTIVE_STYLE, NO_STYLE, ONE_ONE } from './constants';

export const renderSheet = (
    context: CanvasRenderingContext2D,
    cellLayout: CellLayout,
    visibleCells: VisibleLayout,

    sheetStyle: InternalSheetStyle,
    cellStyle: CellPropertyFunction<Style>,

    selection: Rectangle,
    secondarySelections: Selection[],

    knobPosition: XY | null,
    knobArea: Rectangle | null,
    dragOffset: XY | null,
    dropTarget: Rectangle | null,

    columnHeaders: RowOrColumnPropertyFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    displayData: CellPropertyFunction<CellContentType>,

    dataOffset: XY,
): Clickable[] => {
    const {canvas} = context;
    const {width, height} = canvas;
    const {
        hideGridlines,
        hideRowHeaders,
        hideColumnHeaders,
        rowHeaderWidth,
        columnHeaderHeight,
        freezeColumns,
        freezeRows,
    } = sheetStyle;
    const {columns, rows} = visibleCells;
    const {
        columnToPixel,
        rowToPixel,
    } = cellLayout;

    const clickables: Clickable[] = [];

    const freeze: XY = [freezeColumns, freezeRows];
    const indent: XY = [rowHeaderWidth, columnHeaderHeight];

    resizeCanvas(canvas);
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);

    // Cell fill
    for (const y of rows) {
        for (const x of columns) {
            const left = columnToPixel(x);
            const right = columnToPixel(x, 1);
            const top = rowToPixel(y);
            const bottom = rowToPixel(y, 1);

            const {fillColor} = cellStyle(x, y);
            if (fillColor) {
                context.fillStyle = fillColor;
                context.fillRect(left, top, right - left, bottom - top);
            }
        }
    }

    const selectionActive = !isEmptySelection(selection);
    const rowSelectionActive = isRowSelection(selection);
    const columnSelectionActive = isColumnSelection(selection);

    // Get selection range
    const [selected, hideKnob] = resolveFrozenSelection(
        selection,
        cellLayout,
        freeze,
        indent,
        dataOffset,
    );

    // Selection fill
    if (selectionActive) {
        const [[left, top], [right, bottom]] = selected;
        context.fillStyle = COLORS.selectionBackground;
        context.fillRect(left, top, right - left, bottom - top);
    }

    if (!hideRowHeaders) {
        // Row header background
        context.fillStyle = COLORS.headerBackground;
        context.fillRect(0, 0, rowHeaderWidth, context.canvas.height);

        // Row header selection shadow
        if (selectionActive && !columnSelectionActive) {
            const [[, top], [, bottom]] = selected;
            context.fillStyle = COLORS.headerActive;
            context.fillRect(0, top, rowHeaderWidth, bottom - top);
        }
    }

    if (!hideColumnHeaders) {
        // Column header background
        context.fillStyle = COLORS.headerBackground;
        context.fillRect(0, 0, context.canvas.width, columnHeaderHeight);

        // Column header selection shadow
        if (selectionActive && !rowSelectionActive) {
            const [[left], [right]] = selected;
            context.fillStyle = COLORS.headerActive;
            context.fillRect(left, 0, right - left, columnHeaderHeight);
        }
    }

    // Grid
    context.strokeStyle = COLORS.gridLine;
    context.lineWidth = 1;

    const gridRight = hideGridlines ? rowHeaderWidth : context.canvas.width;
    const gridBottom = hideGridlines ? columnHeaderHeight : context.canvas.height;

    const drawGridLineX = (x: number, height: number) => {
        context.beginPath();
        context.moveTo(x - .5, 0);
        context.lineTo(x - .5, height);
        context.stroke();
    };

    const drawGridLineY = (y: number, width: number) => {
        context.beginPath();
        context.moveTo(0, y - .5);
        context.lineTo(width, y - .5);
        context.stroke();
    };

    drawGridLineX(rowHeaderWidth, context.canvas.height);
    drawGridLineY(columnHeaderHeight, context.canvas.width);

    for (const column of columns) {
        const right = columnToPixel(column, 1);
        drawGridLineX(right, gridBottom);
    }

    for (const row of rows) {
        const bottom = rowToPixel(row, 1);
        drawGridLineY(bottom, gridRight);
    }

    const [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);

    // Row header text
    if (!hideRowHeaders) {
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.font = DEFAULT_CELL_STYLE.fontSize + 'px ' + DEFAULT_CELL_STYLE.fontFamily;
        context.fillStyle = COLORS.headerText;

        for (const row of rows) {
            const content = `${row + 1}`;

            // Row selection mode
            // (this is separate from the header selection shadow because we only want to highlight visible headers)
            const isActive = isInRange(row, minY, maxY);
            const isSelected = (rowSelectionActive && !columnSelectionActive) && isActive;
            const style = isSelected ? HEADER_SELECTED_STYLE : isActive ? HEADER_ACTIVE_STYLE : NO_STYLE;

            const top = rowToPixel(row);
            const bottom = rowToPixel(row, 1);

            clickables.push(...renderCell(
                context,
                content,
                style,
                DEFAULT_COLUMN_HEADER_STYLE,
                0,
                top,
                rowHeaderWidth,
                bottom - top,
            ));
        }
    }

    // Column header text
    if (!hideColumnHeaders) {
        context.textBaseline = 'middle';
        context.textAlign = 'center';

        for (const column of columns) {
            const content = columnHeaders(column) ?? excelHeaderString(column + 1);

            // Column selection mode
            // (this is separate from the header selection shadow because we only want to highlight visible headers)
            const isActive = isInRange(column, minX, maxX);
            const selectedStyle = (columnSelectionActive && !rowSelectionActive) && isActive
                ? HEADER_SELECTED_STYLE : NO_STYLE;
            const activeStyle = isActive ? HEADER_ACTIVE_STYLE : NO_STYLE;
            const style = {
                ...columnHeaderStyle(column),
                ...activeStyle,
                ...selectedStyle,
            };

            const left = columnToPixel(column);
            const right = columnToPixel(column, 1);

            clickables.push(...renderCell(
                context,
                content,
                style,
                DEFAULT_COLUMN_HEADER_STYLE,
                left,
                0,
                right - left,
                columnHeaderHeight
            ));
        }
    }

    // Selection outline
    if (selectionActive) {
        context.strokeStyle = COLORS.selectionBorder;
        context.lineWidth = 2;

        const [[left, top], [right, bottom]] = selected;
        context.strokeRect(
            left,
            top,
            right - left - 1,
            bottom - top - 1,
        );
    }

    for (const secondarySelection of secondarySelections) {
        const selection = secondarySelection.span;
        if (isEmptySelection(selection)) continue;

        const [selected] = resolveFrozenSelection(
            selection,
            cellLayout,
            freeze,
            indent,
            dataOffset,
        );
        const [[left, top], [right, bottom]] = selected;

        context.strokeStyle = secondarySelection.color;
        context.lineWidth = 1;
        context.beginPath();
        context.strokeRect(left - 1, top - 1, right - left + 1, bottom - top + 1);
    }

    // Knob drag outline
    if (knobArea) {
        let [[minX, minY], [maxX, maxY]] = normalizeSelection(knobArea);
        const left = columnToPixel(minX);
        const top = rowToPixel(minY);
        const right = columnToPixel(maxX, 1);
        const bottom = rowToPixel(maxY, 1);

        context.strokeStyle = COLORS.knobAreaBorder;
        context.setLineDash([3, 3]);
        context.lineWidth = 1;

        context.strokeRect(left - 1, top - 1, right - left + 1, bottom - top + 1);
        context.setLineDash([]);
    }

    // Selection knob
    if (knobPosition && !hideKnob) {
        const [knobX, knobY] = knobPosition;
        context.fillStyle = COLORS.selectionBorder;
        context.fillRect(knobX - SIZES.knobArea * 0.5, knobY - SIZES.knobArea * 0.5, SIZES.knobArea, SIZES.knobArea);
    }

    // Drag ghost (pixels)
    if (dragOffset) {
        const [shiftX, shiftY] = dragOffset;
        const [[left, top], [right, bottom]] = resolveSelection(selection, cellLayout);

        context.fillStyle = COLORS.dragGhost;
        context.fillRect(left + shiftX, top + shiftY, right - left, bottom - top);
    }

    // Drop target
    if (dropTarget) {
        let [[left, top], [right, bottom]] = resolveSelection(dropTarget, cellLayout);

        context.strokeStyle = COLORS.dropTarget;
        context.lineWidth = 2;

        if (isColumnSelection(dropTarget)) {
            right = left;
        }
        if (isRowSelection(dropTarget)) {
            bottom = top;
        }
        context.strokeRect(left - 1, top - 1, right - left, bottom - top);
    }

    // Cell contents
    context.textBaseline = 'middle';

    for (const y of rows) {
        for (const x of columns) {
            const left = columnToPixel(x);
            const right = columnToPixel(x, 1);
            const top = rowToPixel(y);
            const bottom = rowToPixel(y, 1);

            const cellContent = displayData(x, y);
            if (cellContent !== null && cellContent !== undefined) {
                const style = cellStyle(x, y);
                clickables.push(...renderCell(context, cellContent, style, DEFAULT_CELL_STYLE, left, top, right - left, bottom - top));
            }
        }
    }

    return clickables;
};

export const renderCell = (
    context: CanvasRenderingContext2D,
    cellContent: CellContentType,
    style: Style,
    defaultCellStyle: Required<Style>,
    xCoord: number,
    yCoord: number,
    cellWidth: number,
    cellHeight: number
): Clickable[] => {
    const clickables: Clickable[] = [];

    if (cellContent === null) {
        return clickables;
    }

    const finalStyle = resolveCellStyle(style, defaultCellStyle);
    context.fillStyle = finalStyle.color;
    context.font = finalStyle.weight + ' ' + finalStyle.fontSize + 'px ' + finalStyle.fontFamily;
    context.textAlign = finalStyle.textAlign;

    const yy = Math.floor(yCoord + cellHeight * 0.5);

    context.save();
    context.beginPath();
    context.rect(xCoord, yCoord, cellWidth, cellHeight);
    context.clip();

    if (finalStyle.backgroundColor !== '') {
        context.fillStyle = finalStyle.backgroundColor;
        context.fillRect(xCoord, yCoord, cellWidth, cellHeight);
        context.fillStyle = finalStyle.color;
    }

    if (typeof cellContent === 'string' || typeof cellContent === 'number') {
        const xx = applyAlignment(xCoord, cellWidth, finalStyle, 0);
        const text = '' + cellContent;
        context.fillText(text, xx, yy);
    } else if (typeof cellContent === 'object') {
        for (const obj of cellContent.items) {
            let x = 0;
            let y = 0;
            let w = 0;
            let h = 0;

            if (obj.content instanceof HTMLImageElement) {
                w = obj.width || cellWidth;
                h = obj.height || cellHeight;

                const finalX = applyAlignment(xCoord, cellWidth, finalStyle, w, obj.horizontalAlign);
                x = finalX + obj.x;
                y = yy + obj.y;

                context.drawImage(obj.content, x, y, w, h);
            } else if (typeof obj.content === 'string' || typeof obj.content === 'number') {
                if (obj.horizontalAlign) {
                    context.textAlign = obj.horizontalAlign;
                }
                const finalX = applyAlignment(xCoord, cellWidth, finalStyle, 0, obj.horizontalAlign);
                const text = '' + obj.content;

                const left = finalX + obj.x;
                const top = yy + obj.y;
                context.fillText(text, left, top);

                const measure = context.measureText(text);
                x = left - measure.actualBoundingBoxLeft;
                y = top - measure.actualBoundingBoxAscent;
                w = left + measure.actualBoundingBoxRight - x;
                h = top + measure.actualBoundingBoxDescent - y;
            }
            if (obj.onClick) {
                clickables.push({
                    rect: [[x, y], [x + w, y + h]],
                    obj,
                });
            }
        }
    }
    context.restore();

    return clickables;
};

// Resolve selection into a consistent rectangle, without dealing with frozen rows/columns
const resolveSelection = (
    selection: Rectangle,
    cellLayout: CellLayout,
) => {
    const {cellToPixel} = cellLayout;

    const rowSelectionActive = isRowSelection(selection);
    const columnSelectionActive = isColumnSelection(selection);

    // Get selection range
    const [min, max] = normalizeSelection(selection);

    // Direct projection to visible grid
    let [left, top] = cellToPixel(min);
    let [right, bottom] = cellToPixel(max, ONE_ONE);

    // Extend full row/column selection infinitely right/down
    if (rowSelectionActive) {
        right = 1e5;
    }
    if (columnSelectionActive) {
        bottom = 1e5;
    }

    return [[left, top], [right, bottom]];
};

// Resolve selection into a consistent rectangle, handling edge cases around frozen rows/columns.
const resolveFrozenSelection = (
    selection: Rectangle,
    cellLayout: CellLayout,

    freeze: XY,
    indent: XY,
    offset: XY,
) => {
    const {cellToPixel, columnToAbsolute, rowToAbsolute} = cellLayout;

    const rowSelectionActive = isRowSelection(selection);
    const columnSelectionActive = isColumnSelection(selection);

    const [freezeX, freezeY] = freeze;
    const [indentX, indentY] = indent;
    const [offsetX, offsetY] = offset;

    // Get selection range
    const [min, max] = normalizeSelection(selection);
    const [minX, minY] = min;
    const [maxX, maxY] = max;

    // Direct projection to visible grid
    let [left, top] = cellToPixel(min);
    let [right, bottom] = cellToPixel(max, ONE_ONE);

    // Get frozen edge
    const frozenX = columnToAbsolute(freezeX);
    const frozenY = rowToAbsolute(freezeY);

    let hideKnob = false;

    // If the selection crosses the frozen edge, it needs to always cover the entire frozen area.
    if (isInRangeCenter(freezeX, minX, maxX + 1)) {
        const edge = indentX + frozenX;
        if (right <= edge) {
            right = edge;
            hideKnob = true;
        }
    }
    if (isInRangeCenter(freezeY, minY, maxY + 1)) {
        const edge = indentY + frozenY;
        if (bottom <= edge) {
            bottom = edge;
            hideKnob = true;
        }
    }

    // If the selection starts/ends under the frozen area, treat as off-screen
    if (isInRangeLeft(minX, freezeX, offsetX + freezeX)) {
        left = -1e5;

        const lastInvisibleX = offsetX + freezeX - 1;
        if (maxX <= lastInvisibleX) {
            if (maxX === lastInvisibleX) right = indentX;
            else right = -1e5;
            hideKnob = true;
        }
    }
    if (isInRangeLeft(minY, freezeY, offsetY + freezeY)) {
        top = -1e5;

        const lastInvisibleY = offsetY + freezeY - 1;
        if (maxY <= lastInvisibleY) {
            if (maxY === lastInvisibleY) bottom = indentY;
            else bottom = -1e5;
            hideKnob = true;
        }
    }

    if (rowSelectionActive && offsetX > 0) {
        hideKnob = true;
    }
    if (columnSelectionActive && offsetY > 0) {
        hideKnob = true;
    }

    // Extend full row/column selection infinitely right/down
    if (rowSelectionActive) {
        right = 1e5;
    }
    if (columnSelectionActive) {
        bottom = 1e5;
    }

    return [
        [[left, top], [right, bottom]],
        hideKnob,
    ] as [Rectangle, boolean];
};

const resizeCanvas = (canvas: HTMLCanvasElement) => {
    const { width, height } = canvas.getBoundingClientRect();
    let { devicePixelRatio: ratio = 1 } = window;
    if (ratio < 1) {
        ratio = 1;
    }
    const newCanvasWidth = Math.round(width * ratio);
    const newCanvasHeight = Math.round(height * ratio);

    if (canvas.width !== newCanvasWidth || canvas.height !== newCanvasHeight) {
        const context = canvas.getContext('2d');
        if (context) {
            canvas.width = newCanvasWidth;
            canvas.height = newCanvasHeight;
            context.scale(ratio, ratio);
        }
        return true;
    }

    return false;
};

const excelHeaderString = (num: number) => {
    let s = '';
    let t = 0;
    while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = ((num - t) / 26) | 0;
    }
    return s || '';
};
