import { InternalSheetStyle, SheetStyle, Style } from './types';
import { COLORS, SIZES } from './constants';

export const resolveSheetStyle = (sheetStyle?: SheetStyle): InternalSheetStyle => {
    return {
        freezeColumns: sheetStyle?.freezeColumns || 0,
        freezeRows: sheetStyle?.freezeRows || 0,
        hideColumnHeaders: sheetStyle?.hideColumnHeaders || false,
        hideRowHeaders: sheetStyle?.hideRowHeaders || false,
        hideGridlines: sheetStyle?.hideGridlines || false,
        hideScrollBars: sheetStyle?.hideScrollBars || false,
        columnHeaderHeight: sheetStyle?.hideColumnHeaders ? 1 : SIZES.headerHeight,
        rowHeaderWidth: sheetStyle?.hideRowHeaders ? 1 : SIZES.headerWidth,
        shadowBlur: sheetStyle?.shadowBlur ?? SIZES.shadowBlur,
        shadowOpacity: sheetStyle?.shadowOpacity ?? SIZES.shadowOpacity,
        shadowColor: sheetStyle?.shadowColor ?? COLORS.shadowColor,
    };
};

export const applyAlignment = (
    start: number,
    cellSize: number,
    style: Required<Style>,
    imageWidth: number,
    alignment: 'left' | 'center' | 'right' = style.textAlign
): number => {
    if (alignment === 'left') {
        return start + style.marginLeft;
    } else if (alignment === 'center') {
        return start + cellSize * 0.5 - imageWidth / 2;
    } else if (alignment === 'right') {
        return start + (cellSize - style.marginRight - imageWidth);
    }
    return start;
};
