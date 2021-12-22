import styles from './styles.module.css';
import React, {
    useRef,
    useEffect,
    useState,
    useMemo,
    MouseEvent,
    KeyboardEvent,
    UIEvent,
    CSSProperties,
    ReactElement,
} from 'react';
import useResizeObserver from 'use-resize-observer';

const selBorderColor = '#1b73e7';
const selBackColor = '#e9f0fd';
const knobSize = 6;
const gridColor = '#e2e3e3';
const knobAreaBorderColor = '#707070';
const rowHeaderWidth = 50;
const rowHeaderBackgroundColor = '#f8f9fa';
const rowHeaderTextColor = '#666666';
const rowHeaderSelectedBackgroundColor = '#e8eaed';
const columnHeaderHeight = 22;
const columnHeaderBackgroundColor = rowHeaderBackgroundColor;
const columnHeaderSelectedBackgroundColor = rowHeaderSelectedBackgroundColor;
const xBinSize = 10;
const yBinSize = 10;
const scrollSpeed = 30;
const resizeColumnRowMouseThreshold = 4;
const minimumColumnWidth = 50;
const minimumRowHeight = 22;

const defaultCellStyle: Required<Style> = {
    textAlign: 'left',
    fontSize: 13,
    marginRight: 5,
    marginLeft: 5,
    color: '#000',
    fontFamily: 'sans-serif',
    weight: '',
    fillColor: '',
    backgroundColor: '',
};

const defaultColumnHeaderStyle: Required<Style> = {
    textAlign: 'center',
    fontSize: 13,
    marginRight: 5,
    marginLeft: 5,
    color: '#000',
    fontFamily: 'sans-serif',
    weight: '',
    fillColor: '',
    backgroundColor: '',
};

type PropTypes = string | number | boolean | Style | CellContentType;
type RowOrColumnProperty<T extends PropTypes> = T | Array<T> | ((index: number) => T);
type CellProperty<T extends PropTypes> = T | Array<Array<T>> | ((x: number, y: number) => T);
type CellContentType = null | number | string | CellContent;
type RowOrColumnPropertyFunction<T extends PropTypes> = (rowOrColIndex: number) => T;
type CellPropertyFunction<T extends PropTypes> = (x: number, y: number) => T;
type InputStyle = Pick<
    CSSProperties,
    | 'position'
    | 'top'
    | 'left'
    | 'width'
    | 'height'
    | 'outline'
    | 'border'
    | 'textAlign'
    | 'color'
    | 'fontSize'
    | 'fontFamily'
>;
export interface SheetInputProps {
    value: string;
    autoFocus: boolean;
    onKeyDown: React.KeyboardEventHandler<HTMLElement>;
    onChange: (valiue: string) => void;
    style: InputStyle;
}
interface CellCoordinate {
    x: number;
    y: number;
}

interface Selection {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export interface Change {
    x: number;
    y: number;
    value: string | number | null;
}

export interface CellContentItem {
    content: HTMLImageElement | string | number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    horiozntalAlign?: 'left' | 'right' | 'center';
    onClick?: () => void;
}

export interface CellContent {
    items: Array<CellContentItem>;
}

export interface SheetMouseEvent extends MouseEvent {
    cellX: number;
    cellY: number;
}

export interface SheetProps {
    freezeColumns?: number;
    freezeRows?: number;
    cellWidth?: RowOrColumnProperty<number>;
    cellHeight?: RowOrColumnProperty<number>;
    columnHeaders?: RowOrColumnProperty<CellContentType>;
    columnHeaderStyle?: RowOrColumnProperty<Style>;
    cellStyle?: CellProperty<Style>;
    readOnly?: CellProperty<boolean>;
    sourceData?: CellProperty<string | number | null>;
    displayData?: CellProperty<CellContentType>;
    editData?: CellProperty<string>;
    inputComponent?: (
        x: number,
        y: number,
        props: SheetInputProps,
        commitEditingCell?: () => void
    ) => ReactElement | undefined;
    onSelectionChanged?: (x1: number, y1: number, x2: number, y2: number) => void;
    onRightClick?: (e: SheetMouseEvent) => void;
    onChange?: (changes: Array<Change>) => void;
    onCellWidthChange?: (index: number, value: number) => void;
    onCellHeightChange?: (index: number, value: number) => void;
}

export interface Style {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'right' | 'left' | 'center';
    marginRight?: number;
    marginLeft?: number;
    weight?: string;
    fillColor?: string;
    backgroundColor?: string;
}

interface RowOrColumnSize {
    index: number[];
    start: number[];
    end: number[];
}

function resizeCanvas(canvas: HTMLCanvasElement) {
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
}

// todo first figure out the function
function createRowOrColumnPropFunction<T extends PropTypes>(
    rowColProp: RowOrColumnProperty<T> | undefined,
    defaultValue: T
): RowOrColumnPropertyFunction<T> {
    if (Array.isArray(rowColProp)) {
        return (rowOrColIndex: number) => {
            if (rowOrColIndex >= 0 && rowOrColIndex < rowColProp.length) {
                return rowColProp[rowOrColIndex];
            } else {
                return defaultValue;
            }
        };
    } else if (typeof rowColProp === 'function') {
        return rowColProp;
    } else if (rowColProp !== null && rowColProp !== undefined) {
        return () => rowColProp;
    } else {
        return () => defaultValue;
    }
}

function createCellPropFunction<T extends PropTypes>(
    cellProp: CellProperty<T> | undefined,
    defaultValue: T
): CellPropertyFunction<T> {
    if (Array.isArray(cellProp)) {
        return (x: number, y: number) => {
            if (y >= 0 && y < cellProp.length) {
                if (x >= 0 && x < cellProp[y].length) {
                    return cellProp[y][x];
                } else {
                    return defaultValue;
                }
            } else {
                return defaultValue;
            }
        };
    } else if (typeof cellProp === 'function') {
        return cellProp;
    } else if (cellProp !== null && cellProp !== undefined) {
        return () => cellProp;
    } else {
        return () => defaultValue;
    }
}

function applyAlignment(
    start: number,
    cellSize: number,
    style: Required<Style>,
    imageWidth: number,
    alignment?: 'left' | 'center' | 'right'
): number {
    if (!alignment) {
        alignment = style.textAlign;
    }
    if (alignment === 'left') {
        return start + style.marginLeft;
    } else if (alignment === 'center') {
        return start + cellSize * 0.5 - imageWidth / 2;
    } else if (alignment === 'right') {
        return start + (cellSize - style.marginRight - imageWidth);
    }
    return start;
}

function drawCell(
    context: CanvasRenderingContext2D,
    cellContent: CellContentType,
    style: Style,
    defaultCellStyle: Required<Style>,
    xCoord: number,
    yCoord: number,
    cellWidth: number,
    cellHeight: number
) {
    if (cellContent === null) {
        return;
    }
    const finalStyle = createStyleObject(style, defaultCellStyle);
    context.fillStyle = finalStyle.color;
    context.font = finalStyle.weight + ' ' + finalStyle.fontSize + 'px ' + finalStyle.fontFamily;
    context.textAlign = finalStyle.textAlign;

    const yy = yCoord + cellHeight * 0.5;

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
        context.fillText('' + cellContent, xx, yy);
    } else if (typeof cellContent === 'object') {
        for (const obj of cellContent.items) {
            if (obj.content instanceof HTMLImageElement) {
                const w = obj.width || cellWidth;
                const finalX = applyAlignment(xCoord, cellWidth, finalStyle, w, obj.horiozntalAlign);
                context.drawImage(
                    obj.content,
                    finalX + obj.x,
                    yy + obj.y,
                    obj.width || cellWidth,
                    obj.height || cellHeight
                );
            } else if (typeof obj.content === 'string' || typeof obj.content === 'number') {
                if (obj.horiozntalAlign) {
                    context.textAlign = obj.horiozntalAlign;
                }
                const finalX = applyAlignment(xCoord, cellWidth, finalStyle, 0, obj.horiozntalAlign);
                context.fillText('' + obj.content, finalX + obj.x, yy + obj.y);
            }
        }
    }
    context.restore();
}

