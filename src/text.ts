import LineBreak from 'linebreak';
import { getInlineAlignment } from './cell';
import { Align, Style } from './types';

export const wrapText = (
    context: CanvasRenderingContext2D,
    text: string | number,
    style: Required<Style>,
    itemAlign: Align | undefined,
    xCoord: number,
    yCoord: number,
    cellWidth: number,
    cellHeight: number,
    emit: (text: string, x: number, y: number) => void,
) => {
    const { textAlign, lineHeight, fontSize, marginBottom } = style;

    const align = itemAlign ?? textAlign;
    context.textAlign = align;

    const x = xCoord + getInlineAlignment(cellWidth, 0, align);
    const y = yCoord;
    const s = text.toString();
    const n = s.length;

    let xCursor = 0;
    let yCursor = 0;
    let wordsPerLine = 0;
    let startOfLine = 0;
    const newline = (endOfLine: number, ellipsis: boolean = false, endsInSpace: boolean = false) => {
        const line = s.slice(startOfLine, endOfLine - +endsInSpace);
        emit(ellipsis ? line + '…' : line, x, y + yCursor);

        startOfLine = endOfLine;
        wordsPerLine = 0;
        xCursor = 0;
        yCursor += lineHeight;
    };

    const breaker = new LineBreak(s);

    let lastPosition = 0;
    let bk;
    while ((bk = breaker.nextBreak())) {
        const { position, required } = bk;
        const word = s.slice(lastPosition, position);

        const { width } = context.measureText(word);

        const canNewLine = yCursor + lineHeight + marginBottom < cellHeight;
        const hasMoreText = position < n;
        const endsInSpace = word[word.length - 1] === ' ';
        const ellipsisSpace = !canNewLine && hasMoreText ? (endsInSpace ? 0.5 : 1) * fontSize : 0;

        const nextX = xCursor + width + ellipsisSpace;
        if (wordsPerLine && nextX >= cellWidth) {
            if (canNewLine) newline(lastPosition);
            else {
                if (endsInSpace) {
                    const { width } = context.measureText(' ');
                    xCursor -= width;
                }
                newline(lastPosition, true, endsInSpace);
                return;
            }
        }

        xCursor += width;
        wordsPerLine++;

        if (required) newline(position);

        lastPosition = position;
    }

    newline(n);
};
