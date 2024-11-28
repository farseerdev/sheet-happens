import styles from './styles.module.css';
import React, {
    forwardRef,
    useRef,
    useImperativeHandle,
    useLayoutEffect,
    useState,
    useMemo,
    KeyboardEventHandler,
    ReactElement,
} from 'react';
import useResizeObserver from 'use-resize-observer';

import {
    XY,
    Rectangle,
    CellContentRender,
    CellLayout,
    CellProperty,
    CellPropertyStyled,
    CellContentType,
    ClipboardPayload,
    RowOrColumnPropertyStyled,
    RowOrColumnProperty,
    Selection,
    Change,
    SheetPointerEvent,
    InternalSheetStyle,
    InputStyle,
    SheetStyle,
    Style,
    VisibleLayout,
} from './types';

import {
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
    validateSelection,
    isSameRectangle,
    mapSelectionColumns,
    mapSelectionRows,
    addXY,
} from './coordinate';
import { useImageRenderer } from './image';
import { useMouse } from './mouse';
import { useKeyboard } from './keyboard';
import { useScroll, scrollToCell, clipDataOffset, updateScrollPosition } from './scroll';
import { useAutoSizeColumn, useAutoSizeRow } from './autosize';
import { useClipboardAPI } from './clipboard';
import { makeLayoutCache, makeCellLayout } from './layout';
import { createCellProp, createCellStyledProp, createRowOrColumnProp, createRowOrColumnStyledProp } from './props';
import { renderSheet, getDpiNudge } from './render';
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
    columnHeaders?: RowOrColumnPropertyStyled<CellContentType>;
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
    displayData?: CellPropertyStyled<CellContentType>;
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

    autoFocus?: boolean;
    inputComponent?: (
        x: number,
        y: number,
        props: SheetInputProps,
        commitEditingCell?: (value?: string | number | null) => void,
    ) => ReactElement | undefined;

    renderInside?: (props: SheetRenderProps) => React.ReactNode;
    renderOutside?: (props: SheetRenderProps) => React.ReactNode;

    onSelectionChanged?: (minX: number, minY: number, maxX: number, maxY: number) => void;
    onRightClick?: (e: SheetPointerEvent) => void;
    onChange?: (changes: Array<Change>) => void;
    onColumnOrderChange?: (indices: number[], order: number) => void;
    onRowOrderChange?: (indices: number[], order: number) => void;
    onCellWidthChange?: (indices: number[], values: number[]) => void;
    onCellHeightChange?: (indices: number[], values: number[]) => void;
    onScrollChange?: (visibleRows: number[], visibleColumns: number[]) => void;

    onCopy?: (selection: Rectangle, cells: string[][]) => ClipboardPayload<any> | null | undefined;
    onPaste?: (
        selection: Rectangle,
        cells: string[][],
        payload: ClipboardPayload<any>,
    ) => boolean | null | undefined | Promise<boolean | null | undefined>;
};

export type SheetRef = CellLayout & {
    startEditingCell: (editCell: XY, arrowKeyCommitMode?: boolean) => void;
    copySelection: (selection: Rectangle, cut?: boolean) => Promise<void>;
    pasteSelection: (selection: Rectangle) => Promise<void>;
    canPasteSelection: () => boolean;
};