function calculateRowsOrColsSizes(
    freezeCount: number,
    size: (index: number) => number,
    startingSize: number,
    startingIndex: number,
    visibleArea: number
): RowOrColumnSize {
    const visible = [];
    const start = [];
    const end = [];
    let prev = 0;

    start.push(startingSize);
    visible.push(freezeCount > 0 ? 0 : startingIndex);
    let firstSize = freezeCount > 0 ? size(0) : size(startingIndex);
    prev = startingSize + firstSize;
    end.push(prev);

    let ind = freezeCount > 0 ? 1 : startingIndex + 1;

    if (freezeCount > 0) {
        for (; ind < freezeCount; ind++) {
            visible.push(ind);
            start.push(prev);
            prev = prev + size(ind);
            end.push(prev);
        }
        ind = Math.max(startingIndex, freezeCount);
    }

    while (true) {
        visible.push(ind);
        start.push(prev);
        prev = prev + size(ind);
        end.push(prev);
        if (end[end.length - 1] >= visibleArea) {
            break;
        }
        ind++;
    }
    return {
        index: visible,
        start,
        end,
    };
}

function createStyleObject(optionalStyle: Style, defaultStyle: Required<Style>): Required<Style> {
    return {
        ...defaultStyle,
        ...optionalStyle,
    };
}

function excelHeaderString(num: number) {
    let s = '';
    let t = 0;
    while (num > 0) {
        t = (num - 1) % 26;
        s = String.fromCharCode(65 + t) + s;
        num = ((num - t) / 26) | 0;
    }
    return s || '';
}

function absCoordianteToCell(
    absX: number,
    absY: number,
    rowSizes: RowOrColumnSize,
    columnSizes: RowOrColumnSize
): CellCoordinate {
    let cellX = 0;
    let cellY = 0;

    for (let i = 0; i < columnSizes.index.length; i++) {
        if (absX >= columnSizes.start[i] && absX <= columnSizes.end[i]) {
            cellX = columnSizes.index[i];
            break;
        }
    }
    for (let i = 0; i < rowSizes.index.length; i++) {
        if (absY >= rowSizes.start[i] && absY <= rowSizes.end[i]) {
            cellY = rowSizes.index[i];
            break;
        }
    }

    return { x: cellX, y: cellY };
}

function cellToAbsCoordinate(
    cellX: number,
    cellY: number,
    rowSizes: RowOrColumnSize,
    columnSizes: RowOrColumnSize,
    dataOffset: CellCoordinate,
    cellWidth: RowOrColumnPropertyFunction<number>,
    cellHeight: RowOrColumnPropertyFunction<number>
): CellCoordinate {
    let absX = rowHeaderWidth;
    const indX = columnSizes.index.findIndex((i) => i === cellX);
    if (indX !== -1) {
        absX = columnSizes.start[indX];
    } else {
        for (let i = 0; i < dataOffset.x; i++) {
            absX -= cellWidth(i);
        }
        for (let i = 0; i < cellX; i++) {
            absX += cellWidth(i);
        }
    }

    let absY = columnHeaderHeight;
    const indY = rowSizes.index.findIndex((i) => i === cellY);
    if (indY !== -1) {
        absY = rowSizes.start[indY];
    } else {
        for (let i = 0; i < dataOffset.y; i++) {
            absY -= cellHeight(i);
        }
        for (let i = 0; i < cellY; i++) {
            absY += cellHeight(i);
        }
    }
    return { x: absX, y: absY };
}

