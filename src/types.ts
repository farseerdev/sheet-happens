import { MouseEvent, PointerEvent, CSSProperties } from 'react';

////////////////////////////////////////////////////////////////////////////////
// Props
////////////////////////////////////////////////////////////////////////////////

export type PropTypes = string | number | boolean | Style | CellContentType;

export type CellPropertyStyledFunction<T extends PropTypes> = (x: number, y: number, style: Required<Style>) => T;
export type RowOrColumnPropertyStyledFunction<T extends PropTypes> = (
    rowOrColIndex: number,
    style: Required<Style>,
) => T;

export type CellPropertyFunction<T extends PropTypes> = (x: number, y: number) => T;
export type RowOrColumnPropertyFunction<T extends PropTypes> = (rowOrColIndex: number) => T;

export type CellPropertyStyled<T extends PropTypes> = T | T[][] | CellPropertyStyledFunction<T>;
export type RowOrColumnPropertyStyled<T extends PropTypes> = T | T[] | RowOrColumnPropertyStyledFunction<T>;

export type CellProperty<T extends PropTypes> = T | T[][] | CellPropertyFunction<T>;
export type RowOrColumnProperty<T extends PropTypes> = T | T[] | RowOrColumnPropertyFunction<T>;

////////////////////////////////////////////////////////////////////////////////
// Content
////////////////////////////////////////////////////////////////////////////////

export type CellContentType = null | number | string | CellContent;
export type CellContent = {
    items: CellContentItem[];
};

export type CellContentItem = {
    content: HTMLImageElement | string | number;
    x: number;
    y: number;
    width?: number;
    height?: number;
    horizontalAlign?: 'left' | 'right' | 'center';
    onClick?: (e: MouseEvent) => void;
};

////////////////////////////////////////////////////////////////////////////////
// Selections
////////////////////////////////////////////////////////////////////////////////

export type XY = [number, number];
export type Rectangle = [XY, XY];

export type Direction = 'up' | 'down' | 'left' | 'right';

export type LayoutCache = {
    getSize: (i: number) => number;
    getStart: (i: number) => number;
    getEnd: (i: number) => number;

    lookupIndex: (i: number, anchor?: number) => number;

    getVersion: () => number;
    clearAfter: (i: number) => void;
    setSizer: (s: (i: number) => number) => void;
};

export type CellLayout = {
    cellToPixel: (cell: XY, anchor?: XY) => XY;
    pixelToCell: (pixel: XY, anchor?: XY) => XY;

    cellToAbsolute: (cell: XY, anchor?: XY) => XY;
    absoluteToCell: (pixel: XY, anchor?: XY) => XY;

    columnToPixel: (column: number, anchor?: number) => number;
    rowToPixel: (column: number, anchor?: number) => number;
    pixelToColumn: (pixel: number, anchor?: number) => number;
    pixelToRow: (pixel: number, anchor?: number) => number;

    columnToAbsolute: (column: number, anchor?: number) => number;
    rowToAbsolute: (column: number, anchor?: number) => number;
    absoluteToColumn: (pixel: number, anchor?: number) => number;
    absoluteToRow: (pixel: number, anchor?: number) => number;

    getVisibleCells: (view: XY) => VisibleLayout;
    getIndentX: () => number;
    getIndentY: () => number;

    getVersion: () => number;
};

export type VisibleLayout = {
    columns: number[];
    rows: number[];
};

export type Selection = {
    span: Rectangle;
    color: string;
};

export type Clickable = {
    rect: Rectangle;
    obj: CellContentItem;
};

export type Resizable = {
    rect: Rectangle;
    anchor: number;
    size: number;
    indices: number[];
};

////////////////////////////////////////////////////////////////////////////////
// Clipboard
////////////////////////////////////////////////////////////////////////////////

export type ClipboardPayload<T> = {
    cut: boolean;
    data: T;
    origin: string;
    version: number;
};

////////////////////////////////////////////////////////////////////////////////
// Changes
////////////////////////////////////////////////////////////////////////////////

export type Change = {
    x: number;
    y: number;
    value: string | number | null;
    source?: { x: number; y: number };
};

////////////////////////////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////////////////////////////

export type SheetMouseEvent = MouseEvent & {
    cellX: number;
    cellY: number;
};

export type SheetPointerEvent = PointerEvent & {
    cellX: number;
    cellY: number;
};

////////////////////////////////////////////////////////////////////////////////
// Styling
////////////////////////////////////////////////////////////////////////////////

export type InputStyle = Pick<
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

export type Style = {
    color?: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: 'right' | 'left' | 'center';
    marginRight?: number;
    marginLeft?: number;
    weight?: string;
    fillColor?: string;
    backgroundColor?: string;
};

export type SheetStyle = {
    hideGridlines?: boolean;
    hideColumnHeaders?: boolean;
    hideRowHeaders?: boolean;
    hideScrollBars?: boolean;
    freezeColumns?: number;
    freezeRows?: number;

    shadowColor?: string;
    shadowBlur?: number;
    shadowOpacity?: number;
};

export type InternalSheetStyle = Required<SheetStyle> & {
    columnHeaderHeight: number;
    rowHeaderWidth: number;
};
