import { useCallback, useMemo } from 'react';
import { DEFAULT_COLUMN_HEADER_STYLE, DEFAULT_CELL_STYLE, SIZES } from './constants';
import { resolveCellFlexLayout } from './cell';
import { wrapText } from './text';
import {
    RowOrColumnPropertyFunction,
    RowOrColumnPropertyStyledFunction,
    CellLayout,
    CellPropertyFunction,
    CellPropertyStyledFunction,
    CellContentType,
    Style,
} from './types';

export const useAutoSizeColumn = (
    rows: number[],
    displayData: CellPropertyStyledFunction<CellContentType>,
    cellLayout: CellLayout,
    cellStyle: CellPropertyFunction<Style>,
    columnHeaders: RowOrColumnPropertyStyledFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    canvasWidth: number,
    frozenColumns: number,
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeWidth = useCallback(
        (x: number) => {
            if (!context) return 0;

            const viewWidth = canvasWidth - cellLayout.columnToAbsolute(x < frozenColumns ? 0 : frozenColumns);

            const getWidth = (cellContent: Exclude<CellContentType, null>, style: Required<Style>) => {
                context.font = style.fontWeight + ' ' + style.fontSize + 'px ' + style.fontFamily;

                const inlineMargin = style.marginLeft + style.marginRight;
                if (typeof cellContent === 'string' || typeof cellContent === 'number') {
                    const { width } = context.measureText(cellContent.toString());
                    return width + inlineMargin;
                } else if (typeof cellContent === 'object') {
                    let totalWidth = inlineMargin;

                    const { flexGap = 0, items } = cellContent;
                    for (const item of items) {
                        if (item.absolute) continue;

                        if (item.width != null) {
                            totalWidth += item.width;
                        } else if (item.display === 'inline' && item.text != null) {
                            const { width } = context.measureText(item.text.toString());
                            totalWidth += width;
                        }
                        totalWidth += flexGap;
                    }
                    totalWidth -= flexGap;

                    return totalWidth;
                }
                return 0;
            };

            let maxWidth = SIZES.minimumWidth;

            const headerStyle = { ...DEFAULT_COLUMN_HEADER_STYLE, ...columnHeaderStyle(x) };
            const headerContent = columnHeaders(x, headerStyle);
            if (headerContent) {
                maxWidth = Math.max(maxWidth, getWidth(headerContent, headerStyle));
            }

            for (const y of rows) {
                const style = { ...DEFAULT_CELL_STYLE, ...cellStyle(x, y) };
                const cellContent = displayData(x, y, style);
                if (cellContent != null) {
                    maxWidth = Math.max(maxWidth, getWidth(cellContent, style));
                }
            }

            return Math.ceil(Math.min(viewWidth, maxWidth));
        },
        [
            context,
            rows,
            displayData,
            cellLayout,
            cellStyle,
            columnHeaders,
            columnHeaderStyle,
            canvasWidth,
            frozenColumns,
        ],
    );

    return getAutoSizeWidth;
};

export const useAutoSizeRow = (
    columns: number[],
    displayData: CellPropertyStyledFunction<CellContentType>,
    cellLayout: CellLayout,
    cellStyle: CellPropertyFunction<Style>,
    columnHeaders: RowOrColumnPropertyStyledFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    cellWidth: RowOrColumnPropertyFunction<number>,
    canvasHeight: number,
    frozenRows: number,
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeHeight = useCallback(
        (y: number) => {
            if (!context) return 0;

            const viewHeight = canvasHeight - cellLayout.rowToAbsolute(y < frozenRows ? 0 : frozenRows);

            const measureTextHeight = (text: string, style: Required<Style>, columnWidth: number) => {
                let maxY = 0;
                const measureY = (_t: string, _x: number, y: number) => {
                    maxY = y + style.lineHeight;
                };
                wrapText(context, text, style, undefined, 0, 0, columnWidth, viewHeight, measureY);
                return maxY;
            };

            const getHeight = (
                cellContent: Exclude<CellContentType, null>,
                style: Required<Style>,
                columnWidth: number,
            ) => {
                context.font = style.fontWeight + ' ' + style.fontSize + 'px ' + style.fontFamily;

                const verticalMargin = style.marginTop + style.marginBottom;
                if (typeof cellContent === 'string' || typeof cellContent === 'number') {
                    const height = measureTextHeight(cellContent.toString(), style, columnWidth);
                    return height + verticalMargin;
                } else if (typeof cellContent === 'object') {
                    let maxHeight = 0;

                    const flexLayout = resolveCellFlexLayout(context, cellContent, 0, 0, columnWidth, 0);

                    for (const { box, item } of flexLayout) {
                        if (item.height != null) {
                            maxHeight = Math.max(maxHeight, item.height);
                        } else if (item.display === 'inline' && item.text != null) {
                            const [[left], [right]] = box;
                            const height = measureTextHeight(item.text.toString(), style, right - left);
                            maxHeight = Math.max(maxHeight, height);
                        }
                    }

                    return maxHeight + verticalMargin;
                }
                return 0;
            };

            const isHeader = y === -1;
            let maxHeight = SIZES.minimumHeight;

            for (const x of columns) {
                const style = isHeader
                    ? { ...DEFAULT_COLUMN_HEADER_STYLE, ...columnHeaderStyle(x) }
                    : { ...DEFAULT_CELL_STYLE, ...cellStyle(x, y) };

                const cellContent = isHeader ? columnHeaders(x, style) : displayData(x, y, style);

                if (cellContent != null) {
                    const columnWidth = cellWidth(x) - style.marginLeft - style.marginRight;
                    maxHeight = Math.max(maxHeight, getHeight(cellContent, style, columnWidth));
                }
            }

            return Math.ceil(Math.min(viewHeight, maxHeight));
        },
        [
            context,
            columns,
            displayData,
            cellLayout,
            cellStyle,
            columnHeaders,
            columnHeaderStyle,
            cellWidth,
            canvasHeight,
            frozenRows,
        ],
    );

    return getAutoSizeHeight;
};
