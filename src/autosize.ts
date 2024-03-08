import { useCallback, useMemo } from 'react';
import { DEFAULT_COLUMN_HEADER_STYLE, DEFAULT_CELL_STYLE, SIZES } from './constants';
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
    canvasWidth: number
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeWidth = useCallback(
        (x: number) => {
            if (!context) return 0;

            const getWidth = (cellContent: Exclude<CellContentType, null>, style: Required<Style>) => {
                context.font = style.weight + ' ' + style.fontSize + 'px ' + style.fontFamily;

                const inlineMargin = style.marginLeft + style.marginRight;
                if (typeof cellContent === 'string' || typeof cellContent === 'number') {
                    const { width } = context.measureText(cellContent.toString());
                    return width + inlineMargin;
                } else if (typeof cellContent === 'object') {
                    let maxWidth = 0;
                    let extraWidth = 0;

                    for (const obj of cellContent.items) {
                        let width = 0;
                        if (typeof obj.content === 'string' || typeof obj.content === 'number') {
                            const { width: w } = context.measureText(obj.content.toString());
                            width = obj.x + w + inlineMargin;
                        } else if (obj.width) {
                            width = obj.width;
                        }

                        if (obj.horizontalAlign === 'right') {
                            extraWidth += width;
                        } else {
                            maxWidth = Math.max(maxWidth, width);
                        }
                    }

                    return maxWidth + extraWidth;
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
        [context, displayData, cellStyle, columnHeaders, columnHeaderStyle]
    );

    return getAutoSizeWidth;
};
