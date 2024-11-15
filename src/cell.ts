import type {
    Align,
    Anchor,
    CellContentContainer,
    CellContentItem,
    CellContentRender,
    Justify,
    Rectangle,
} from './types';

export const getInlineAlignment = (cellWidth: number, contentWidth: number, align: Align): number => {
    if (align === 'left') return 0;
    if (align === 'right') return cellWidth - contentWidth;

    return Math.round((cellWidth - contentWidth) / 2);
};

export const measureFlexWidth = (context: CanvasRenderingContext2D, item: CellContentItem): number => {
    const { width } = item;
    if (width != null) return width;

    if (item.display === 'inline') {
        const { text } = item;
        if (text != null) {
            const { actualBoundingBoxLeft, actualBoundingBoxRight } = context.measureText(text.toString());
            const w = actualBoundingBoxRight + actualBoundingBoxLeft;
            return width ?? w;
        }
    } else {
        throw new Error('Image or JSX content must have dimension specified');
    }
    return 0;
};

export const resolveCellFlexLayout = (
    context: CanvasRenderingContext2D,
    cellContent: CellContentContainer,
    cellLeft: number,
    cellTop: number,
    cellWidth: number,
    cellHeight: number,
): CellContentRender[] => {
    const { flexJustify = 'start', flexAlign = 'center', flexGap = 0, items } = cellContent;

    // Gather flex items
    const flexItems = items.filter((item) => !item.absolute);

    // Measure natural size without wrapping
    const measuredWidths = cellContent.items.map((item) => measureFlexWidth(context, item));

    // Gather flex box horizontal info
    const sizes: number[] = [];
    const grows: number[] = [];
    const shrinks: number[] = [];

    let x = 0;
    flexItems.forEach((item, i) => {
        const defaultGrow = item.display === 'inline' ? 1 : 0;
        const defaultShrink = defaultGrow || (item.display === 'space' ? 1 : 0);
        const {
            width = measuredWidths[i],
            flexGrow = defaultGrow,
            flexShrink = defaultShrink,
            marginLeft = 0,
            marginRight = 0,
        } = item;

        sizes.push(width);
        grows.push(flexGrow);
        shrinks.push(flexShrink);

        x += width + marginLeft + marginRight + flexGap;
    });

    // Flex horizontally
    let slackX = cellWidth - x - flexGap;
    if (slackX > 0 && growRow(slackX, grows, sizes)) slackX = 0;
    if (slackX < 0 && shrinkRow(slackX, shrinks, sizes)) slackX = 0;

    const [gapX, leadX] = getAlignmentSpacing(slackX, flexItems.length, flexJustify);
    const combinedGapX = gapX + flexGap;

    // Gather flex box vertical info
    const maxHeight = flexItems
        .map(({ height, marginTop = 0, marginBottom = 0 }) => (height ?? cellHeight) + marginTop + marginBottom)
        .reduce((a, b) => Math.max(a, b));

    const slackY = Math.max(0, cellHeight - maxHeight);
    const offsetY = getAlignmentAnchor(flexAlign) * slackY;

    // Resolve flex boxes
    let leftCursor = leadX;
    return flexItems.map((item, i) => {
        const {
            height: fixedHeight,
            marginLeft = 0,
            marginRight = 0,
            marginTop = 0,
            marginBottom = 0,
            flexAlignSelf = flexAlign,
        } = item;

        const marginX = marginLeft + marginRight;
        const marginY = marginTop + marginBottom;

        const height = fixedHeight ?? maxHeight - marginY;

        const slackSelfY = maxHeight - height - marginY;
        const offsetSelfY = getAlignmentAnchor(flexAlignSelf) * slackSelfY;

        const x = Math.round(cellLeft + marginLeft + leftCursor + combinedGapX * i);
        const y = Math.round(cellTop + marginTop + offsetY + offsetSelfY);
        leftCursor += combinedGapX + marginX + sizes[i];

        const boxW = sizes[i];
        const boxH = height;
        const box: Rectangle = [
            [x, y],
            [x + boxW, y + boxH],
        ];

        return {
            box,
            item,
        };
    });
};

