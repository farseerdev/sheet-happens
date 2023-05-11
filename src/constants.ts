import { XY, Rectangle, Selection, Clickable, Direction, Style } from './types';

export const INITIAL_MAX_SCROLL: XY = [ 2000, 1000 ];

export const ORIGIN: XY = [ 0, 0 ];
export const ONE_ONE: XY = [ 1, 1 ];

export const NO_CELL: XY = [ -1, -1 ];
export const NO_SELECTION: Rectangle = [NO_CELL, NO_CELL];
export const NO_SELECTIONS: Selection[] = [];
export const NO_CLICKABLES: Clickable[] = [];
export const NO_STYLE = {};

export const MAX_SEARCHABLE_INDEX = 65536;
export const MAX_XY: XY = [ MAX_SEARCHABLE_INDEX, MAX_SEARCHABLE_INDEX ];

export const COLORS = {
    selectionBorder: '#1a66ff',
    selectionBackground: '#e9f0fd',

    gridLine: '#0000001f',

    dragGhost: '#1a66ff30',
    dropTarget: '#1a66ff',
    knobAreaBorder: '#707070',

    headerBackground: '#f8f9fa',
    headerText: '#666666',
    headerActive: '#e8eaed',

    headerSelected: '#1a66ff',
    headerSelectedText: '#ffffff',
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
};

export const DEFAULT_CELL_STYLE: Required<Style> = {
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

export const DEFAULT_COLUMN_HEADER_STYLE: Required<Style> = {
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

export const HEADER_SELECTED_STYLE = {
    backgroundColor: COLORS.headerSelected,
    color: COLORS.headerSelectedText,
};

export const ARROW_KEYS: Record<string, Direction> = {
    'ArrowRight': 'right',
    'ArrowLeft': 'left',
    'ArrowUp': 'up',
    'ArrowDown': 'down',
};
