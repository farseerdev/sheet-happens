import { useCallback, useMemo } from 'react';
import { DEFAULT_CELL_STYLE } from './constants';
import { resolveCellStyle } from './style';
import { CellPropertyFunction, CellContentType, Style } from './types';

export const useAutoSizeColumn = (
    rows: number[],
    displayData: CellPropertyFunction<CellContentType>,
    cellStyle: CellPropertyFunction<Style>
) => {
    const context = useMemo(() => document.createElement('canvas').getContext('2d'), []);

    const getAutoSizeWidth = useCallback(
        (x: number) => {
            if (!context) return 0;

            let maxWidth = 0;
            for (const y of rows) {
                const cellContent = displayData(x, y);
                if (cellContent != null) {
                    const style = cellStyle(x, y);

                    const finalStyle = resolveCellStyle(style, DEFAULT_CELL_STYLE);
                    context.fillStyle = finalStyle.color;
                    context.font = finalStyle.weight + ' ' + finalStyle.fontSize + 'px ' + finalStyle.fontFamily;

                    if (typeof cellContent === 'string' || typeof cellContent === 'number') {
                        const { width } = context.measureText(cellContent.toString());
                        maxWidth = Math.max(maxWidth, width + finalStyle.marginLeft + finalStyle.marginRight);
                    } else if (typeof cellContent === 'object') {
                        for (const obj of cellContent.items) {
                            if (typeof obj.content === 'string' || typeof obj.content === 'number') {
                                const { width } = context.measureText(obj.content.toString());
                                maxWidth = Math.max(maxWidth, obj.x + width);
                            }
                        }
                    }
                }
            }

            return Math.ceil(maxWidth);
        },
        [context]
    );

    return getAutoSizeWidth;
};
