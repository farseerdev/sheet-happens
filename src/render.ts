import {
    CellContentRender,
    CellLayout,
    CellPropertyFunction,
    CellPropertyStyledFunction,
    RowOrColumnPropertyFunction,
    RowOrColumnPropertyStyledFunction,
    ImageRenderer,
    InternalSheetStyle,
    Rectangle,
    Selection,
    Style,
    CellContentType,
    VisibleLayout,
    XY,
} from './types';
import { resolveCellFlexLayout, resolveCellAbsoluteLayout } from './cell';
import { normalizeSelection, isEmptySelection, isColumnSelection, isRowSelection } from './coordinate';
import { wrapText } from './text';
import { isInRange, isInRangeLeft, isInRangeCenter } from './util';
import {
    COLORS,
    SIZES,
    DEFAULT_CELL_STYLE,
    DEFAULT_COLUMN_HEADER_STYLE,
    HEADER_SELECTED_STYLE,
    HEADER_GROUP_SELECTED_STYLE,
    HEADER_ACTIVE_STYLE,
    NO_STYLE,
    ONE_ONE,
} from './constants';

export const renderSheet = (
    context: CanvasRenderingContext2D,
    imageRenderer: ImageRenderer,
    cellLayout: CellLayout,
    visibleCells: VisibleLayout,

    sheetStyle: InternalSheetStyle,
    cellStyle: CellPropertyFunction<Style>,

    selection: Rectangle,
    secondarySelections: Selection[],
    isFocused: boolean,

    knobPosition: XY | null,
    knobArea: Rectangle | null,
    dragIndices: [number[] | null, number[] | null],
    dragOffset: XY | null,
    dropTarget: Rectangle | null,

    columnHeaders: RowOrColumnPropertyStyledFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    displayData: CellPropertyStyledFunction<CellContentType>,

    columnGroupKeys: RowOrColumnPropertyFunction<string | number | null>,
    rowGroupKeys: RowOrColumnPropertyFunction<string | number | null>,
    selectedColumnGroups: Set<string | number | null> | null,
    selectedRowGroups: Set<string | number | null> | null,

    dataOffset: XY,
): CellContentRender[] => {
    const { canvas } = context;
    const { width, height } = canvas;
    const {
        hideGridlines,
        hideRowHeaders,
        hideColumnHeaders,
        freezeColumns,
        freezeRows,
        shadowBlur,
        shadowColor,
        shadowOpacity,
    } = sheetStyle;
    const { columns, rows } = visibleCells;
    const { columnToPixel, rowToPixel, columnToAbsolute, rowToAbsolute } = cellLayout;

    const allClickables: CellContentRender[] = [];
    const freeze: XY = [freezeColumns, freezeRows];

    const indentX = columnToAbsolute(0);
    const indentY = rowToAbsolute(0);

    resizeCanvas(canvas);
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    context.shadowColor = '#00000080';

    // Cell fill
    for (const y of rows) {
        for (const x of columns) {
            const left = columnToPixel(x);
            const right = columnToPixel(x, 1);
            const top = rowToPixel(y);
            const bottom = rowToPixel(y, 1);

            const { fillColor } = cellStyle(x, y);
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
    const [selected, hideKnob] = resolveFrozenSelection(selection, cellLayout, freeze, dataOffset);

    // Selection fill
    if (selectionActive) {
        const [[left, top], [right, bottom]] = selected;
        context.fillStyle = COLORS.selectionBackground;
        context.fillRect(left, top, right - left, bottom - top);
    }

    if (!hideRowHeaders) {
        // Row header background
        context.fillStyle = COLORS.headerBackground;
        context.fillRect(0, 0, indentX, context.canvas.height);

        // Row header selection shadow
        if (selectionActive && !columnSelectionActive) {
            const [[, top], [, bottom]] = selected;
            context.fillStyle = COLORS.headerActive;
            context.fillRect(0, top, indentX, bottom - top);
        }
    }

    if (!hideColumnHeaders) {
        // Column header background
        context.fillStyle = COLORS.headerBackground;
        context.fillRect(0, 0, context.canvas.width, indentY);

        // Column header selection shadow
        if (selectionActive && !rowSelectionActive) {
            const [[left], [right]] = selected;
            context.fillStyle = COLORS.headerActive;
            context.fillRect(left, 0, right - left, indentY);
        }
    }

    // Grid
    context.strokeStyle = COLORS.gridLine;
    context.lineWidth = 1;

    const gridRight = hideGridlines ? indentX : context.canvas.width;
    const gridBottom = hideGridlines ? indentY : context.canvas.height;

    const drawGridLineX = (x: number, height: number) => {
        context.beginPath();
        context.moveTo(x - 0.5, 0);
        context.lineTo(x - 0.5, height);
        context.stroke();
    };

    const drawGridLineY = (y: number, width: number) => {
        context.beginPath();
        context.moveTo(0, y - 0.5);
        context.lineTo(width, y - 0.5);
        context.stroke();
    };

    drawGridLineX(indentX, context.canvas.height);
    drawGridLineY(indentY, context.canvas.width);

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

            const groupKey = rowGroupKeys(row);
            const isInRowGroup = groupKey != null && selectedRowGroups?.has(groupKey);

            const isSelfSelected = rowSelectionActive && isActive;
            const isGroupSelected = rowSelectionActive && isInRowGroup;

            const style = isSelfSelected
                ? HEADER_SELECTED_STYLE
                : isGroupSelected
                  ? HEADER_GROUP_SELECTED_STYLE
                  : isActive
                    ? HEADER_ACTIVE_STYLE
                    : NO_STYLE;

            const resolvedStyle = { ...DEFAULT_COLUMN_HEADER_STYLE, ...style };

            const top = rowToPixel(row);
            const bottom = rowToPixel(row, 1);

            const clickables = renderCell(
                context,
                imageRenderer,
                content,
                resolvedStyle,
                0,
                top,
                indentX,
                bottom - top,
            );
            if (clickables) allClickables.push(...clickables);
        }
    }

    // Column header text
    if (!hideColumnHeaders) {
        context.textBaseline = 'middle';

        for (const column of columns) {
            // Column selection mode
            // (this is separate from the header selection shadow because we only want to highlight visible headers)
            const isActive = isInRange(column, minX, maxX);

            const groupKey = columnGroupKeys(column);
            const isInColumnGroup = groupKey != null && selectedColumnGroups?.has(groupKey);

            const isSelected = columnSelectionActive && !rowSelectionActive && (isActive || isInColumnGroup);
            const selectedStyle = isSelected ? HEADER_SELECTED_STYLE : NO_STYLE;
            const activeStyle = isActive ? HEADER_ACTIVE_STYLE : NO_STYLE;
            const style = {
                ...DEFAULT_COLUMN_HEADER_STYLE,
                ...columnHeaderStyle(column),
                ...activeStyle,
                ...selectedStyle,
            };

            const left = columnToPixel(column);
            const right = columnToPixel(column, 1);

            const content = columnHeaders(column, style) ?? excelHeaderString(column + 1);

            const clickables = renderCell(context, imageRenderer, content, style, left, 0, right - left, indentY);
            if (clickables) allClickables.push(...clickables);
        }
    }

    // Selection outline
    if (selectionActive) {
        context.strokeStyle = COLORS.selectionBorder;
        context.lineWidth = 2;
        context.globalAlpha = isFocused ? 1 : 0.5;

        const [[left, top], [right, bottom]] = selected;
        context.strokeRect(left, top, right - left - 1, bottom - top - 1);

        context.globalAlpha = 1;
    }

    for (const secondarySelection of secondarySelections) {
        const selection = secondarySelection.span;
        if (isEmptySelection(selection)) continue;

        const [selected] = resolveFrozenSelection(selection, cellLayout, freeze, dataOffset);
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
        const [dragColumns, dragRows] = dragIndices;

        context.fillStyle = COLORS.dragGhost;

        if (dragColumns) {
            for (const column of dragColumns) {
                const left = columnToPixel(column);
                const right = columnToPixel(column, 1);
                context.fillRect(left + shiftX, 0, right - left, height);
            }
        }
        if (dragRows) {
            for (const row of dragRows) {
                const top = rowToPixel(row);
                const bottom = rowToPixel(row, 1);
                context.fillRect(0, top + shiftY, width, bottom - top);
            }
        }
    }

    // Drop target
    if (dropTarget) {
        let [[left, top], [right, bottom]] = resolveSelection(dropTarget, cellLayout);

        context.strokeStyle = COLORS.dropTarget;
        context.lineWidth = 4;

        if (isColumnSelection(dropTarget)) {
            right = left;
        }
        if (isRowSelection(dropTarget)) {
            bottom = top;
        }
        context.strokeRect(left - 1, top - 1, right - left, bottom - top);
    }

    // Draw frozen row/col shadow
    const [scrollX, scrollY] = dataOffset;
    const hasRowShadow = freezeRows > 0 && scrollY > 0;
    const hasColumnShadow = freezeColumns > 0 && scrollX > 0;
    if (hasRowShadow || hasColumnShadow) {
        if (hasRowShadow) {
            const h = rowToAbsolute(freezeRows);
            const gradient = context.createLinearGradient(0, h, 0, h + shadowBlur);
            halfShadowGradient(gradient, shadowColor, shadowOpacity);
            context.fillStyle = gradient;
            context.fillRect(0, h, width, shadowBlur);
        }
        if (hasColumnShadow) {
            const w = columnToAbsolute(freezeColumns);
            const gradient = context.createLinearGradient(w, 0, w + shadowBlur, 0);
            halfShadowGradient(gradient, shadowColor, shadowOpacity);
            context.fillStyle = gradient;
            context.fillRect(w, 0, shadowBlur, height);
        }
    }

    // Cell contents
    context.textBaseline = 'middle';

    for (const y of rows) {
        for (const x of columns) {
            const left = columnToPixel(x);
            const right = columnToPixel(x, 1);
            const top = rowToPixel(y);
            const bottom = rowToPixel(y, 1);

            const style = {
                ...DEFAULT_CELL_STYLE,
                ...cellStyle(x, y),
            };
            const cellContent = displayData(x, y, style);
            if (cellContent !== null && cellContent !== undefined) {
                const clickables = renderCell(
                    context,
                    imageRenderer,
                    cellContent,
                    style,
                    left,
                    top,
                    right - left,
                    bottom - top,
                );
                if (clickables) allClickables.push(...clickables);
            }
        }
    }

    return allClickables;
};