function renderOnCanvas(
    context: CanvasRenderingContext2D,
    rowSizes: RowOrColumnSize,
    columnSizes: RowOrColumnSize,
    cellStyle: CellPropertyFunction<Style>,
    cellWidth: RowOrColumnPropertyFunction<number>,
    cellHeight: RowOrColumnPropertyFunction<number>,
    selection: Selection,
    knobDragInProgress: boolean,
    columnHeaders: RowOrColumnPropertyFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    knobArea: Selection,
    displayData: CellPropertyFunction<CellContentType>,
    dataOffset: CellCoordinate
) {
    resizeCanvas(context.canvas);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    // apply cell fill color
    let yCoord1 = columnHeaderHeight;
    for (const y of rowSizes.index) {
        let xCoord1 = rowHeaderWidth;
        for (const x of columnSizes.index) {
            const style = cellStyle(x, y);
            if (style.fillColor) {
                context.fillStyle = style.fillColor;
                context.fillRect(xCoord1, yCoord1, cellWidth(x), cellHeight(y));
            }
            xCoord1 += cellWidth(x);
        }
        yCoord1 += cellHeight(y);
    }

    let hideKnob = false;

    let selx1 = selection.x1;
    let selx2 = selection.x2;

    if (selection.x1 > selection.x2) {
        selx1 = selection.x2;
        selx2 = selection.x1;
    }

    let sely1 = selection.y1;
    let sely2 = selection.y2;

    if (selection.y1 > selection.y2) {
        sely1 = selection.y2;
        sely2 = selection.y1;
    }

    const selectionActive = selx1 !== -1 && selx2 !== -1 && sely1 !== -1 && sely2 !== -1;

    const p1 = cellToAbsCoordinate(selx1, sely1, rowSizes, columnSizes, dataOffset, cellWidth, cellHeight);
    const p2 = cellToAbsCoordinate(selx2, sely2, rowSizes, columnSizes, dataOffset, cellWidth, cellHeight);
    p2.x += cellWidth(selx2);
    p2.y += cellHeight(sely2);

    if (p1.x >= p2.x) {
        // recalculate if the selection span covers both frozen and unfrozen columns
        p2.x = p1.x;
        let currentCol = selx1;
        while (columnSizes.index.includes(currentCol)) {
            p2.x += cellWidth(currentCol);
            currentCol++;
        }
        hideKnob = true;
    }

    if (p1.y >= p2.y) {
        // recalculate if the selection span covers both frozen and unfrozen rows
        p2.y = p1.y;
        let currentRow = sely1;
        while (rowSizes.index.includes(currentRow)) {
            p2.y += cellHeight(currentRow);
            currentRow++;
        }
        hideKnob = true;
    }

    // selection fill
    if (selectionActive) {
        context.fillStyle = selBackColor;
        context.fillRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    }

    // row header background
    context.fillStyle = rowHeaderBackgroundColor;
    context.fillRect(0, 0, rowHeaderWidth, context.canvas.height);

    // row header selection
    if (selectionActive) {
        context.fillStyle = rowHeaderSelectedBackgroundColor;
        context.fillRect(0, p1.y, rowHeaderWidth, p2.y - p1.y);
    }

    // column header background
    context.fillStyle = columnHeaderBackgroundColor;
    context.fillRect(0, 0, context.canvas.width, columnHeaderHeight);

    // column header selection
    if (selectionActive) {
        context.fillStyle = columnHeaderSelectedBackgroundColor;
        context.fillRect(p1.x, 0, p2.x - p1.x, columnHeaderHeight);
    }

    // grid
    context.strokeStyle = gridColor;
    context.lineWidth = 1;
    let startX = rowHeaderWidth;

    for (const col of columnSizes.index) {
        context.beginPath();
        context.moveTo(startX, 0);
        context.lineTo(startX, context.canvas.height);
        context.stroke();
        startX += cellWidth(col);
    }

    let startY = columnHeaderHeight;
    for (const row of rowSizes.index) {
        context.beginPath();
        context.moveTo(0, startY);
        context.lineTo(context.canvas.width, startY);
        context.stroke();
        startY += cellHeight(row);
    }

    // row header text
    startY = columnHeaderHeight;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.font = defaultCellStyle.fontSize + 'px ' + defaultCellStyle.fontFamily;
    context.fillStyle = rowHeaderTextColor;
    for (const row of rowSizes.index) {
        const xx = rowHeaderWidth * 0.5;
        const yy = startY + cellHeight(row) * 0.5;
        const cellContent = row + 1;
        context.fillText('' + cellContent, xx, yy);
        startY += cellHeight(row);
    }

    // column header text
    startX = rowHeaderWidth;
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    for (const col of columnSizes.index) {
        const cw = cellWidth(col);
        const ch = columnHeaders(col);
        const chcontent = ch !== null ? ch : excelHeaderString(col + 1);
        const chStyle = columnHeaderStyle(col);
        drawCell(context, chcontent, chStyle, defaultColumnHeaderStyle, startX, 0, cw, columnHeaderHeight);
        startX += cw;
    }

    // selection outline
    if (selectionActive) {
        context.strokeStyle = selBorderColor;
        context.lineWidth = 1;
        context.beginPath();
        context.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        context.stroke();
    }

    // knob drag outline
    if (knobDragInProgress) {
        let kx1 = knobArea.x1;
        let kx2 = knobArea.x2;
        if (knobArea.x1 > knobArea.x2) {
            kx1 = knobArea.x2;
            kx2 = knobArea.x1;
        }

        let ky1 = knobArea.y1;
        let ky2 = knobArea.y2;
        if (knobArea.y1 > knobArea.y2) {
            ky1 = knobArea.y2;
            ky2 = knobArea.y1;
        }
        const knobPoint1 = cellToAbsCoordinate(kx1, ky1, rowSizes, columnSizes, dataOffset, cellWidth, cellHeight);
        const knobPoint2 = cellToAbsCoordinate(
            kx2 + 1,
            ky2 + 1,
            rowSizes,
            columnSizes,
            dataOffset,
            cellWidth,
            cellHeight
        );
        context.strokeStyle = knobAreaBorderColor;
        context.setLineDash([3, 3]);
        context.lineWidth = 1;
        context.beginPath();
        context.rect(knobPoint1.x, knobPoint1.y - 1, knobPoint2.x - knobPoint1.x, knobPoint2.y - knobPoint1.y);
        context.stroke();
        context.setLineDash([]);
    }

    // selection knob
    if (selectionActive && !hideKnob) {
        context.fillStyle = selBorderColor;
        context.fillRect(p2.x - knobSize * 0.5, p2.y - knobSize * 0.5, knobSize, knobSize);
    }

    // content
    context.textBaseline = 'middle';

    // draw content
    let yCoord = columnHeaderHeight;
    for (const y of rowSizes.index) {
        let xCoord = rowHeaderWidth;
        const ch = cellHeight(y);
        for (const x of columnSizes.index) {
            const cellContent = displayData(x, y);
            const cw = cellWidth(x);
            if (cellContent !== null && cellContent !== undefined) {
                const style = cellStyle(x, y);
                drawCell(context, cellContent, style, defaultCellStyle, xCoord, yCoord, cw, ch);
            }
            xCoord += cw;
        }
        yCoord += ch;
    }
}

