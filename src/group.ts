import { XY, Rectangle, RowOrColumnPropertyFunction } from './types';
import { normalizeSelection, orientSelection } from './coordinate';

const LIMIT = 1000;

const scanGroup = (
    keys: RowOrColumnPropertyFunction<string | number | null>,
    index: number,
    direction: number,
    matchKeys: Set<string | number | null>,
) => {
    let i = 1;
    const limit = direction > 0 ? LIMIT : Math.min(LIMIT, index + 1);
    for (; i < limit; i++) {
        const key = keys(index + i * direction);
        if (key == null || !matchKeys.has(key)) break;
    }
    return index + (i - 1) * direction;
};

// Expand a selection to its adjacent row or column group
export const expandSelectionToRowOrColumnGroups = (
    selection: Rectangle,
    groupKeys: RowOrColumnPropertyFunction<string | number | null>,
    matchKeys: Set<string | number | null> | null,
    coordinate: number, // 0/1 for X/Y
) => {
    if (!matchKeys) return selection;

    const [first, second] = normalizeSelection(selection);

    const start = first[coordinate];
    const end = second[coordinate];

    const startIndex = scanGroup(groupKeys, start, -1, matchKeys);
    const endIndex = scanGroup(groupKeys, end, 1, matchKeys);

    const expanded: Rectangle = [first.slice() as XY, second.slice() as XY];
    expanded[0][coordinate] = startIndex;
    expanded[1][coordinate] = endIndex;

    const oriented = orientSelection(expanded, selection);
    return oriented;
};

export const isBoundaryInsideGroup = (
    index: number,
    groupKeys: RowOrColumnPropertyFunction<string | number | null>,
) => {
    const before = groupKeys(index - 1);
    const after = groupKeys(index);
    return before != null && after != null && before === after;
};