const Sheet = forwardRef<SheetRef, SheetProps>((props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    const [maxScroll, setMaxScroll] = useState<XY>(INITIAL_MAX_SCROLL);
    const [dataOffset, setDataOffset] = useState<XY>(ORIGIN);

    const selectionProp = props.selection ?? NO_SELECTION;

    const [rawSelection, setRawSelection] = useState<Rectangle>(selectionProp);
    const [knobArea, setKnobArea] = useState<Rectangle | null>(null);
    const [dragOffset, setDragOffset] = useState<XY | null>(null);
    const [dragIndices, setDragIndices] = useState<[number[] | null, number[] | null]>([null, null]);
    const [dropTarget, setDropTarget] = useState<Rectangle | null>(null);
    const [editCell, setEditCell] = useState<XY>(NO_CELL);

    const [focused, setFocused] = useState(!!props.autoFocus);

    const [lastSelectionProp, setLastSelectionProp] = useState<Rectangle>(selectionProp);
    if (lastSelectionProp !== selectionProp) {
        setLastSelectionProp(selectionProp);
        setRawSelection(selectionProp);
    }

    const [editValue, setEditValue] = useState<string | number>('');
    const [arrowKeyCommitMode, setArrowKeyCommitMode] = useState(false);

    const { width: canvasWidth = 3000, height: canvasHeight = 3000 } = useResizeObserver({ ref: overlayRef });

    const cellWidth = useMemo(() => createRowOrColumnProp(props.cellWidth, 100), [props.cellWidth]);
    const cellHeight = useMemo(() => createRowOrColumnProp(props.cellHeight, 22), [props.cellHeight]);
    const columnHeaders = useMemo(() => createRowOrColumnStyledProp(props.columnHeaders, null), [props.columnHeaders]);
    const columnHeaderStyle = useMemo(
        () => createRowOrColumnProp(props.columnHeaderStyle, {}),
        [props.columnHeaderStyle],
    );

    const canSizeColumn = useMemo(() => createRowOrColumnProp(props.canSizeColumn, true), [props.canSizeColumn]);
    const canSizeRow = useMemo(() => createRowOrColumnProp(props.canSizeRow, true), [props.canSizeRow]);
    const canOrderColumn = useMemo(() => createRowOrColumnProp(props.canOrderColumn, true), [props.canOrderColumn]);
    const canOrderRow = useMemo(() => createRowOrColumnProp(props.canOrderRow, true), [props.canOrderRow]);

    const rowGroupKeys = useMemo(() => createRowOrColumnProp(props.rowGroupKeys, null), [props.rowGroupKeys]);
    const columnGroupKeys = useMemo(() => createRowOrColumnProp(props.columnGroupKeys, null), [props.columnGroupKeys]);

    const cellReadOnly = useMemo(() => createCellProp(props.readOnly, false), [props.readOnly]);

    const sourceData = useMemo(() => createCellProp(props.sourceData, null), [props.sourceData]);
    const displayData = useMemo(() => createCellStyledProp(props.displayData, ''), [props.displayData]);
    const editData = useMemo(() => createCellProp(props.editData, ''), [props.editData]);
    const editKeys = useMemo(() => createCellProp(props.editKeys, ''), [props.editKeys]);
    const cellStyle = useMemo(() => createCellProp(props.cellStyle, DEFAULT_CELL_STYLE), [props.cellStyle]);

    const sheetStyle: InternalSheetStyle = useMemo(() => resolveSheetStyle(props.sheetStyle), [props.sheetStyle]);
    const secondarySelections = props.secondarySelections ?? NO_SELECTIONS;

    const selection = useMemo(() => validateSelection(rawSelection), [rawSelection]);

    const selectedColumnGroups = useMemo(
        () =>
            props.columnGroupKeys
                ? new Set(mapSelectionColumns(selection)((x: number) => columnGroupKeys(x)).filter((x) => x != null))
                : null,
        [props.columnGroupKeys, columnGroupKeys, selection],
    );
    const selectedRowGroups = useMemo(
        () =>
            props.rowGroupKeys
                ? new Set(mapSelectionRows(selection)((y: number) => rowGroupKeys(y)).filter((x) => x != null))
                : null,
        [props.rowGroupKeys, rowGroupKeys, selection],
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
    const { freezeColumns, freezeRows } = sheetStyle;
    const cellLayout = useMemo(
        () => makeCellLayout([freezeColumns, freezeRows], dataOffset, columnLayout, rowLayout),
        [freezeColumns, freezeRows, dataOffset, columnLayout, rowLayout],
    );

    // Build range of visible cells
    const { getVisibleCells, cellToPixel, getVersion } = cellLayout;
    const visibleCells = useMemo(
        () => getVisibleCells([canvasWidth, canvasHeight]),
        // Need to invalidate view if cached layout version changed
        // eslint-disable-next-line
        [getVisibleCells, canvasWidth, canvasHeight, getVersion()],
    );

    // Notify of viewport change
    useLayoutEffect(() => {
        if (props.onScrollChange) {
            props.onScrollChange([...visibleCells.rows], [...visibleCells.columns]);
        }
    }, [visibleCells, props.onScrollChange]);

    const scrollToSelection = (selection: Rectangle, toHead = false) => {
        const { current: overlay } = overlayRef;
        if (!overlay) return;

        const [anchor, head] = selection;
        const view: XY = [canvasWidth, canvasHeight];
        const freeze: XY = [freezeColumns, freezeRows];

        scrollToCell(
            overlay,
            toHead ? head : anchor,
            view,
            freeze,
            dataOffset,
            maxScroll,
            cellLayout,
            (dataOffset: XY, maxScroll: XY) => {
                setDataOffset(dataOffset);
                setMaxScroll(maxScroll);
            },
        );
    };

    // Set selection with scrolling
    const changeSelection = (newSelection: Rectangle, scrollTo = true, toHead = false) => {
        if (!isSameRectangle(selection, newSelection)) {
            setRawSelection(newSelection);
        }

        const { current: overlay } = overlayRef;
        if (!overlay) return;

        if (scrollTo) {
            scrollToSelection(newSelection, toHead);
        }

        if (props.onSelectionChanged) {
            const [[minX, minY], [maxX, maxY]] = normalizeSelection(validateSelection(newSelection));
            props.onSelectionChanged(minX, minY, maxX, maxY);
        }
    };

    const cancelEditingCell = () => {
        setEditCell(NO_CELL);
        setFocused(true);
    };

    const commitEditingCell = (value?: string) => {
        if (props.onChange) {
            const [cellX, cellY] = editCell;
            props.onChange([{ x: cellX, y: cellY, value: value !== undefined ? value : editValue }]);
        }
        setEditCell(NO_CELL);
        setFocused(true);
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

    // If max row or column count changes, keep sheet in view
    const { maxColumns = Infinity, maxRows = Infinity } = props;
    useLayoutEffect(() => {
        const { current: overlay } = overlayRef;
        if (!overlay) return;

        const view: XY = [canvasWidth, canvasHeight];
        const freeze: XY = [freezeColumns, freezeRows];

        const newOffset = clipDataOffset(view, dataOffset, freeze, [maxColumns, maxRows], cellLayout);
        setDataOffset(newOffset);
        updateScrollPosition(overlay, newOffset, cellLayout);

        // Only fire if extents change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxRows, maxColumns]);

    // Output from rendered layout is used to drive events on user content
    const hitmapRef = useRef<CellContentRender[]>(NO_CLICKABLES);

    // Detect focus on canvas
    const isFocused = focused || editMode;

    const { clipboardApi, onClipboardCopy } = useClipboardAPI(
        selection,
        editData,
        cellReadOnly,
        isFocused && !editMode,
        changeSelection,
        props.onChange,
        props.onCopy,
        props.onPaste,
    );

    const onScroll = useScroll(dataOffset, maxScroll, cellLayout, setDataOffset, setMaxScroll);

    const getAutoSizeWidth = useAutoSizeColumn(
        visibleCells.rows,
        displayData,
        cellLayout,
        cellStyle,
        columnHeaders,
        columnHeaderStyle,
        canvasWidth,
        freezeColumns,
    );

    const getAutoSizeHeight = useAutoSizeRow(
        visibleCells.columns,
        displayData,
        cellLayout,
        cellStyle,
        columnHeaders,
        columnHeaderStyle,
        cellWidth,
        canvasHeight,
        freezeRows,
    );

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

        getAutoSizeWidth,
        getAutoSizeHeight,

        startEditingCell,
        commitEditingCell,
        setKnobArea,
        setDragIndices,
        setDragOffset,
        setDropTarget,
        changeSelection,
        setFocused,

        props.cacheLayout ? columnLayout.clearAfter : undefined,
        props.cacheLayout ? rowLayout.clearAfter : undefined,

        props.onChange,
        props.onColumnOrderChange,
        props.onRowOrderChange,
        props.onCellWidthChange,
        props.onCellHeightChange,
        props.onRightClick,
        props.dontCommitEditOnSelectionChange,
        props.dontChangeSelectionOnOrderChange,
    );

    const { onInputKeyDown, onGridKeyDown, onGridFocus, onGridBlur } = useKeyboard(
        arrowKeyCommitMode,
        overlayRef,
        cellReadOnly,
        displayData,
        editCell,
        editMode,
        focused,
        rawSelection,
        selection,

        startEditingCell,
        commitEditingCell,
        cancelEditingCell,
        changeSelection,
        setFocused,
        onClipboardCopy,

        props.onChange,
    );

    const imageRenderer = useImageRenderer();

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
                imageRenderer,

                cellLayout,
                visibleCells,
                sheetStyle,
                cellStyle,
                selection,
                secondarySelections,
                isFocused,

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

                dataOffset,
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
        isFocused,

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

    const [lastEditKey, setLastEditKey] = useState('');

    let editTextPosition = ORIGIN;
    let editTextWidth = 0;
    let editTextHeight = 0;
    let editTextAlign: 'right' | 'left' | 'center' = 'right';
    let editTextLineHeight = '';
    let editTextMargin = '';
    let editTextFontSize = DEFAULT_CELL_STYLE.fontSize;
    let editTextFontFamily = DEFAULT_CELL_STYLE.fontFamily;
    let editTextFontWeight = DEFAULT_CELL_STYLE.fontWeight;
    if (editMode) {
        const style = { ...DEFAULT_CELL_STYLE, ...cellStyle(...editCell) };
        editTextPosition = cellToPixel(editCell);
        editTextPosition = addXY(editTextPosition, ONE_ONE);
        editTextWidth = cellWidth(editCellX) - 3;
        editTextHeight = cellHeight(editCellY) - 3;
        editTextAlign = style.textAlign;
        editTextLineHeight = `${style.lineHeight}px`;
        editTextFontSize = style.fontSize;
        editTextFontFamily = style.fontFamily;
        editTextFontWeight = style.fontWeight;

        // Deduct border + apply high-dpi nudge to line up with render
        const yNudge = getDpiNudge();
        editTextMargin = `${style.marginTop - 1 + yNudge}px ${style.marginRight - 2}px ${style.marginBottom - 2}px ${style.marginLeft - 1}px`;

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
        onKeyDown: onInputKeyDown,
        style: {
            position: 'absolute',
            left: textX,
            top: textY,
            padding: editTextMargin,
            width: editTextWidth,
            height: editTextHeight,
            outline: 'none',
            border: 'none',
            textAlign: editTextAlign,
            lineHeight: editTextLineHeight,
            color: 'black',
            fontSize: editTextFontSize,
            fontFamily: editTextFontFamily,
            fontWeight: editTextFontWeight,
            resize: 'none',
        } as InputStyle,
    };

    const input = props.inputComponent?.(
        editCellX,
        editCellY,
        { ...inputProps, onChange: setEditValue } as SheetInputProps,
        commitEditingCell,
    );

    let overlayDivClassName = styles.sheetscroll;
    const overlayDivStyles: React.CSSProperties = {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        overflow: 'scroll',
        outline: 0,
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

    const renderedInside = useMemo(
        () => props.renderInside?.({ visibleCells, cellLayout, selection, editMode }),
        [props.renderInside, visibleCells, cellLayout, selection, editMode],
    );

    const renderedOutside = useMemo(
        () => props.renderOutside?.({ visibleCells, cellLayout, selection, editMode }),
        [props.renderOutside, visibleCells, cellLayout, selection, editMode],
    );

    // External component API
    useImperativeHandle(
        ref,
        () => ({
            ...cellLayout,
            ...clipboardApi,
            startEditingCell,
        }),
        [cellLayout, clipboardApi, startEditingCell],
    );

    return (
        <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
            <canvas style={canvasStyles} ref={canvasRef} />
            <div
                ref={overlayRef}
                {...mouseHandlers}
                onKeyDown={onGridKeyDown}
                onFocus={onGridFocus}
                onBlur={onGridBlur}
                tabIndex={0}
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
            {editMode &&
                (input !== undefined ? (
                    input
                ) : (
                    <textarea
                        {...inputProps}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setEditValue(e.target.value)}
                    />
                ))}
        </div>
    );
});

export default Sheet;
