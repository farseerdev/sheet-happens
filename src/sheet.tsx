import styles from './styles.module.css';
import React, {
    forwardRef,
    useRef,
    useImperativeHandle,
    useLayoutEffect,
    useState,
    useMemo,
    KeyboardEvent,
    KeyboardEventHandler,
    ReactElement,
} from 'react';
import useResizeObserver from 'use-resize-observer';

import {
    XY,
    Rectangle,
    CellLayout,
    CellProperty,
    CellContentType,
    RowOrColumnProperty,
    Selection,
    Clickable,
    Change,
    SheetPointerEvent,
    InternalSheetStyle,
    InputStyle,
    SheetStyle,
    Style,
    VisibleLayout,
} from './types';

import {
    ARROW_KEYS,
    MAX_SEARCHABLE_INDEX,
    DEFAULT_CELL_STYLE,
    INITIAL_MAX_SCROLL,
    NO_CELL,
    NO_CLICKABLES,
    NO_SELECTION,
    NO_SELECTIONS,
    ORIGIN,
    ONE_ONE,
} from './constants';
import {
    normalizeSelection,
    clipSelection,
    validateSelection,
    isSameSelection,
    isRowSelection,
    isColumnSelection,
    isEmptySelection,
    getDirectionStep,
    mapSelectionColumns,
    mapSelectionRows,
    maxXY,
    addXY,
} from './coordinate';
import { useMouse } from './mouse';
import { useScroll, scrollToCell } from './scroll';
import { useClipboardCopy, useClipboardPaste } from './clipboard';
import { makeLayoutCache, makeCellLayout } from './layout';
import { createCellProp, createRowOrColumnProp, findInDisplayData } from './props';
import { renderSheet } from './render';
import { resolveSheetStyle } from './style';

export type SheetInputProps = {
    value: string;
    autoFocus: boolean;
    onKeyDown: KeyboardEventHandler<HTMLElement>;
    onChange: (value: string) => void;
    style: InputStyle;
};

export type SheetRenderProps = {
    visibleCells: VisibleLayout;
    cellLayout: CellLayout;
    selection: Rectangle;
    editMode: boolean;
};

export type SheetProps = {
    cellWidth?: RowOrColumnProperty<number>;
    cellHeight?: RowOrColumnProperty<number>;
    columnHeaders?: RowOrColumnProperty<CellContentType>;
    columnHeaderStyle?: RowOrColumnProperty<Style>;
    cellStyle?: CellProperty<Style>;
    readOnly?: CellProperty<boolean>;
    canSizeColumn?: RowOrColumnProperty<boolean>;
    canSizeRow?: RowOrColumnProperty<boolean>;
    canOrderColumn?: RowOrColumnProperty<boolean>;
    canOrderRow?: RowOrColumnProperty<boolean>;
    columnGroupKeys?: RowOrColumnProperty<string | number | null>;
    rowGroupKeys?: RowOrColumnProperty<string | number | null>;
    sourceData?: CellProperty<string | number | null>;
    displayData?: CellProperty<CellContentType>;
    editData?: CellProperty<string>;
    editKeys?: CellProperty<string>;
    sheetStyle?: SheetStyle;
    selection?: Rectangle;
    secondarySelections?: Selection[];

    maxRows?: number;
    maxColumns?: number;
    cacheLayout?: boolean | number;
    dontCommitEditOnSelectionChange?: boolean;
    dontChangeSelectionOnOrderChange?: boolean;

    inputComponent?: (
        x: number,
        y: number,
        props: SheetInputProps,
        commitEditingCell?: (value?: string | number | null) => void
    ) => ReactElement | undefined;

    renderInside?: (props: SheetRenderProps) => React.ReactNode;
    renderOutside?: (props: SheetRenderProps) => React.ReactNode;

    onSelectionChanged?: (minX: number, minY: number, maxX: number, maxY: number) => void;
    onRightClick?: (e: SheetPointerEvent) => void;
    onChange?: (changes: Array<Change>) => void;
    onColumnOrderChange?: (indices: number[], order: number) => void;
    onRowOrderChange?: (indices: number[], order: number) => void;
    onCellWidthChange?: (indices: number[], value: number) => void;
    onCellHeightChange?: (indices: number[], value: number) => void;
    onScrollChange?: (visibleRows: number[], visibleColumns: number[]) => void;
};

export type SheetRef = CellLayout & {
    startEditingCell: (editCell: XY, arrowKeyCommitMode?: boolean) => void;
};

