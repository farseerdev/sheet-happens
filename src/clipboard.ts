import { ClipboardPayload, CellPropertyFunction, Change, Rectangle } from './types';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { findApproxMaxEditDataIndex } from './props';
import {
    normalizeSelection,
    isMaybeRowSelection,
    isMaybeColumnSelection,
    isEmptySelection,
    addXY,
    forSelectionRows,
    forSelectionColumns,
} from './coordinate';

// Type missing from TS <=4.3
interface ClipboardItem {
    readonly types: string[];
    readonly presentationStyle: 'unspecified' | 'inline' | 'attachment';
    getType(): Promise<Blob>;
}

declare var ClipboardItem: {
    prototype: ClipboardItem;
    new (itemData: any): ClipboardItem;
};

export type ClipboardTable<T = any> = {
    rows: string[][];
    payload?: ClipboardPayload<T>;
};

const EMPTY_TABLE: ClipboardTable = { rows: [] };

// Access clipboard as HTML table + JSON payload.
// Provide peek access to clipboard if permission granted.
// Ask permission on first copy.
export const useClipboardTable = () => {
    const [peek, setPeek] = useState<ClipboardTable | null>();

    useLayoutEffect(() => {
        const softRefresh = async () => {
            try {
                const status = await navigator.permissions.query({ name: 'clipboard-read' as any });
                if (status.state !== 'granted') return;

                hardRefresh();
            } catch (e) {}
        };

        const hardRefresh = async () => {
            try {
                const items = await (navigator.clipboard as any).read();
                const [item] = items;
                if (item) {
                    const peek = await parseClipboardTable(item);
                    setPeek(peek);
                } else {
                    setPeek(EMPTY_TABLE);
                }
            } catch (e) {}
        };

        const delayedRefresh = () => setTimeout(hardRefresh);

        window.document.addEventListener('cut', delayedRefresh);
        window.document.addEventListener('copy', delayedRefresh);
        window.document.addEventListener('focus', softRefresh);

        softRefresh();

        return () => {
            window.document.removeEventListener('cut', delayedRefresh);
            window.document.removeEventListener('copy', delayedRefresh);
            window.document.removeEventListener('focus', softRefresh);
        };
    }, []);

    const canPaste = useCallback(
        // Peek may not be available, allow paste attempt.
        () => !!(peek == null || peek.rows?.length),
        [peek]
    );

    return {
        peek,
        canPaste,
        copyTable: copyClipboardTable,
        pasteTable: pasteClipboardTable,
    };
};

// Sheet clipboard with payload-handler injected
export const useClipboardAPI = <T = any>(
    selection: Rectangle,
    editData: CellPropertyFunction<string>,
    cellReadOnly: CellPropertyFunction<boolean>,
    addListener: boolean,

    onSelectionChange?: (selection: Rectangle) => void,
    onChange?: (changes: Change[]) => void,
    onCopy?: (selection: Rectangle, rows: string[][], cut: boolean) => ClipboardPayload<T> | null | undefined,
    onPaste?: (
        selection: Rectangle,
        rows: string[][],
        payload?: ClipboardPayload<T>
    ) => boolean | null | undefined | Promise<boolean | null | undefined>
) => {
    const { canPaste, copyTable, pasteTable } = useClipboardTable();

    const pasteIntoSelection = useCallback(
        async (selection: Rectangle, table: ClipboardTable) => {
            const { rows, payload } = table;
            const [min] = normalizeSelection(selection);
            const [minX, minY] = min;

            const left = Math.max(0, minX);
            const top = Math.max(0, minY);

            const width = rows.reduce((a, b) => Math.max(a, b.length), 0);
            const height = rows.length;

            const newSelection: Rectangle = [min, addXY(min, [width - 1, height - 1])];

            const shouldPaste = await onPaste?.(newSelection, rows, payload);
            if (shouldPaste !== false) {
                const changes = rows
                    .flatMap((row, j) =>
                        row.map((value, i) => {
                            const x = left + i;
                            const y = top + j;
                            return !cellReadOnly?.(x, y) ? { x, y, value } : null;
                        })
                    )
                    .filter((change) => !!change) as Change[];

                onChange?.(changes);
                onSelectionChange?.(newSelection);
            }
        },
        [onChange, onSelectionChange, cellReadOnly]
    );

    // Imperative API
    const copySelection = useCallback(
        async (selection: Rectangle, cut: boolean = false) => {
            const rows = formatSelectionAsRows(selection, editData);
            const payload = onCopy?.(selection, rows, cut);

            copyTable(rows, payload);

            if (payload?.cut ?? cut) {
                const changes: Change[] = [];
                forSelectionRows(selection)((y: number) => {
                    forSelectionColumns(selection)((x: number) => {
                        if (!cellReadOnly?.(x, y)) {
                            const change = { x, y, value: '' };
                            changes.push(change);
                        }
                    });
                });
                onChange?.(changes);
            }
        },
        [onCopy, onChange, cellReadOnly]
    );

    const pasteSelection = useCallback(
        async (selection: Rectangle) => {
            const table = await pasteTable();
            if (table) pasteIntoSelection(selection, table);
        },
        [pasteIntoSelection]
    );

    // Event handlers
    const onClipboardCopy = (cut: boolean) => {
        if (isEmptySelection(selection)) return;
        return copySelection(selection, cut);
    };

    const onClipboardPaste = async (e: any) => {
        e.preventDefault();

        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const table = await parseClipboardTable(clipboardData);
        if (table) pasteIntoSelection(selection, table);
    };

    useLayoutEffect(() => {
        if (!addListener) return;

        // Use onpaste event when we can because it has more browser support
        window.document.addEventListener('paste', onClipboardPaste);
        return () => {
            window.document.removeEventListener('paste', onClipboardPaste);
        };
    });

    const clipboardApi = useMemo(
        () => ({
            copySelection,
            pasteSelection,
            canPasteSelection: canPaste,
        }),
        [copySelection, pasteSelection, canPaste]
    );

    return { clipboardApi, onClipboardCopy, onClipboardPaste };
};

