import { InternalSheetStyle, SheetStyle } from './types';
import { COLORS, SIZES } from './constants';

export const resolveSheetStyle = (sheetStyle?: SheetStyle): InternalSheetStyle => {
    return {
        freezeColumns: sheetStyle?.freezeColumns || 0,
        freezeRows: sheetStyle?.freezeRows || 0,
        hideColumnHeaders: sheetStyle?.hideColumnHeaders || false,
        hideRowHeaders: sheetStyle?.hideRowHeaders || false,
        hideGridlines: sheetStyle?.hideGridlines || false,
        hideScrollBars: sheetStyle?.hideScrollBars || false,
        shadowBlur: sheetStyle?.shadowBlur ?? SIZES.shadowBlur,
        shadowOpacity: sheetStyle?.shadowOpacity ?? SIZES.shadowOpacity,
        shadowColor: sheetStyle?.shadowColor ?? COLORS.shadowColor,
    };
};