const Sheet = forwardRef<SheetRef, SheetProps>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [maxScroll, setMaxScroll] = useState<XY>(INITIAL_MAX_SCROLL);
    const [dataOffset, setDataOffset] = useState<XY>(ORIGIN);
    // TODO: smooth scrolling
    // const [pixelOffset, setPixelOffset] = useState<XY>(ORIGIN);

    const selectionProp = props.selection ?? NO_SELECTION;

    const [selection, setSelection] = useState<Rectangle>(selectionProp);
    const [knobArea, setKnobArea] = useState<Rectangle | null>(null);
    const [dragOffset, setDragOffset] = useState<XY | null>(null);
    const [dragIndices, setDragIndices] = useState<[number[] | null, number[] | null]>([null, null]);
    const [dropTarget, setDropTarget] = useState<Rectangle | null>(null);
    const [editCell, setEditCell] = useState<XY>(NO_CELL);

    const [lastSelectionProp, setLastSelectionProp] = useState<Rectangle>(selectionProp);
    if (lastSelectionProp !== selectionProp) {
        setLastSelectionProp(selectionProp);
        setSelection(selectionProp);
    }

    const [editValue, setEditValue] = useState<string | number>('');
    const [arrowKeyCommitMode, setArrowKeyCommitMode] = useState(false);

    const { width: canvasWidth = 3000, height: canvasHeight = 3000 } = useResizeObserver({ ref: overlayRef });

    const cellWidth = useMemo(() => createRowOrColumnProp(props.cellWidth, 100), [props.cellWidth]);
    const cellHeight = useMemo(() => createRowOrColumnProp(props.cellHeight, 22), [props.cellHeight]);
    const columnHeaders = useMemo(() => createRowOrColumnProp(props.columnHeaders, null), [props.columnHeaders]);
    const columnHeaderStyle = useMemo(() => createRowOrColumnProp(props.columnHeaderStyle, {}), [
        props.columnHeaderStyle,
    ]);

    const canSizeColumn = useMemo(() => createRowOrColumnProp(props.canSizeColumn, true), [props.canSizeColumn]);
    const canSizeRow = useMemo(() => createRowOrColumnProp(props.canSizeRow, true), [props.canSizeRow]);
    const canOrderColumn = useMemo(() => createRowOrColumnProp(props.canOrderColumn, true), [props.canOrderColumn]);
    const canOrderRow = useMemo(() => createRowOrColumnProp(props.canOrderRow, true), [props.canOrderRow]);

    const rowGroupKeys = useMemo(() => createRowOrColumnProp(props.rowGroupKeys, null), [props.rowGroupKeys]);
    const columnGroupKeys = useMemo(() => createRowOrColumnProp(props.columnGroupKeys, null), [props.columnGroupKeys]);

    const cellReadOnly = useMemo(() => createCellProp(props.readOnly, false), [props.readOnly]);

    const sourceData = useMemo(() => createCellProp(props.sourceData, null), [props.sourceData]);
    const displayData = useMemo(() => createCellProp(props.displayData, ''), [props.displayData]);
    const editData = useMemo(() => createCellProp(props.editData, ''), [props.editData]);
    const editKeys = useMemo(() => createCellProp(props.editKeys, ''), [props.editKeys]);
    const cellStyle = useMemo(() => createCellProp(props.cellStyle, DEFAULT_CELL_STYLE), [props.cellStyle]);

    const sheetStyle: InternalSheetStyle = useMemo(() => resolveSheetStyle(props.sheetStyle), [props.sheetStyle]);
    const secondarySelections = props.secondarySelections ?? NO_SELECTIONS;

    const selectedColumnGroups = useMemo(
        () =>
            props.columnGroupKeys
                ? new Set(mapSelectionColumns(selection)((x: number) => columnGroupKeys(x)).filter((x) => x != null))
                : null,
        [props.columnGroupKeys, columnGroupKeys, selection]
    );
    const selectedRowGroups = useMemo(
        () =>
            props.rowGroupKeys
                ? new Set(mapSelectionRows(selection)((y: number) => rowGroupKeys(y)).filter((x) => x != null))
                : null,
        [props.rowGroupKeys, rowGroupKeys, selection]
    );

    const [maxScrollX, maxScrollY] = maxScroll;

    const [editCellX, editCellY] = editCell;
    const editMode = editCellX !== -1 && editCellY !== -1;

    // Global layout for unscrolled/unfrozen grid
    // Cached either per width/height pair, or permanently with invalidation on resize/reorder.
    const shouldCacheLayout = (props.cacheLayout ?? false) !== false;
    const layoutVersion = typeof props.cacheLayout === 'number' ? props.cacheLayout : 0;
    const columnLayout = useMemo(() => makeLayoutCache(cellWidth), [shouldCacheLayout ? layoutVersion : cellWidth]);
    const rowLayout = useMemo(() => makeLayoutCache(cellHeight), [shouldCacheLayout ? layoutVersion : cellHeight]);
    useMemo(() => {
        if (!shouldCacheLayout) return;

        columnLayout.setSizer(cellWidth);
        rowLayout.setSizer(cellHeight);

        // Depend on layoutVersion to allow for controlled external invalidation
        // eslint-disable-next-line
    }, [shouldCacheLayout, layoutVersion, cellWidth, cellHeight]);

    // Virtual layout for indented/scrolled/frozen grid
    const { freezeColumns, freezeRows, rowHeaderWidth, columnHeaderHeight } = sheetStyle;
    const cellLayout = useMemo(
        () =>
            makeCellLayout(
                [freezeColumns, freezeRows],
                [rowHeaderWidth, columnHeaderHeight],
                dataOffset,
                columnLayout,
                rowLayout
            ),
        [freezeColumns, freezeRows, rowHeaderWidth, columnHeaderHeight, dataOffset, columnLayout, rowLayout]
    );

    // Build range of visible cells
    const { getVisibleCells, cellToPixel, getVersion } = cellLayout;
    const visibleCells = useMemo(
        () => getVisibleCells([canvasWidth, canvasHeight]),
        // Need to invalidate view if cached layout version changed
        // eslint-disable-next-line
        [getVisibleCells, canvasWidth, canvasHeight, getVersion()]
    );

    // Notify of viewport change
    useLayoutEffect(() => {
        if (props.onScrollChange) {
            props.onScrollChange([...visibleCells.rows], [...visibleCells.columns]);
        }
    }, [visibleCells, props.onScrollChange]);

    // Set selection with scrolling
    const changeSelection = (newSelection: Rectangle, scrollTo = true, toHead = false) => {
        if (!isSameSelection(selection, newSelection)) {
            setSelection(validateSelection(newSelection));
        }

        const { current: overlay } = overlayRef;
        if (!overlay) return;

        if (scrollTo) {
            const [anchor, head] = newSelection;
            scrollToCell(
                overlay,
                toHead ? head : anchor,
                [canvasWidth, canvasHeight],
                [freezeColumns, freezeRows],
                dataOffset,
                [maxColumns, maxRows],
                maxScroll,
                cellLayout,
                (dataOffset: XY, maxScroll: XY) => {
                    setDataOffset(dataOffset);
                    setMaxScroll(maxScroll);
                }
            );
        }

        if (props.onSelectionChanged) {
            const [[minX, minY], [maxX, maxY]] = normalizeSelection(newSelection);
            props.onSelectionChanged(minX, minY, maxX, maxY);
        }
    };

    const commitEditingCell = (value?: string) => {
        if (props.onChange) {
            const [cellX, cellY] = editCell;
            props.onChange([{ x: cellX, y: cellY, value: value !== undefined ? value : editValue }]);
        }
        setEditCell(NO_CELL);
    };

    const startEditingCell = (editCell: XY, arrowKeyCommitMode = false) => {
        const [cellX, cellY] = editCell;
        if (cellReadOnly(cellX, cellY)) {
            return;
        }

        const editDataValue = editData(cellX, cellY);
        let val = '';
        if (editDataValue !== null && editDataValue !== undefined) {
            val = editDataValue;
        }
        setEditCell(editCell);
        setEditValue(val);
        setArrowKeyCommitMode(arrowKeyCommitMode);
        setLastEditKey(editKeys(...editCell));
    };

    // If max row or column count changes, keep selection in range and view
    const { maxColumns = Infinity, maxRows = Infinity } = props;
    useLayoutEffect(() => {
        const [, [maxX, maxY]] = normalizeSelection(selection);
        const overflowX = maxX > maxColumns;
        const overflowY = maxY > maxRows;
        if (!overflowX && !overflowY) return;

        const corner: XY = [maxColumns - 1, maxRows - 1];
        changeSelection(clipSelection(selection, corner), true);
    }, [maxRows, maxColumns]);

    // Output from rendered layout is used to drive events on user content
    const hitmapRef = useRef<Clickable[]>(NO_CLICKABLES);

    // Textarea is used to hold text to copy, and receives pastes
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    useClipboardCopy(textAreaRef, selection, editMode, editData);
    useClipboardPaste(textAreaRef, selection, changeSelection, props.onChange, cellReadOnly);

    const onScroll = useScroll(dataOffset, maxScroll, cellLayout, setDataOffset, setMaxScroll);

    const { mouseHandlers, knobPosition } = useMouse(
        hitmapRef,
        selection,
        knobArea,
        editMode,
        editData,
        sourceData,
        cellReadOnly,

        canSizeColumn,
        canSizeRow,
        canOrderColumn,
        canOrderRow,

        cellLayout,
        visibleCells,
        sheetStyle,

        columnGroupKeys,
        rowGroupKeys,
        selectedColumnGroups,
        selectedRowGroups,

        startEditingCell,
        commitEditingCell,
        setKnobArea,
        setDragIndices,
        setDragOffset,
        setDropTarget,
        changeSelection,

        props.cacheLayout ? columnLayout.clearAfter : undefined,
        props.cacheLayout ? rowLayout.clearAfter : undefined,

        props.onChange,
        props.onColumnOrderChange,
        props.onRowOrderChange,
        props.onCellWidthChange,
        props.onCellHeightChange,
        props.onRightClick,
        props.dontCommitEditOnSelectionChange,
        props.dontChangeSelectionOnOrderChange
    );

    useLayoutEffect(() => {
        const { current: canvas } = canvasRef;
        if (!canvas) {
            return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const animationFrameId = window.requestAnimationFrame(() => {
            hitmapRef.current = renderSheet(
                context,

                cellLayout,
                visibleCells,
                sheetStyle,
                cellStyle,
                selection,
                secondarySelections,

                knobPosition,
                knobArea,
                dragIndices,
                dragOffset,
                dropTarget,

                columnHeaders,
                columnHeaderStyle,
                displayData,

                columnGroupKeys,
                rowGroupKeys,
                selectedColumnGroups,
                selectedRowGroups,

                dataOffset
            );
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [
        cellLayout,
        visibleCells,
        sheetStyle,
        cellStyle,
        selection,
        secondarySelections,

        knobPosition,
        knobArea,
        dragOffset,
        dropTarget,

        columnHeaders,
        columnHeaderStyle,
        displayData,

        columnGroupKeys,
        rowGroupKeys,
        selectedColumnGroups,
        selectedRowGroups,

        dataOffset,
    ]);

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            setEditCell(NO_CELL);
            return;
        }

        const direction =
            e.key === 'Enter' ? 'down' : e.key === 'Tab' ? 'right' : arrowKeyCommitMode ? ARROW_KEYS[e.key] : null;

        if (direction) {
            e.preventDefault();
            const step = getDirectionStep(direction);
            const head = maxXY(addXY(editCell, step), ORIGIN);
            commitEditingCell();
            changeSelection([head, head]);
        }
    };

    const onGridKeyDown = (e: KeyboardEvent) => {
        if (editMode && arrowKeyCommitMode && e.key in ARROW_KEYS) {
            commitEditingCell();
            return;
        }

        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'v') {
            return;
        }

        // copy
        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'c') {
            const { current: textArea } = textAreaRef;
            textArea?.select();
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            let [[x1, y1], [x2, y2]] = normalizeSelection(selection);
            if (isRowSelection(selection)) {
                x1 = 0;
                x2 = MAX_SEARCHABLE_INDEX;
            }
            if (isColumnSelection(selection)) {
                y1 = 0;
                y2 = MAX_SEARCHABLE_INDEX;
            }

            const changes: Change[] = [];
            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    if (!cellReadOnly(x, y)) {
                        changes.push({ x: x, y: y, value: null });
                    }
                }
            }
            if (props.onChange) {
                props.onChange(changes);
            }
            return;
        }

        // nothing selected
        if (isEmptySelection(selection)) {
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
            const [cell] = selection;
            const [cellX, cellY] = cell;
            if (cellReadOnly(cellX, cellY)) {
                e.preventDefault(); // so we dont get keystrokes inside the text area
                return;
            }

            startEditingCell(cell, e.key !== 'Enter');
            return;
        }

        if (e.key in ARROW_KEYS) {
            let [anchor, head] = selection;

            const direction = ARROW_KEYS[e.key];
            const step = getDirectionStep(direction);

            if (e.metaKey || e.ctrlKey) {
                head = findInDisplayData(displayData, head, direction);
            } else {
                head = maxXY(addXY(head, step), ORIGIN);
            }
            if (!e.shiftKey) {
                anchor = head;
            }
            changeSelection([anchor, head], true, true);
            return;
        }

        e.preventDefault();
    };

    const [lastEditKey, setLastEditKey] = useState('');

    let editTextPosition = ORIGIN;
    let editTextWidth = 0;
    let editTextHeight = 0;
    let editTextTextAlign: 'right' | 'left' | 'center' = 'right';
    if (editMode) {
        const style = cellStyle(...editCell);
        editTextPosition = cellToPixel(editCell);
        editTextPosition = addXY(editTextPosition, ONE_ONE);
        editTextWidth = cellWidth(editCellX) - 3;
        editTextHeight = cellHeight(editCellY) - 3;
        editTextTextAlign = style.textAlign || DEFAULT_CELL_STYLE.textAlign || 'left';
        const editKey = editKeys(...editCell);
        if (editKey !== lastEditKey) {
            setLastEditKey('');
            setEditCell(NO_CELL);
        }
    }

    const [textX, textY] = editTextPosition;
    const inputProps = {
        value: editValue,
        autoFocus: true,
        onKeyDown: onKeyDown,
        style: {
            position: 'absolute',
            left: textX,
            top: textY,
            padding: '0px 4px',
            width: editTextWidth,
            height: editTextHeight,
            outline: 'none',
            border: 'none',
            textAlign: editTextTextAlign,
            color: 'black',
            fontSize: DEFAULT_CELL_STYLE.fontSize,
            fontFamily: 'sans-serif',
        } as InputStyle,
    };

    const input = props.inputComponent?.(
        editCellX,
        editCellY,
        { ...inputProps, onChange: setEditValue } as SheetInputProps,
        commitEditingCell
    );

    let overlayDivClassName = styles.sheetscroll;
    const overlayDivStyles: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        overflow: 'scroll',
        borderBottom: '1px solid #ddd',
    };
    const canvasStyles: React.CSSProperties = {
        width: canvasWidth,
        height: canvasHeight,
        outline: '1px solid #ddd', // find another better solution ?
    };

    if (sheetStyle.hideScrollBars) {
        delete canvasStyles['outline'];
        delete overlayDivStyles['borderBottom'];
        overlayDivClassName = '';
    }

    const renderedInside = useMemo(() => props.renderInside?.({ visibleCells, cellLayout, selection, editMode }), [
        props.renderInside,
        visibleCells,
        cellLayout,
        selection,
        editMode,
    ]);

    const renderedOutside = useMemo(() => props.renderOutside?.({ visibleCells, cellLayout, selection, editMode }), [
        props.renderOutside,
        visibleCells,
        cellLayout,
        selection,
        editMode,
    ]);

    // External component API
    useImperativeHandle(
        ref,
        () => ({
            ...cellLayout,
            startEditingCell,
        }),
        [cellLayout, startEditingCell]
    );

    return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <canvas style={canvasStyles} ref={canvasRef} />
            <div
                ref={overlayRef}
                {...mouseHandlers}
                onScroll={onScroll}
                className={overlayDivClassName}
                style={overlayDivStyles}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 1,
                        height: maxScrollY + 2000,
                        backgroundColor: 'rgba(0,0,0,0.0)',
                    }}
                ></div>
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: maxScrollX + 5000,
                        height: 1,
                        backgroundColor: 'rgba(0,0,0,0.0)',
                    }}
                ></div>
                {renderedInside ? (
                    <div
                        style={{
                            position: 'sticky',
                            left: 0,
                            top: 0,
                        }}
                    >
                        {renderedInside}
                    </div>
                ) : null}
            </div>
            {renderedOutside ? (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                    }}
                >
                    {renderedOutside}
                </div>
            ) : null}
            <textarea
                style={{ position: 'absolute', top: 0, left: 0, width: 1, height: 1, opacity: 0.01 }}
                ref={textAreaRef}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                onFocus={(e) => e.target.select()}
                tabIndex={0}
                onKeyDown={onGridKeyDown}
            ></textarea>
            {editMode &&
                (input !== undefined ? (
                    input
                ) : (
                    <input
                        {...inputProps}
                        type="text"
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditValue(e.target.value)}
                    />
                ))}
        </div>
    );
});

export default Sheet;
