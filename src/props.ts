import {
    Direction,
    XY,
    CellContentType,
    CellProperty,
    CellPropertyFunction,
    CellPropertyStyled,
    CellPropertyStyledFunction,
    PropTypes,
    RowOrColumnProperty,
    RowOrColumnPropertyFunction,
    RowOrColumnPropertyStyled,
    RowOrColumnPropertyStyledFunction,
} from './types';
import { MAX_SEARCHABLE_INDEX, ORIGIN, DEFAULT_CELL_STYLE } from './constants';
import { addXY, subXY, maxXY, getDirectionStep } from './coordinate';

// Inject row/column props from an array, function, constant or default value
export const createRowOrColumnProp = <T extends PropTypes>(
    rowColProp: RowOrColumnProperty<T> | undefined,
    defaultValue: T,
): RowOrColumnPropertyFunction<T> => {
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
};

// Inject cell props from a nested array, function, constant or default value
export const createCellProp = <T extends PropTypes>(
    cellProp: CellProperty<T> | undefined,
    defaultValue: T,
): CellPropertyFunction<T> => {
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
};

// Inject row/column props from an array, function, constant or default value
export const createRowOrColumnStyledProp = <T extends PropTypes>(
    rowColProp: RowOrColumnPropertyStyled<T> | undefined,
    defaultValue: T,
): RowOrColumnPropertyStyledFunction<T> => {
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
};

// Inject cell props from a nested array, function, constant or default value
export const createCellStyledProp = <T extends PropTypes>(
    cellProp: CellPropertyStyled<T> | undefined,
    defaultValue: T,
): CellPropertyStyledFunction<T> => {
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
};

export const findApproxMaxEditDataIndex = (editData: CellPropertyFunction<string>): XY => {
    let x = 0;
    let y = 0;
    let howManyEmpty = 0;
    let growthIncrement = 10;
    let growthIncrementFactor = 1.5;

    // x
    while (howManyEmpty < 4) {
        let allEmpty = true;
        for (let yy = 0; yy < 10; yy++) {
            const data = editData(x, yy);
            if (data !== null && data !== undefined && data !== '') {
                allEmpty = false;
                break;
            }
        }
        if (allEmpty) {
            howManyEmpty += 1;
        }
        x += growthIncrement;
        if (x > MAX_SEARCHABLE_INDEX) {
            break;
        }
        growthIncrement = Math.floor(growthIncrement * growthIncrementFactor);
    }

    howManyEmpty = 0;
    growthIncrement = 10;
    growthIncrementFactor = 1.5;

    // y
    while (howManyEmpty < 4) {
        let allEmpty = true;
        for (let xx = 0; xx < 10; xx++) {
            const data = editData(xx, y);
            if (data !== null && data !== undefined && data !== '') {
                allEmpty = false;
                break;
            }
        }
        if (allEmpty) {
            howManyEmpty += 1;
        }
        y += growthIncrement;
        if (y > MAX_SEARCHABLE_INDEX) {
            break;
        }
        growthIncrement = Math.floor(growthIncrement * growthIncrementFactor);
    }
    return [x, y];
};

export const findInDisplayData = (
    displayData: CellPropertyStyledFunction<CellContentType>,
    start: XY,
    direction: Direction,
): XY => {
    const step = getDirectionStep(direction);

    let cell = maxXY(start, ORIGIN);
    const [x, y] = addXY(cell, step);
    const first = displayData(x, y, DEFAULT_CELL_STYLE);
    const firstFilled = first !== '' && first !== null && first !== undefined;

    if (!firstFilled) {
        cell = addXY(cell, step);
    }

    let [cellX, cellY] = cell;
    const maxX = cellX + MAX_SEARCHABLE_INDEX - 1;
    const maxY = cellY + MAX_SEARCHABLE_INDEX - 1;

    while (cellX < maxX && cellY < maxY && cellX >= 0 && cellY >= 0) {
        const data = displayData(cellX, cellY, DEFAULT_CELL_STYLE);

        // if first cell is filled, find the last filled cell, so first look for first unfilled
        if (firstFilled && (data === '' || data === null || data === undefined)) {
            return subXY(cell, step);
        }
        // if first cell is not filled, just find the first filled
        if (!firstFilled && data !== '' && data !== null && data !== undefined) {
            return cell;
        }

        [cellX, cellY] = cell = addXY(cell, step);
    }

    return maxXY(cell, [0, 0]);
};
