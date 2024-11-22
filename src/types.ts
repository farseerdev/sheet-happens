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

export type CellContentType = null | number | string | CellContentContainer;

export type CellContentContainer = {
    inspect?: boolean;

    flexAlign?: Anchor;
    flexJustify?: Justify;
    flexGap?: number;

    items: CellContentItem[];
};

export type CellContentDisplay =
    | {
          display: 'space';
      }
    | {
          display: 'inline';
          text: string | number | null;
      }
    | {
          display: 'image' | 'icon';
          image: HTMLImageElement;
      }
    | {
          display: 'image' | 'icon';
          src: string;
      };

export type CellContentItem = CellContentDisplay & {
    color?: string;
    textAlign?: Align;

    flexGrow?: number;
    flexShrink?: number;
    flexAlignSelf?: Anchor;

    absolute?: boolean;
    left?: number;
    top?: number;
    right?: number;
    bottom?: number;

    width?: number;
    height?: number;

    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginBottom?: number;

    onClick?: (e: MouseEvent) => void;
};

////////////////////////////////////////////////////////////////////////////////
// Rich cell layout
////////////////////////////////////////////////////////////////////////////////

export type CellContentRender = {
    box: Rectangle;
    item: CellContentItem;
};

export type ImageRenderer = (
    context: CanvasRenderingContext2D,
    content: CellContentItem,
    style: Required<Style>,
    box: Rectangle,
) => void;

////////////////////////////////////////////////////////////////////////////////
// Selections
////////////////////////////////////////////////////////////////////////////////

export type XY = [number, number];
export type Rectangle = [XY, XY];

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Align = 'left' | 'center' | 'right';
export type Anchor = 'start' | 'center' | 'end';
export type Justify = 'start' | 'center' | 'end' | 'justify' | 'between' | 'evenly';

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
    fontWeight?: string;
    lineHeight?: number;
    textAlign?: Align;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
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

export type InternalSheetStyle = Required<SheetStyle>;
