import { Rectangle, RowOrColumnPropertyFunction } from './types';
import { normalizeSelection, orientSelection } from './coordinate';

const LIMIT = 1000;

const scanGroup = (
    keys: RowOrColumnPropertyFunction<string | number | null>,
    index: number,
    direction: number,
    match: string | number | null
) => {
    if (match == null) return index;

    let i = 0;
    const limit = direction > 0 ? LIMIT : Math.min(LIMIT, index + 1);
    for (; i < limit; i++) {
        if (keys(index + i * direction) !== match) break;
    }
    return index + (i - 1) * direction;
};

export const expandSelectionToColumnGroups = (
    selection: Rectangle,
    columnGroupKeys: RowOrColumnPropertyFunction<string | number | null>
) => {
    const [[left, top], [right, bottom]] = normalizeSelection(selection);

    const leftKey = columnGroupKeys(left);
    const rightKey = columnGroupKeys(right);

    const startColumn = scanGroup(columnGroupKeys, left, -1, leftKey);
    const endColumn = scanGroup(columnGroupKeys, right, 1, rightKey);

    const expanded: Rectangle = [
        [startColumn, top],
        [endColumn, bottom],
    ];
    const oriented = orientSelection(expanded, selection);

    return oriented;
};

export const expandSelectionToRowGroups = (
    selection: Rectangle,
    rowGroupKeys: RowOrColumnPropertyFunction<string | number | null>
) => {
    const [[left, top], [right, bottom]] = normalizeSelection(selection);

    const topKey = rowGroupKeys(top);
    const bottomKey = rowGroupKeys(bottom);

    const startRow = scanGroup(rowGroupKeys, top, -1, topKey);
    const endRow = scanGroup(rowGroupKeys, bottom, 1, bottomKey);

    const expanded: Rectangle = [
        [left, startRow],
        [right, endRow],
    ];
    const oriented = orientSelection(expanded, selection);

    return oriented;
};

export const isBoundaryInsideGroup = (
    index: number,
    rowOrColumnGroupKeys: RowOrColumnPropertyFunction<string | number | null>
) => {
    const before = rowOrColumnGroupKeys(index - 1);
    const after = rowOrColumnGroupKeys(index);
    return before != null && after != null && before === after;
};