export const resolveCellAbsoluteLayout = (
    cellContent: CellContentContainer,
    cellLeft: number,
    cellTop: number,
    cellWidth: number,
    cellHeight: number,
): CellContentRender[] => {
    const { items } = cellContent;

    // Gather absolute items
    const absoluteItems = items.filter((item) => item.absolute);

    const resolvePosition = (
        container: number,
        size: number,
        start?: number,
        end?: number,
        marginStart: number = 0,
        marginEnd: number = 0,
    ) => {
        if (start != null) return start + marginStart;
        if (end != null) return container - end - marginEnd - size;
        return 0;
    };

    const resolveSize = (
        container: number,
        span?: number,
        start?: number,
        end?: number,
        marginStart: number = 0,
        marginEnd: number = 0,
    ) => {
        if (span != null) return span;
        if (start != null && end != null) return container - start - end - marginStart - marginEnd;
        return 0;
    };

    // Resolve absolute boxes
    return absoluteItems.map((item) => {
        const { left, top, right, bottom, width, height, marginLeft, marginTop, marginRight, marginBottom } = item;

        const w = resolveSize(cellWidth, width, left, right, marginLeft, marginRight);
        const h = resolveSize(cellHeight, height, top, bottom, marginTop, marginBottom);

        const l = cellLeft + resolvePosition(cellWidth, w, left, right, marginLeft, marginRight);
        const t = cellTop + resolvePosition(cellHeight, h, top, bottom, marginTop, marginBottom);

        const box: Rectangle = [
            [l, t],
            [l + w, t + h],
        ];

        return {
            box,
            item,
        };
    });
};

// Grow all applicable blocks in a row to add extra slack.
export const growRow = (slack: number, grow: number[], sizes: number[]) => {
    const n = grow.length;

    let weight = 0;
    for (let i = 0; i < n; ++i) if (grow[i] > 0) weight += grow[i];

    if (weight > 0) {
        for (let i = 0; i < n; ++i)
            if (grow[i] > 0) {
                sizes[i] += (slack * grow[i]) / weight;
            }
        return true;
    }
    return false;
};

// Shrink all applicable blocks in a row to remove excess slack.
export const shrinkRow = (slack: number, shrink: number[], sizes: number[]): boolean => {
    const n = shrink.length;

    let weight = 0;
    for (let i = 0; i < n; ++i) if (shrink[i]) weight += shrink[i] * sizes[i];

    if (weight > 0) {
        let negative = 0;
        for (let i = 0; i < n; ++i) {
            if (shrink[i] > 0 && sizes[i]) {
                sizes[i] += (slack * shrink[i] * sizes[i]) / weight;
                if (sizes[i] < 0) {
                    negative += sizes[i];
                    sizes[i] = 0;
                }
            }
        }
        if (negative) {
            shrinkRow(negative, shrink, sizes);
        }
        return true;
    }
    return false;
};

// Alignment to relative anchor position [0...1]
export const getAlignmentAnchor = (x: Anchor): number => {
    const isStart = x === 'start';
    const isEnd = x === 'end';

    const align = isStart ? 0 : isEnd ? 1 : 0.5;
    return align;
};

// Alignment/justification spacing and indent
export const getAlignmentSpacing = (slack: number, n: number, justify: Justify) => {
    let gap = 0;
    let lead = 0;

    const isJustify = justify === 'justify';
    const isBetween = justify === 'between';
    const isEvenly = justify === 'evenly';

    if (slack > 0) {
        if (isEvenly || isBetween || isJustify) {
            if (n === 1) {
                lead = slack / 2;
            } else if (isEvenly) {
                gap = Math.max(0, slack / (n + 1));
                lead = gap;
            } else if (isBetween) {
                gap = Math.max(0, slack / n);
                lead = gap / 2;
            } else if (isJustify) {
                gap = Math.max(0, slack / Math.max(1, n - 1));
            }
        } else {
            lead = getAlignmentAnchor(justify as Anchor) * slack;
        }
    }

    return [gap, lead];
};
