import { XY, Rectangle, Selection, Clickable, Direction, Style } from './types';

export const INITIAL_MAX_SCROLL: XY = [2000, 1000];

export const ORIGIN: XY = [0, 0];
export const ONE_ONE: XY = [1, 1];
export const NEG_NEG: XY = [-1, -1];

export const NO_CELL: XY = [-1, -1];
export const NO_SELECTION: Rectangle = [NO_CELL, NO_CELL];
export const NO_SELECTIONS: Selection[] = [];
export const NO_CLICKABLES: Clickable[] = [];
export const NO_STYLE = {};

export const MAX_SEARCHABLE_INDEX = 100000;

export const COLORS = {
    selectionBorder: '#1a66ff',
    selectionBackground: '#d8e6ff80',

    gridLine: '#0000001f',

    dragGhost: '#1a66ff30',
    dropTarget: '#1a66ff',
    knobAreaBorder: '#707070',

    headerBackground: '#f6f9fc',
    headerText: '#666666',
    headerActive: '#e8f0ff',
    headerActiveText: '#1a66ff',

    headerSelected: '#1a66ff',
    headerSelectedGroup: '#1a66ff70',
    headerSelectedText: '#ffffff',
    headerSelectedGroupText: '#ffffff',

    shadowColor: '#000000',
};

export const SIZES = {
    knobArea: 6,
    headerWidth: 50,
    headerHeight: 22,
    minimumWidth: 50,
    minimumHeight: 22,
    resizeZone: 4,
    scrollZone: 50,
    scrollSpeed: 30,

    shadowBlur: 12,
    shadowOpacity: 0.05,
};

export const DEFAULT_CELL_STYLE: Required<Style> = {
    textAlign: 'left',
    fontSize: 12,
    marginRight: 5,
    marginLeft: 5,
    color: '#000',
    fontFamily: 'sans-serif',
    weight: '',
    fillColor: '',
    backgroundColor: '',
};

export const DEFAULT_COLUMN_HEADER_STYLE: Required<Style> = {
    textAlign: 'center',
    fontSize: 12,
    marginRight: 5,
    marginLeft: 5,
    color: '#000',
    fontFamily: 'sans-serif',
    weight: '',
    fillColor: '',
    backgroundColor: '',
};

export const HEADER_ACTIVE_STYLE = {
    color: COLORS.headerActiveText,
};

export const HEADER_SELECTED_STYLE = {
    backgroundColor: COLORS.headerSelected,
    color: COLORS.headerSelectedText,
};

export const HEADER_GROUP_SELECTED_STYLE = {
    backgroundColor: COLORS.headerSelectedGroup,
    color: COLORS.headerSelectedGroupText,
};

export const ARROW_KEYS: Record<string, Direction> = {
    ArrowRight: 'right',
    ArrowLeft: 'left',
    ArrowUp: 'up',
    ArrowDown: 'down',
};