export const renderCell = (
    context: CanvasRenderingContext2D,
    imageRenderer: ImageRenderer,
    cellContent: CellContentType,
    style: Required<Style>,
    xCoord: number,
    yCoord: number,
    cellWidth: number,
    cellHeight: number,
): CellContentRender[] | null => {
    if (cellContent === null) {
        return null;
    }

    const fillText = context.fillText.bind(context);
    const fontString = style.fontWeight + ' ' + style.fontSize + 'px ' + style.fontFamily;

    context.font = fontString;
    context.fillStyle = style.color;

    // Apply cell margins
    const { marginTop, marginBottom, marginLeft, marginRight, lineHeight } = style;

    const innerX = Math.round(xCoord + marginLeft);
    const innerY = Math.round(yCoord + marginTop);
    const innerWidth = Math.round(cellWidth - marginRight - marginLeft);
    const innerHeight = Math.round(cellHeight - marginTop - marginBottom);

    // Snap to device-pixels for better alignment
    const middleY = roundDpi(yCoord + marginTop + lineHeight / 2);

    if (style.backgroundColor !== '') {
        context.fillStyle = style.backgroundColor;
        context.fillRect(xCoord, yCoord, cellWidth, cellHeight);
        context.fillStyle = style.color;
    }

    if (typeof cellContent === 'string' || typeof cellContent === 'number') {
        clipToBox(context, xCoord, yCoord, cellWidth, cellHeight, () => {
            wrapText(context, cellContent, style, undefined, innerX, middleY, innerWidth, innerHeight, fillText);
        });
        return null;
    } else if (typeof cellContent === 'object') {
        const renderedFlex = resolveCellFlexLayout(context, cellContent, innerX, innerY, innerWidth, innerHeight);
        const renderedAbsolute = resolveCellAbsoluteLayout(cellContent, innerX, innerY, innerWidth, innerHeight);
        const rendered = [...renderedFlex, ...renderedAbsolute];

        for (const render of rendered) {
            const { box, item } = render;

            const [[left, top], [right, bottom]] = box;

            const width = right - left;
            const height = bottom - top;

            if (cellContent.inspect) {
                context.strokeStyle = '#ff00ff';
                context.strokeRect(left, top, width, height);
            }

            clipToBox(context, left, top, width, height, () => {
                if (item.display === 'inline') {
                    const { text } = item;
                    if (text != null) {
                        wrapText(
                            context,
                            text,
                            style,
                            item.textAlign,
                            left,
                            roundDpi(top + lineHeight / 2),
                            width,
                            height,
                            fillText,
                        );
                    }
                }
                if (item.display === 'image' || item.display === 'icon') {
                    imageRenderer(context, item, style, box);
                }
            });
        }

        return rendered.filter(({ item }) => item?.onClick);
    }
    return null;
};