function Sheet(props: SheetProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const copyPasteTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const [maxScroll, setMaxScroll] = useState({ x: 5000, y: 5000 });
    const [dataOffset, setDataOffset] = useState({ x: 0, y: 0 });
    const [selection, setSelection] = useState({ x1: -1, y1: -1, x2: -1, y2: -1 });
    const [knobArea, setKnobArea] = useState({ x1: -1, y1: -1, x2: -1, y2: -1 });
    const [editCell, setEditCell] = useState({ x: -1, y: -1 });
    const [editValue, setEditValue] = useState<string | number>('');
    const [arrowKeyCommitMode, setArrowKeyCommitMode] = useState(false);
    const [shiftKeyDown, setShiftKeyDown] = useState(false);
    const [knobDragInProgress, setKnobDragInProgress] = useState(false);
    const [selectionInProgress, setSelectionInProgress] = useState(false);
    const [columnResize, setColumnResize] = useState<any>(null);
    const [rowResize, setRowResize] = useState<any>(null);
    const [rowSelectionInProgress, setRowSelectionInProgress] = useState(false);
    const [columnSelectionInProgress, setColumnSelectionInProgress] = useState(false);
    const [buttonClickMouseDownCoordinates, setButtonClickMouseDownCoordinates] = useState<any>({
        x: -1,
        y: -1,
        hitTarget: null,
    });
    const { width: canvasWidth = 3000, height: canvasHeight = 3000 } = useResizeObserver({ ref: canvasRef });

    const freezeColumns = props.freezeColumns || 0;
    const freezeRows = props.freezeRows || 0;

    const cellWidth = useMemo(() => createRowOrColumnPropFunction(props.cellWidth, 100), [props.cellWidth]);
    const cellHeight = useMemo(() => createRowOrColumnPropFunction(props.cellHeight, 22), [props.cellHeight]);
    const columnHeaders = useMemo(() => createRowOrColumnPropFunction(props.columnHeaders, null), [
        props.columnHeaders,
    ]);
    const columnHeaderStyle = useMemo(() => createRowOrColumnPropFunction(props.columnHeaderStyle, {}), [
        props.columnHeaderStyle,
    ]);

    const cellReadOnly = useMemo(() => createCellPropFunction(props.readOnly, false), [props.readOnly]);

    const sourceData = useMemo(() => createCellPropFunction(props.sourceData, null), [props.sourceData]);
    const displayData = useMemo(() => createCellPropFunction(props.displayData, ''), [props.displayData]);
    const editData = useMemo(() => createCellPropFunction(props.editData, ''), [props.editData]);
    const cellStyle = useMemo(() => createCellPropFunction(props.cellStyle, defaultCellStyle), [props.cellStyle]);

    const columnSizes = useMemo(
        () => calculateRowsOrColsSizes(freezeColumns, cellWidth, rowHeaderWidth, dataOffset.x, canvasWidth),
        [props.freezeColumns, cellWidth, dataOffset.x, canvasWidth]
    );

    const rowSizes = useMemo(
        () => calculateRowsOrColsSizes(freezeRows, cellHeight, columnHeaderHeight, dataOffset.y, canvasHeight),
        [props.freezeRows, cellHeight, dataOffset.y, canvasHeight]
    );

    const changeSelection = (x1: number, y1: number, x2: number, y2: number, scrollToP2 = true) => {
        setSelection({ x1, y1, x2, y2 });

        if (scrollToP2) {
            const newDataOffset = { x: dataOffset.x, y: dataOffset.y };
            let newScrollLeft = -1;
            let newScrollTop = -1;

            if (!columnSizes.index.includes(x2) || columnSizes.index[columnSizes.index.length - 1] === x2) {
                const increment = columnSizes.index[columnSizes.index.length - 1] <= x2 ? 1 : -1;
                const newX = Math.max(dataOffset.x, freezeColumns) + increment;
                newDataOffset.x = newX;
                newScrollLeft = newX * scrollSpeed;
            }

            if (!rowSizes.index.includes(y2) || rowSizes.index[rowSizes.index.length - 1] === y2) {
                const increment = rowSizes.index[rowSizes.index.length - 1] <= y2 ? 1 : -1;
                const newY = Math.max(dataOffset.y, freezeRows) + increment;
                newDataOffset.y = newY;
                newScrollTop = newY * scrollSpeed;
            }

            if (newDataOffset.x !== dataOffset.x || dataOffset.y !== newDataOffset.y) {
                setDataOffset({ x: newDataOffset.x, y: newDataOffset.y });
                setTimeout(() => {
                    if (overlayRef.current) {
                        if (newScrollLeft !== -1) {
                            overlayRef.current.scrollLeft = newScrollLeft;
                        }
                        if (newScrollTop !== -1) {
                            overlayRef.current.scrollTop = newScrollTop;
                        }
                    }
                }, 0);
            }
        }

        if (props.onSelectionChanged) {
            let sx1 = x1;
            let sy1 = y1;
            let sx2 = x2;
            let sy2 = y2;
            if (sx1 > sx2) {
                sx1 = x2;
                sx2 = x1;
            }
            if (sy1 > sy2) {
                sy1 = y2;
                sy2 = y1;
            }
            props.onSelectionChanged(sx1, sy1, sx2, sy2);
        }
    };

    const knobCoordinates = useMemo(() => {
        if (selection.x2 !== -1 && selection.y2 !== -1) {
            let selx2 = selection.x2;
            if (selection.x1 > selection.x2) {
                selx2 = selection.x1;
            }

            let sely2 = selection.y2;
            if (selection.y1 > selection.y2) {
                sely2 = selection.y1;
            }
            const c = cellToAbsCoordinate(selx2, sely2, rowSizes, columnSizes, dataOffset, cellWidth, cellHeight);
            return { x: c.x + cellWidth(selx2), y: c.y + cellHeight(sely2) };
        }
        return { x: -1, y: -1 };
    }, [selection, rowSizes, columnSizes, dataOffset, cellWidth, cellHeight]);

    const hitMap = useMemo(() => {
        const hitM = {};
        const canvas = canvasRef.current;
        if (!canvas) {
            return hitM;
        }
        resizeCanvas(canvas);
        let yCoord = columnHeaderHeight;
        let xCoord = rowHeaderWidth;

        for (const x of columnSizes.index) {
            const ch = columnHeaders(x);
            const cellW = cellWidth(x);
            if (ch && typeof ch === 'object' && ch.items) {
                let finalStyle;
                for (const obj of ch.items) {
                    if (obj.onClick) {
                        if (!finalStyle) {
                            finalStyle = createStyleObject(columnHeaderStyle(x), defaultCellStyle);
                        }
                        const w = obj.content instanceof HTMLImageElement ? obj.width || cellW : 0;
                        const absX1 = applyAlignment(xCoord, cellW, finalStyle, w, obj.horiozntalAlign) + obj.x;
                        const absY1 = columnHeaderHeight * 0.5 + obj.y;
                        const absX2 = absX1 + (obj.width || 0);
                        const absY2 = absY1 + (obj.height || 0);

                        const hitTarget = {
                            x: absX1,
                            y: absY1,
                            w: obj.width,
                            h: obj.height,
                            onClick: obj.onClick,
                        };

                        // add to hit map
                        const x1key = Math.floor(absX1 / xBinSize);
                        const x2key = Math.floor(absX2 / xBinSize);

                        const y1key = Math.floor(absY1 / yBinSize);
                        const y2key = Math.floor(absY2 / yBinSize);

                        for (let xkey = x1key; xkey <= x2key; xkey++) {
                            if (!hitM[xkey]) {
                                hitM[xkey] = {};
                            }
                            const xbin = hitM[xkey];
                            for (let ykey = y1key; ykey <= y2key; ykey++) {
                                if (!xbin[ykey]) {
                                    xbin[ykey] = [];
                                }
                                xbin[ykey].push(hitTarget);
                            }
                        }
                    }
                }
            }
            xCoord += cellW;
        }

        for (const y of rowSizes.index) {
            xCoord = rowHeaderWidth;
            for (const x of columnSizes.index) {
                const cellContent = displayData(x, y);
                const cellW = cellWidth(x);
                if (cellContent === null || cellContent === undefined) {
                    xCoord += cellW;
                    continue;
                }

                const xx = xCoord;
                const yy = yCoord + cellHeight(y) * 0.5;

                if (typeof cellContent === 'object' && cellContent.items) {
                    let finalStyle;
                    for (const obj of cellContent.items) {
                        if (obj.onClick) {
                            if (!finalStyle) {
                                finalStyle = createStyleObject(cellStyle(x, y), defaultCellStyle);
                            }
                            const w = obj.content instanceof HTMLImageElement ? obj.width || cellW : 0;
                            const absX1 = applyAlignment(xx, cellW, finalStyle, w, obj.horiozntalAlign) + obj.x;
                            const absY1 = yy + obj.y;
                            const absX2 = absX1 + (obj.width || 0);
                            const absY2 = absY1 + (obj.height || 0);

                            const hitTarget = {
                                x: absX1,
                                y: absY1,
                                w: obj.width,
                                h: obj.height,
                                onClick: obj.onClick,
                            };

                            // add to hit map
                            const x1key = Math.floor(absX1 / xBinSize);
                            const x2key = Math.floor(absX2 / xBinSize);

                            const y1key = Math.floor(absY1 / yBinSize);
                            const y2key = Math.floor(absY2 / yBinSize);

                            for (let xkey = x1key; xkey <= x2key; xkey++) {
                                if (!hitM[xkey]) {
                                    hitM[xkey] = {};
                                }
                                const xbin = hitM[xkey];
                                for (let ykey = y1key; ykey <= y2key; ykey++) {
                                    if (!xbin[ykey]) {
                                        xbin[ykey] = [];
                                    }
                                    xbin[ykey].push(hitTarget);
                                }
                            }
                        }
                    }
                }
                xCoord += cellW;
            }
            yCoord += cellHeight(y);
        }
        return hitM;
    }, [displayData, props.cellWidth, props.cellHeight, canvasRef, columnSizes, rowSizes, dataOffset.x, dataOffset.y]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }
        let animationFrameId = window.requestAnimationFrame(() => {
            renderOnCanvas(
                context,
                rowSizes,
                columnSizes,
                cellStyle,
                cellWidth,
                cellHeight,
                selection,
                knobDragInProgress,
                columnHeaders,
                columnHeaderStyle,
                knobArea,
                displayData,
                dataOffset
            );
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [
        canvasRef,
        rowSizes,
        columnSizes,
        cellStyle,
        cellWidth,
        cellHeight,
        selection,
        knobDragInProgress,
        columnHeaders,
        columnHeaderStyle,
        knobArea,
        displayData,
        dataOffset,
    ]);

    const setFocusToTextArea = () => {
        if (copyPasteTextAreaRef.current) {
            copyPasteTextAreaRef.current.focus({ preventScroll: true });
            copyPasteTextAreaRef.current.select();
        }
    };

    useEffect(() => {
        if (!editMode) {
            setCopyPasteText();
            if (document.activeElement === copyPasteTextAreaRef.current) {
                setFocusToTextArea();
            } else {
                const activeTagName = (document as any).activeElement.tagName.toLowerCase();
                if (
                    !(
                        (activeTagName === 'div' && (document as any).activeElement.contentEditable === 'true') ||
                        activeTagName === 'input' ||
                        activeTagName === 'textarea' ||
                        activeTagName === 'select'
                    )
                ) {
                    setFocusToTextArea();
                }
            }
        }
    });

    const onPaste = (e: any) => {
        if (!copyPasteTextAreaRef) {
            return;
        }
        if (e.target !== copyPasteTextAreaRef.current) {
            return;
        }
        e.preventDefault();

        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const types = clipboardData.types;
        if (types.includes('text/html')) {
            const pastedHtml = clipboardData.getData('text/html');
            parsePastedHtml(pastedHtml);
        } else if (types.includes('text/plain')) {
            const text = clipboardData.getData('text/plain');
            parsePastedText(text);
        }
    };

    useEffect(() => {
        window.document.addEventListener('paste', onPaste);
        return () => {
            window.document.removeEventListener('paste', onPaste);
        };
    });

    const findTable = (element: any): any => {
        for (const child of element.children) {
            if (child.nodeName === 'TABLE') {
                return child;
            }
            const maybeTable = findTable(child);
            if (maybeTable) {
                return maybeTable;
            }
        }
    };

    const parsePastedHtml = (html: string) => {
        const div = document.createElement('div');
        div.innerHTML = html.trim();
        let pasteLocX = -1;
        let pasteLocY = -1;
        if (selection.x1 !== -1 && selection.x2 === -1) {
            pasteLocX = selection.x1;
        }
        if (selection.y1 !== -1 && selection.y2 === -1) {
            pasteLocY = selection.y1;
        }
        if (selection.x1 !== -1 && selection.x2 !== -1) {
            pasteLocX = Math.min(selection.x1, selection.x2);
        }
        if (selection.y1 !== -1 && selection.y2 !== -1) {
            pasteLocY = Math.min(selection.y1, selection.y2);
        }
        if (pasteLocX === -1 || pasteLocY === -1) {
            return;
        }

        let x = pasteLocX;
        let y = pasteLocY;
        const changes = [];

        const tableNode = findTable(div);
        if (!tableNode) {
            return;
        }

        for (const tableChild of tableNode.children) {
            if (tableChild.nodeName === 'TBODY') {
                for (const tr of tableChild.children) {
                    x = pasteLocX;
                    if (tr.nodeName === 'TR') {
                        for (const td of tr.children) {
                            if (td.nodeName === 'TD') {
                                let str: string = '';
                                if (td.children.length !== 0 && td.children[0].nodeName === 'P') {
                                    const p = td.children[0];
                                    if (p.children.length !== 0 && p.children[0].nodeName === 'FONT') {
                                        str = p.children[0].innerHTML;
                                    } else {
                                        str = p.innerHTML;
                                    }
                                } else {
                                    str = td.innerHTML;
                                }
                                str = str.replaceAll('\n', '');
                                str = str.replaceAll(/\s\s+/g, ' ');
                                changes.push({ y: y, x: x, value: str });
                                x++;
                            }
                        }
                        y++;
                    }
                }
            }
        }

        if (props.onChange) {
            props.onChange(changes);
        }
        let pasteX2 = x - 1;
        let pasteY2 = y - 1;
        changeSelection(pasteLocX, pasteLocY, pasteX2, pasteY2, false);
    };

    const parsePastedText = (text: string) => {
        let pasteLocX = -1;
        let pasteLocY = -1;
        if (selection.x1 !== -1 && selection.x2 === -1) {
            pasteLocX = selection.x1;
        }
        if (selection.y1 !== -1 && selection.y2 === -1) {
            pasteLocY = selection.y1;
        }
        if (selection.x1 !== -1 && selection.x2 !== -1) {
            pasteLocX = Math.min(selection.x1, selection.x2);
        }
        if (selection.y1 !== -1 && selection.y2 !== -1) {
            pasteLocY = Math.min(selection.y1, selection.y2);
        }
        if (pasteLocX === -1 || pasteLocY === -1) {
            return;
        }

        const rows = text.split(/\r?\n/);
        let pasteX2 = pasteLocX;
        let pasteY2 = pasteLocY + rows.length - 1;
        const changes = [];
        for (let y = 0; y < rows.length; y++) {
            const cols = rows[y].split('\t');

            if (pasteLocX + cols.length - 1 > pasteX2) {
                pasteX2 = pasteLocX + cols.length - 1;
            }
            for (let x = 0; x < cols.length; x++) {
                changes.push({ y: pasteLocY + y, x: pasteLocX + x, value: cols[x] });
            }
        }

        if (props.onChange) {
            props.onChange(changes);
        }
        changeSelection(pasteLocX, pasteLocY, pasteX2, pasteY2, false);
    };

    const setCopyPasteText = () => {
        if (selection.x1 === -1 || selection.y1 === -1 || selection.x2 === -1 || selection.y2 === -1) {
            return;
        }

        let dy1 = selection.y1;
        let dy2 = selection.y2;
        if (dy1 > dy2) {
            dy1 = selection.y2;
            dy2 = selection.y1;
        }

        let dx1 = selection.x1;
        let dx2 = selection.x2;
        if (dx1 > dx2) {
            dx1 = selection.x2;
            dx2 = selection.x1;
        }

        const rows = [];
        for (let y = dy1; y <= dy2; y++) {
            const row = [];
            for (let x = dx1; x <= dx2; x++) {
                const value = editData(x, y);
                if (value !== null && value !== undefined) {
                    row.push(value);
                } else {
                    row.push('');
                }
            }
            rows.push(row.join('\t'));
        }
        const cptext = rows.join('\n');
        if (copyPasteTextAreaRef.current) {
            copyPasteTextAreaRef.current.value = cptext;
        }
    };

    const commitEditingCell = (value?: string) => {
        if (props.onChange) {
            props.onChange([{ x: editCell.x, y: editCell.y, value: value ?? editValue }]);
        }

        setEditCell({ x: -1, y: -1 });
    };

    const startEditingCell = (editCell: CellCoordinate) => {
        if (cellReadOnly(editCell.x, editCell.y)) {
            return;
        }

        const editDataValue = editData(editCell.x, editCell.y);
        let val = '';
        if (editDataValue !== null && editDataValue !== undefined) {
            val = editDataValue;
        }
        setEditCell(editCell);
        setEditValue(val);
    };

    const onScroll = (e: UIEvent) => {
        if (!e.target || !(e.target instanceof Element)) {
            return;
        }
        const absX = e.target.scrollLeft;
        const absY = e.target.scrollTop;

        const cellX = Math.floor(absX / scrollSpeed);
        const cellY = Math.floor(absY / scrollSpeed);
        if (cellX !== dataOffset.x || cellY !== dataOffset.y) {
            setDataOffset({ x: cellX, y: cellY });
        }

        let newMaxScroll = { ...maxScroll };
        if (maxScroll.x / (absX + 0.5) < 1) {
            newMaxScroll.x *= 1.5;
        }
        if (maxScroll.y / (absY + 0.5) < 1) {
            newMaxScroll.y *= 1.5;
        }
        if (newMaxScroll.x !== maxScroll.x || maxScroll.y !== newMaxScroll.y) {
            setMaxScroll({ ...newMaxScroll });
        }
    };

    const onMouseLeave = () => {
        window.document.body.style.cursor = 'auto';
    };

    const onMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) {
            return;
        }
        if (!e.target || !(e.target instanceof Element)) {
            return;
        }

        // cancel selection
        setSelectionInProgress(false);

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x > canvasWidth || y > canvasHeight) {
            return;
        }

        const hitTargetKeyX = Math.floor(x / xBinSize);
        const hitTargetKeyY = Math.floor(y / yBinSize);

        if (hitMap[hitTargetKeyX] && hitMap[hitTargetKeyX][hitTargetKeyY]) {
            for (const hitTarget of hitMap[hitTargetKeyX][hitTargetKeyY]) {
                if (
                    hitTarget.x <= x &&
                    x <= hitTarget.x + hitTarget.w &&
                    hitTarget.y <= y &&
                    y <= hitTarget.y + hitTarget.h
                ) {
                    setButtonClickMouseDownCoordinates({ x, y, hitTarget });
                    return;
                }
            }
        }

        if (y < columnHeaderHeight) {
            for (let colIdx = 0; colIdx < columnSizes.index.length; colIdx++) {
                const start = columnSizes.start[colIdx];
                const end = columnSizes.end[colIdx];
                const index = columnSizes.index[colIdx];
                if (
                    Math.abs(start - x) < resizeColumnRowMouseThreshold ||
                    Math.abs(end - x) < resizeColumnRowMouseThreshold
                ) {
                    window.document.body.style.cursor = 'col-resize';
                    setColumnResize({
                        startX: end,
                        oldWidth: cellWidth(index),
                        colIdx: index,
                    });
                    return;
                }
            }
        }
        if (x < rowHeaderWidth) {
            for (let rowIdx = 0; rowIdx < rowSizes.index.length; rowIdx++) {
                const start = rowSizes.start[rowIdx];
                const end = rowSizes.end[rowIdx];
                const index = rowSizes.index[rowIdx];
                if (
                    Math.abs(start - y) < resizeColumnRowMouseThreshold ||
                    Math.abs(end - y) < resizeColumnRowMouseThreshold
                ) {
                    window.document.body.style.cursor = 'row-resize';
                    setRowResize({
                        startY: end,
                        oldHeight: cellHeight(index),
                        rowIdx: index,
                    });
                    return;
                }
            }
        }

        // knob drag mode
        if (Math.abs(x - knobCoordinates.x) < knobSize && Math.abs(y - knobCoordinates.y) < knobSize) {
            setKnobDragInProgress(true);
            setKnobArea({ x1: selection.x1, y1: selection.y1, x2: selection.x2, y2: selection.y2 });
            return;
        }

        const sel2 = absCoordianteToCell(x, y, rowSizes, columnSizes);
        const sel1 = shiftKeyDown ? { x: selection.x1, y: selection.y1 } : { ...sel2 };

        if (editMode) {
            commitEditingCell();
        }

        let scrollToP2 = true;

        if (x < rowHeaderWidth) {
            sel2.x = dataOffset.x + 100;
            scrollToP2 = false;
            setRowSelectionInProgress(true);
        } else {
            setRowSelectionInProgress(false);
        }

        if (y < columnHeaderHeight) {
            sel2.y = dataOffset.y + 100;
            scrollToP2 = false;
            setColumnSelectionInProgress(true);
        } else {
            setColumnSelectionInProgress(false);
        }

        setSelectionInProgress(true);
        changeSelection(sel1.x, sel1.y, sel2.x, sel2.y, scrollToP2);
        setEditCell({ x: -1, y: -1 });
    };

    const onMouseUp = (e: MouseEvent) => {
        if (knobDragInProgress) {
            let sx1 = selection.x1;
            let sx2 = selection.x2;
            if (selection.x1 > selection.x2) {
                sx1 = selection.x2;
                sx2 = selection.x1;
            }
            let sy1 = selection.y1;
            let sy2 = selection.y2;
            if (selection.y1 > selection.y2) {
                sy1 = selection.y2;
                sy2 = selection.y1;
            }
            let kx1 = knobArea.x1;
            let kx2 = knobArea.x2;
            if (knobArea.x1 > knobArea.x2) {
                kx1 = knobArea.x2;
                kx2 = knobArea.x1;
            }
            let ky1 = knobArea.y1;
            let ky2 = knobArea.y2;
            if (knobArea.y1 > knobArea.y2) {
                ky1 = knobArea.y2;
                ky2 = knobArea.y1;
            }

            let fx1 = kx1;
            let fy1 = ky1;
            let fx2 = kx2;
            let fy2 = ky2;

            const changes: Array<Change> = [];

            if (fx2 - fx1 === sx2 - sx1) {
                // vertical
                if (fy1 === sy1) {
                    fy1 = sy2 + 1;
                } else {
                    fy2 = sy1 - 1;
                }

                let srcY = sy1;
                for (let y = fy1; y <= fy2; y++) {
                    for (let x = fx1; x <= fx2; x++) {
                        const value = sourceData(x, srcY);
                        changes.push({ x: x, y: y, value: value });
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
                let srcX = sx1;
                for (let x = fx1; x <= fx2; x++) {
                    for (let y = fy1; y <= fy2; y++) {
                        const value = sourceData(srcX, y);
                        changes.push({ x: x, y: y, value: value });
                    }
                    srcX = srcX + 1;
                    if (srcX > sx2) {
                        srcX = sx1;
                    }
                }
            }

            if (props.onChange) {
                props.onChange(changes);
            }

            changeSelection(knobArea.x1, knobArea.y1, knobArea.x2, knobArea.y2);
        }
        setSelectionInProgress(false);
        setRowSelectionInProgress(false);
        setColumnSelectionInProgress(false);
        setKnobDragInProgress(false);
        setColumnResize(null);
        setRowResize(null);

        if (
            buttonClickMouseDownCoordinates.x !== -1 &&
            buttonClickMouseDownCoordinates.y !== -1 &&
            buttonClickMouseDownCoordinates.hitTarget !== null
        ) {
            if (!e.target || !(e.target instanceof Element)) {
                return;
            }
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const hitTarget = buttonClickMouseDownCoordinates.hitTarget;
            if (
                hitTarget.x <= x &&
                x <= hitTarget.x + hitTarget.w &&
                hitTarget.y <= y &&
                y <= hitTarget.y + hitTarget.h
            ) {
                hitTarget.onClick();
            }
            setButtonClickMouseDownCoordinates({ x: -1, y: -1, hitTarget: null });
        }
    };

    useEffect(() => {
        window.addEventListener('mouseup', onMouseUp as any);
        return () => {
            window.removeEventListener('mouseup', onMouseUp as any);
        };
    });

    const onMouseMove = (e: MouseEvent) => {
        if (!e.target || !(e.target instanceof Element)) {
            return;
        }
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        window.document.body.style.cursor = 'auto';

        const hitTargetKeyX = Math.floor(x / xBinSize);
        const hitTargetKeyY = Math.floor(y / yBinSize);

        if (hitMap[hitTargetKeyX] && hitMap[hitTargetKeyX][hitTargetKeyY]) {
            for (const hitTarget of hitMap[hitTargetKeyX][hitTargetKeyY]) {
                if (
                    hitTarget.x <= x &&
                    x <= hitTarget.x + hitTarget.w &&
                    hitTarget.y <= y &&
                    y <= hitTarget.y + hitTarget.h
                ) {
                    window.document.body.style.cursor = 'pointer';
                }
            }
        }

        if (props.onCellWidthChange && y < columnHeaderHeight) {
            let xx = rowHeaderWidth;
            for (const col of columnSizes.index) {
                if (Math.abs(xx - x) < resizeColumnRowMouseThreshold) {
                    window.document.body.style.cursor = 'col-resize';
                    break;
                }
                xx += cellWidth(col);
            }
        }

        if (props.onCellHeightChange && x < rowHeaderWidth) {
            let yy = columnHeaderHeight;
            for (const row of rowSizes.index) {
                if (Math.abs(yy - y) < resizeColumnRowMouseThreshold) {
                    window.document.body.style.cursor = 'row-resize';
                    break;
                }
                yy += cellHeight(row);
            }
        }

        if (Math.abs(x - knobCoordinates.x) < knobSize && Math.abs(y - knobCoordinates.y) < knobSize) {
            window.document.body.style.cursor = 'crosshair';
        }

        if (columnResize) {
            if (props.onCellWidthChange) {
                const newWidth = Math.max(columnResize.oldWidth + x - columnResize.startX, minimumColumnWidth);
                props.onCellWidthChange(columnResize.colIdx, newWidth);
            }
            return;
        }

        if (rowResize) {
            if (props.onCellHeightChange) {
                const newHeight = Math.max(rowResize.oldHeight + y - rowResize.startY, minimumRowHeight);
                props.onCellHeightChange(rowResize.rowIdx, newHeight);
            }
            return;
        }

        if (selectionInProgress) {
            const sel2 = absCoordianteToCell(x, y, rowSizes, columnSizes);
            if (rowSelectionInProgress) {
                changeSelection(selection.x1, selection.y1, selection.x2, sel2.y, false);
            } else if (columnSelectionInProgress) {
                changeSelection(selection.x1, selection.y1, sel2.x, selection.y2, false);
            } else {
                changeSelection(selection.x1, selection.y1, sel2.x, sel2.y);
            }
        }

        if (knobDragInProgress) {
            window.document.body.style.cursor = 'crosshair';
            const cell = absCoordianteToCell(x, y, rowSizes, columnSizes);

            let x1 = selection.x1;
            let y1 = selection.y1;
            let x2 = selection.x2;
            let y2 = selection.y2;
            if (x1 > x2) {
                x1 = selection.x2;
                x2 = selection.x1;
            }
            if (y1 > y2) {
                y1 = selection.y2;
                y2 = selection.y1;
            }

            // check if vertical or horizontal
            let xCellDiff = 0; // zero or less
            if (cell.x < x1) xCellDiff = cell.x - x1;
            if (cell.x > x2) xCellDiff = x2 - cell.x;
            let yCellDiff = 0; // zero or less
            if (cell.y < y1) yCellDiff = cell.y - y1;
            if (cell.y > y2) yCellDiff = y2 - cell.y;

            if (xCellDiff > yCellDiff) {
                if (cell.y < y1) {
                    y1 = cell.y;
                } else {
                    y2 = cell.y;
                }
            } else {
                if (cell.x < x1) {
                    x1 = cell.x;
                } else {
                    x2 = cell.x;
                }
            }
            setKnobArea({ x1: x1, y1: y1, x2: x2, y2: y2 });
        }
    };

    const onDoubleClick = (e: MouseEvent) => {
        e.preventDefault();
        if (!e.target || !(e.target instanceof Element) || shiftKeyDown) {
            return;
        }

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // check if we clicked on a button and don't start editing if we did
        const hitTargetKeyX = Math.floor(x / xBinSize);
        const hitTargetKeyY = Math.floor(y / yBinSize);

        if (hitMap[hitTargetKeyX] && hitMap[hitTargetKeyX][hitTargetKeyY]) {
            for (const hitTarget of hitMap[hitTargetKeyX][hitTargetKeyY]) {
                if (
                    hitTarget.x <= x &&
                    x <= hitTarget.x + hitTarget.w &&
                    hitTarget.y <= y &&
                    y <= hitTarget.y + hitTarget.h
                ) {
                    return;
                }
            }
        }
        const editCell = absCoordianteToCell(x, y, rowSizes, columnSizes);
        setArrowKeyCommitMode(false);
        startEditingCell(editCell);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditCell({ x: -1, y: -1 });
            return;
        }
        if (e.key === 'Enter') {
            commitEditingCell();
            changeSelection(selection.x1, selection.y1 + 1, selection.x1, selection.y1 + 1);
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            commitEditingCell();
            changeSelection(selection.x1 + 1, selection.y1, selection.x1 + 1, selection.y1);
        }
        if (arrowKeyCommitMode && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            e.preventDefault();
            commitEditingCell();
            let x1 = selection.x1;
            let y1 = selection.y1;
            let x2 = selection.x1;
            let y2 = selection.y1;
            if (e.key === 'ArrowRight') {
                x1 = selection.x1 + 1;
                x2 = selection.x1 + 1;
            } else if (e.key === 'ArrowLeft') {
                x1 = selection.x1 - 1;
                x2 = selection.x1 - 1;
            } else if (e.key === 'ArrowUp') {
                y1 = selection.y1 - 1;
                y2 = selection.y1 - 1;
            } else if (e.key === 'ArrowDown') {
                y1 = selection.y1 + 1;
                y2 = selection.y1 + 1;
            }
            changeSelection(x1, y1, x2, y2);
        }
    };

    const onGridKeyDown = (e: KeyboardEvent) => {
        if (editMode && arrowKeyCommitMode && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            commitEditingCell();
            return;
        }

        if (e.key === 'Shift') {
            setShiftKeyDown(true);
            return;
        }

        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'v') {
            return;
        }

        // copy
        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'c') {
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            let x1 = selection.x1;
            let y1 = selection.y1;
            let x2 = selection.x2;
            let y2 = selection.y2;
            if (x1 > x2) {
                x1 = selection.x2;
                x2 = selection.x1;
            }
            if (y1 > y2) {
                y1 = selection.y2;
                y2 = selection.y1;
            }
            const changes: Change[] = [];
            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    changes.push({ x: x, y: y, value: null });
                }
            }
            if (props.onChange) {
                props.onChange(changes);
            }
            return;
        }

        // nothing selected
        if (selection.x1 === -1 || selection.x2 === -1 || selection.y1 === -1 || selection.y2 === -1) {
            return;
        }

        if (
            (e.keyCode >= 48 && e.keyCode <= 57) ||
            (e.keyCode >= 96 && e.keyCode <= 105) ||
            (e.keyCode >= 65 && e.keyCode <= 90) ||
            e.key === 'Enter' ||
            e.key === '-' ||
            e.key === '.' ||
            e.key === ','
        ) {
            if (cellReadOnly(selection.x1, selection.y1)) {
                e.preventDefault(); // so we dont get keystrokes inside the text area
                return;
            }

            startEditingCell({ x: selection.x1, y: selection.y1 });
            setArrowKeyCommitMode(e.key !== 'Enter');
            return;
        }

        if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
            let sel1 = { x: selection.x1, y: selection.y1 };
            let sel2 = { x: selection.x2, y: selection.y2 };

            if (e.key === 'ArrowRight' || e.key === 'Tab') {
                sel2.x += 1;
            } else if (e.key === 'ArrowLeft') {
                sel2.x -= 1;
            } else if (e.key === 'ArrowUp') {
                sel2.y -= 1;
            } else if (e.key === 'ArrowDown') {
                sel2.y += 1;
            }
            if (sel2.x < 0) {
                sel2.x = 0;
            }
            if (sel2.y < 0) {
                sel2.y = 0;
            }
            if (!e.shiftKey) {
                sel1 = { ...sel2 };
            }
            changeSelection(sel1.x, sel1.y, sel2.x, sel2.y);
            return;
        }
        e.preventDefault();
    };

    const onGridKeyUp = (e: KeyboardEvent) => {
        setShiftKeyDown(e.shiftKey);
    };

    const onContextMenu = (e: MouseEvent) => {
        if (!e.target || !(e.target instanceof Element)) {
            return;
        }

        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cell = absCoordianteToCell(x, y, rowSizes, columnSizes);
        const cellX = cell.x;
        const cellY = cell.y;
        let { x1, x2, y1, y2 } = selection;
        if (x1 > x2) [x1, x2] = [x2, x1];
        if (y1 > y2) [y1, y2] = [y2, y1];

        if (!(y > columnHeaderHeight && x > rowHeaderWidth)) {
            return;
        }
        //if click is not inside of selection, select the right clicked cell
        if (!(cellX >= x1 && cellX <= x2) || !(cellY >= y1 && cellY <= y2)) {
            changeSelection(cellX, cellY, cellX, cellY);
        }

        onMouseMove(e);
        const ev: SheetMouseEvent = {
            ...e,
            cellX,
            cellY,
        };
        props.onRightClick?.(ev);
    };

    const editMode = editCell.x !== -1 && editCell.y !== -1;
    let editTextPosition = { x: 0, y: 0 };
    let editTextWidth = 0;
    let editTextHeight = 0;
    let editTextTextAlign: 'right' | 'left' | 'center' = 'right';
    if (editMode) {
        editTextPosition = cellToAbsCoordinate(
            editCell.x,
            editCell.y,
            rowSizes,
            columnSizes,
            dataOffset,
            cellWidth,
            cellHeight
        );
        const style = cellStyle(editCell.x, editCell.y);
        // add 1 so it doesnt cover the selection border
        editTextPosition.x += 1;
        editTextPosition.y += 1;
        editTextWidth = cellWidth(editCell.x) - 2;
        editTextHeight = cellHeight(editCell.y) - 2;
        editTextTextAlign = style.textAlign || defaultCellStyle.textAlign || 'left';
    }

    const inputProps = {
        value: editValue,
        autoFocus: true,
        onKeyDown: onKeyDown,
        style: {
            position: 'absolute',
            top: editTextPosition.y,
            left: editTextPosition.x,
            width: editTextWidth,
            height: editTextHeight,
            outline: 'none',
            border: 'none',
            textAlign: editTextTextAlign,
            color: 'black',
            fontSize: defaultCellStyle.fontSize,
            fontFamily: 'sans-serif',
        } as InputStyle,
    };

    const input = props.inputComponent?.(
        editCell.x,
        editCell.y,
        { ...inputProps, onChange: setEditValue } as SheetInputProps,
        commitEditingCell
    );

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <canvas
                style={{
                    width: 'calc(100% - 14px)',
                    height: 'calc(100% - 15px)',
                    outline: '1px solid #ddd', // find another better solution ?
                }}
                ref={canvasRef}
            />
            <div
                ref={overlayRef}
                onDoubleClick={onDoubleClick}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onContextMenu={onContextMenu}
                onScroll={onScroll}
                className={styles.sheetscroll}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    overflow: 'scroll',
                    borderBottom: '1px solid #ddd',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 1,
                        height: maxScroll.y + 2000,
                        backgroundColor: 'rgba(0,0,0,0.0)',
                    }}
                ></div>
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: maxScroll.x + 5000,
                        height: 1,
                        backgroundColor: 'rgba(0,0,0,0.0)',
                    }}
                ></div>
            </div>
            <textarea
                style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0.01 }}
                ref={copyPasteTextAreaRef}
                onFocus={(e) => e.target.select()}
                tabIndex={0}
                onKeyDown={onGridKeyDown}
                onKeyUp={onGridKeyUp}
            ></textarea>
            {editMode &&
                (input ?? (
                    <input
                        {...inputProps}
                        type="text"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditValue(e.target.value)}
                    />
                ))}
        </div>
    );
}

export default Sheet;