const copyClipboardTable = async (rows: string[][], payload?: ClipboardPayload<any> | null) => {
    const text = formatRowsAsTSV(rows);
    const html = formatRowsAsHTML(rows, payload ?? undefined);

    await (navigator.clipboard as any).write([
        new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
    ]);

    const event = new Event('copy');
    document.dispatchEvent(event);
};

const pasteClipboardTable = async () => {
    const items = await (navigator.clipboard as any).read();
    const [item] = items;
    if (!item) return;

    return parseClipboardTable(item);
};

const parseClipboardTable = async (item: ClipboardItem | DataTransfer): Promise<ClipboardTable | null> => {
    // Work with both clipboard API (ClipboardItem) and onpaste event (DataTransfer)
    const has = (type: string) => {
        return item.types.includes(type);
    };

    const get = (type: string) => {
        if ('getData' in item) return item.getData(type);
        else if ('getType' in item) return (item as any).getType(type).then((blob: Blob) => blob.text());
        return '';
    };

    let rows, payload;
    if (has('text/html')) {
        const pastedHtml = await get('text/html');
        ({ rows, payload } = parsePastedHtml(pastedHtml));
    } else if (has('text/plain')) {
        const text = await get('text/plain');
        rows = parsePastedText(text);
    }
    if (!rows) return { rows: [] };

    return { rows, payload };
};

const formatRowsAsTSV = (rows: string[][]) => rows.map((row) => row.join('\t')).join('\n');

const formatRowsAsHTML = (rows: string[][], payload?: ClipboardPayload<any>) => {
    const trs = rows
        .map((row) => {
            const tds = row.map(formatTextAsHTML).map((cell) => `<td>${cell}</td>`);
            return tds.join('');
        })
        .map((row) => `<tr>${row}</tr>`)
        .join('\n');

    const table = `<table>${trs}</table>`;

    if (payload) {
        const extra = `<SheetHappens payload="${formatTextAsHTML(JSON.stringify(payload))}"></SheetHappens>`;
        return extra + table;
    }

    return table;
};

const formatTextAsHTML = (s: string) => s.replace(/[&"'<>]/g, (i) => `&#${i.charCodeAt(0)};`);

const formatSelectionAsRows = (selection: Rectangle, editData: CellPropertyFunction<string>) => {
    if (isEmptySelection(selection)) return [];

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

    return rows;
};

const findTag = (element: any, tagName: string): any => {
    for (const child of element.children) {
        if (child.nodeName === tagName) {
            return child;
        }
        const maybeTag = findTag(child, tagName);
        if (maybeTag) {
            return maybeTag;
        }
    }
};

const parsePastedHtml = (
    html: string
): {
    rows: string[][];
    payload: any;
} => {
    const div = document.createElement('div');
    div.innerHTML = html.trim();

    const rows = [];
    let payload: any = undefined;

    const sheetNode = findTag(div, 'SHEETHAPPENS');
    if (sheetNode) {
        const json = sheetNode.getAttribute('payload');
        try {
            payload = JSON.parse(json);
        } catch (e) {}
    }

    const tableNode = findTag(div, 'TABLE');
    if (tableNode) {
        for (const tableChild of tableNode.children) {
            if (tableChild.nodeName === 'TBODY') {
                for (const tr of tableChild.children) {
                    if (tr.nodeName === 'TR') {
                        const row = [];
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

                                row.push(str);
                            }
                        }
                        rows.push(row);
                    }
                }
            }
        }
    }

    return {
        rows,
        payload,
    };
};

const parsePastedText = (text: string): string[][] => {
    return text.split(/\r?\n/).map((line) => line.split('\t'));
};
