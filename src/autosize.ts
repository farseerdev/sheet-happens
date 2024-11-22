import { useCallback, useMemo } from 'react';
import { DEFAULT_COLUMN_HEADER_STYLE, DEFAULT_CELL_STYLE, SIZES } from './constants';
import { wrapText } from './text';
import {
    RowOrColumnPropertyFunction,
    RowOrColumnPropertyStyledFunction,
    CellPropertyFunction,
    CellPropertyStyledFunction,
    CellContentType,
    Style,
} from './types';

export const useAutoSizeColumn = (
    rows: number[],
    displayData: CellPropertyStyledFunction<CellContentType>,
    cellStyle: CellPropertyFunction<Style>,
    columnHeaders: RowOrColumnPropertyStyledFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    canvasWidth: number,
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeWidth = useCallback(
        (x: number) => {
            if (!context) return 0;

            const getWidth = (cellContent: Exclude<CellContentType, null>, style: Required<Style>) => {
                context.font = style.fontWeight + ' ' + style.fontSize + 'px ' + style.fontFamily;

                const inlineMargin = style.marginLeft + style.marginRight;
                if (typeof cellContent === 'string' || typeof cellContent === 'number') {
                    const { width } = context.measureText(cellContent.toString());
                    return width + inlineMargin;
                } else if (typeof cellContent === 'object') {
                    let totalWidth = inlineMargin;

                    for (const item of cellContent.items) {
                        if (item.absolute) continue;

                        if (item.width != null) {
                            totalWidth += item.width;
                        } else if (item.display === 'inline' && item.text != null) {
                            const { width } = context.measureText(item.text.toString());
                            totalWidth += width;
                        }
                    }

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

            return Math.ceil(Math.min(canvasWidth, maxWidth));
        },
        [context, displayData, cellStyle, columnHeaders, columnHeaderStyle],
    );

    return getAutoSizeWidth;
};

export const useAutoSizeRow = (
    columns: number[],
    displayData: CellPropertyStyledFunction<CellContentType>,
    cellStyle: CellPropertyFunction<Style>,
    columnHeaders: RowOrColumnPropertyStyledFunction<CellContentType>,
    columnHeaderStyle: RowOrColumnPropertyFunction<Style>,
    cellWidth: RowOrColumnPropertyFunction<number>,
    canvasHeight: number,
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeHeight = useCallback(
        (y: number) => {
            if (!context) return 0;

            const measureTextHeight = (text: string, style: Required<Style>, columnWidth: number) => {
                let maxY = 0;
                const measureY = (_t: string, _x: number, y: number) => {
                    maxY = y + style.lineHeight;
                };
                wrapText(context, text, style, undefined, 0, 0, columnWidth, canvasHeight, measureY);
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

                    for (const item of cellContent.items) {
                        if (item.absolute) continue;

                        if (item.height != null) {
                            maxHeight = Math.max(maxHeight, item.height);
                        } else if (item.display === 'inline' && item.text != null) {
                            const height = measureTextHeight(item.text.toString(), style, columnWidth);
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

            return Math.ceil(Math.min(canvasHeight, maxHeight));
        },
        [context, displayData, cellStyle, cellWidth],
    );

    return getAutoSizeHeight;
};
