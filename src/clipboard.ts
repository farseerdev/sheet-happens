import { CellPropertyFunction, Change, ParsedChange, Rectangle } from './types';
import { RefObject, useLayoutEffect, useEffect } from 'react';
import { findApproxMaxEditDataIndex } from './props';
import { normalizeSelection, isMaybeRowSelection, isMaybeColumnSelection, isEmptySelection } from './coordinate';

export const useClipboardCopy = (
    textAreaRef: RefObject<HTMLTextAreaElement>,
    selection: Rectangle,
    editMode: boolean,
    editData: CellPropertyFunction<string>,
) => {
    useLayoutEffect(() => {
        const {current: textArea} = textAreaRef;
        if (!textArea) return;

        if (editMode) return;
        if (isEmptySelection(selection)) return;

        textArea.value = formatSelectionAsTSV(selection, editData);
        textArea.select();
    }, [selection, editMode, editData, textAreaRef]);

    useLayoutEffect(() => {
        const {current: textArea} = textAreaRef;
        if (!textArea) return;

        const focus = () => {
            textArea.focus({ preventScroll: true });
            textArea.select();
        };

        if (editMode) return;
        if (document.activeElement === textArea) return;

        const activeTagName = (document as any).activeElement.tagName.toLowerCase();
        if (
            !(
                (activeTagName === 'div' && (document as any).activeElement.contentEditable === 'true') ||
                activeTagName === 'input' ||
                activeTagName === 'textarea' ||
                activeTagName === 'select'
            )
        ) {
            focus();
        }
    });
}

export const useClipboardPaste = (
    textAreaRef: RefObject<HTMLTextAreaElement>,
    selection: Rectangle,
    onSelectionChange?: (selection: Rectangle) => void,
    onChange?: (changes: Array<Change>) => void,
) => {
    useEffect(() => {
        const onPaste = (e: any) => {
            const {current: textArea} = textAreaRef;
            if (!textArea) return;

            if (e.target !== textArea) return;
            e.preventDefault();

            const clipboardData = e.clipboardData || (window as any).clipboardData;
            const types = clipboardData.types;

            let parsed;
            if (types.includes('text/html')) {
                const pastedHtml = clipboardData.getData('text/html');
                parsed = parsePastedHtml(selection, pastedHtml);
            } else if (types.includes('text/plain')) {
                const text = clipboardData.getData('text/plain');
                parsed = parsePastedText(selection, text);
            }
            if (!parsed) return;

            const {selection: s, changes} = parsed;
            onChange?.(changes);
            onSelectionChange?.(s);
        };

        window.document.addEventListener('paste', onPaste);
        return () => {
            window.document.removeEventListener('paste', onPaste);
        };
    }, [textAreaRef, selection]);
}

const formatTSV = (rows: string[][]) => rows.map(row => row.join('\t')).join('\n');

const formatSelectionAsTSV = (
    selection: Rectangle,
    editData: CellPropertyFunction<string>,
) => {
    if (isEmptySelection(selection)) return '';

    let [[minX, minY], [maxX, maxY]] = normalizeSelection(selection);
    if (isMaybeRowSelection(selection)) {
        const [cellX] = findApproxMaxEditDataIndex(editData);
        minX = 0;
        maxX = cellX;
    }
    if (isMaybeColumnSelection(selection)) {
        const [, cellY] = findApproxMaxEditDataIndex(editData);
        minY = 0;
        maxY = cellY;
    }

    const rows: string[][] = [];

    for (let y = minY; y <= maxY; y++) {
        const row: string[] = [];

        for (let x = minX; x <= maxX; x++) {
            const value = editData(x, y);
            if (value !== null && value !== undefined) {
                row.push(value != null ? value : '');
            }
        }

        rows.push(row);
    }

    return formatTSV(rows);
}

const findTable = (element: any): any => {
    for (const child of element.children) {
        if (child.nodeName === 'TABLE') {
            return child;
        }
        const maybeTable = findTable(child);
        if (maybeTable) {
            return maybeTable;
        }
    }
};

const parsePastedHtml = (selection: Rectangle, html: string): ParsedChange | null => {
    const div = document.createElement('div');
    div.innerHTML = html.trim();

    const [[minX, minY]] = normalizeSelection(selection);
    let left = isMaybeRowSelection(selection) ? 0 : minX;
    let top = isMaybeColumnSelection(selection) ? 0 : minY;

    const changes = [];

    const tableNode = findTable(div);
    if (!tableNode) {
        return null;
    }

    let right = left;
    let bottom = top;

    let y = top;
    for (const tableChild of tableNode.children) {
        if (tableChild.nodeName === 'TBODY') {
            for (const tr of tableChild.children) {
                let x = left;
                if (tr.nodeName === 'TR') {
                    for (const td of tr.children) {
                        if (td.nodeName === 'TD') {
                            let str: string = '';
                            if (td.children.length !== 0 && td.children[0].nodeName === 'P') {
                                const p = td.children[0];
                                if (p.children.length !== 0 && p.children[0].nodeName === 'FONT') {
                                    str = p.children[0].textContent.trim();
                                } else {
                                    str = p.textContent.trim();
                                }
                            } else {
                                str = td.textContent.trim();
                            }
                            str = str.replaceAll('\n', '');
                            str = str.replaceAll(/\s\s+/g, ' ');
                            changes.push({ x, y, value: str });
                            x++;
                        }
                    }
                    y++;
                }
                right = Math.max(right, x);
            }
        }
    }
    bottom = y;

    return {
        selection: [[left, top], [right, bottom]],
        changes,
    };
};

const parsePastedText = (selection: Rectangle, text: string): ParsedChange => {
    const [[minX, minY]] = normalizeSelection(selection);
    let left = isMaybeRowSelection(selection) ? 0 : minX;
    let top = isMaybeColumnSelection(selection) ? 0 : minY;

    const rows = text.split(/\r?\n/);
    let right = left;
    let bottom = top + rows.length - 1;

    const changes = [];
    for (let y = 0; y < rows.length; y++) {
        const cols = rows[y].split('\t');
        right = Math.max(right, left + cols.length - 1);

        for (let x = 0; x < cols.length; x++) {
            changes.push({ x: left + x, y: top + y, value: cols[x] });
        }
    }

    return {
        selection: [[left, top], [right, bottom]],
        changes,
    };
};