const clipToBox = (
    context: CanvasRenderingContext2D,
    xCoord: number,
    yCoord: number,
    cellWidth: number,
    cellHeight: number,
    callback: () => void,
) => {
    context.save();
    context.beginPath();
    context.rect(xCoord, yCoord, cellWidth, cellHeight);
    context.clip();
    callback();
    context.restore();
};

// Resolve selection into a consistent rectangle, without dealing with frozen rows/columns
const resolveSelection = (selection: Rectangle, cellLayout: CellLayout) => {
    const { cellToPixel } = cellLayout;

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

    return [
        [left, top],
        [right, bottom],
    ];
};

// Resolve selection into a consistent rectangle, handling edge cases around frozen rows/columns.
const resolveFrozenSelection = (
    selection: Rectangle,
    cellLayout: CellLayout,

    freeze: XY,
    offset: XY,
) => {
    const { cellToPixel, columnToAbsolute, rowToAbsolute } = cellLayout;

    const rowSelectionActive = isRowSelection(selection);
    const columnSelectionActive = isColumnSelection(selection);

    const [freezeX, freezeY] = freeze;
    const [offsetX, offsetY] = offset;

    // Get selection range
    const [min, max] = normalizeSelection(selection);
    const [minX, minY] = min;
    const [maxX, maxY] = max;

    // Direct projection to visible grid
    let [left, top] = cellToPixel(min);
    let [right, bottom] = cellToPixel(max, ONE_ONE);

    // Get fixed indent
    const indentX = columnToAbsolute(0);
    const indentY = rowToAbsolute(0);

    // Get frozen edge
    const frozenX = columnToAbsolute(freezeX);
    const frozenY = rowToAbsolute(freezeY);

    let hideKnob = false;

    // If the selection crosses the frozen edge, it needs to always cover the entire frozen area.
    if (isInRangeCenter(freezeX, minX, maxX + 1)) {
        const edge = frozenX;
        if (right <= edge) {
            right = edge;
            hideKnob = true;
        }
    }
    if (isInRangeCenter(freezeY, minY, maxY + 1)) {
        const edge = frozenY;
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
        [
            [left, top],
            [right, bottom],
        ],
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
    }
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

const halfShadowGradient = (gradient: CanvasGradient, rgb: string, opacity: number) => {
    const hex = (x: number) => ('0' + Math.round(x).toString(16)).slice(-2);
    // Half-sine ease
    const ease = (x: number) => 1.0 - Math.sin((x * Math.PI) / 2);
    // Gamma adjustment assuming blend on white
    const adjust = (x: number) => 1.0 - Math.pow(1.0 - x, 2.2);
    for (let i = 0; i <= 16; ++i) {
        const f = i / 16;
        gradient.addColorStop(f, rgb + hex(adjust(opacity * ease(f) * 0.5) * 255));
    }
};

// Move down half a logical pixel on high-dpi
export const getDpiNudge = () => {
    const { devicePixelRatio } = window;
    return (devicePixelRatio - 1) / devicePixelRatio;
};

// Round to device pixels instead of logical pixels, and nudge downwards on high-dpi for baseline alignment
export const roundDpi = (y: number) => {
    const { devicePixelRatio } = window;
    return Math.round((y + getDpiNudge()) * devicePixelRatio) / devicePixelRatio;
};
