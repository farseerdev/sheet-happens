import {
    ClipboardNumbers,
    ClipboardPayload,
    ClipboardRawTable,
    ClipboardSeparators,
    ClipboardTable,
    ClipboardTableCells,
    CellPropertyFunction,
    Change,
    Rectangle,
} from './types';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { findApproxMaxEditDataIndex } from './props';
import {
    normalizeSelection,
    isMaybeRowSelection,
    isMaybeColumnSelection,
    isEmptySelection,
    addXY,
    subXY,
    mulXY,
    forSelectionRows,
    forSelectionColumns,
} from './coordinate';

const NON_BREAKING_SPACE = ' ';
const NON_BREAKING_SPACES = /[\u00a0\u202f]/g;

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

const EMPTY_TABLE: ClipboardTable<any> = { rows: [] };

// Access clipboard as HTML table + JSON payload.
// Provide peek access to clipboard if permission granted.
// Ask permission on first copy.
export const useClipboardTable = <T extends ClipboardTableCells>(clipboardOrigin: string) => {
    const [peek, setPeek] = useState<ClipboardTable<T> | null>();

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
                const pasted = await pasteClipboardTable<T>();
                if (pasted) {
                    const peek = validateClipboardTable<T>(pasted, clipboardOrigin);
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
        [peek],
    );

    return {
        peek,
        canPaste,
        copyTable: ({ rows, ...rest }: ClipboardTable<T>) =>
            copyClipboardTable(rows, { origin: clipboardOrigin, ...rest }),
        pasteTable: async (): Promise<ClipboardTable<T> | null> => {
            const pasted = await pasteClipboardTable<T>();
            if (!pasted) return null;

            return validateClipboardTable<T>(pasted, clipboardOrigin);
        },
    };
};

// Sheet clipboard with payload-handler injected
export const useClipboardAPI = <T extends ClipboardTableCells = ClipboardTableCells>(
    selection: Rectangle,
    editData: CellPropertyFunction<string>,
    sourceData: CellPropertyFunction<object | string | number | null>,
    cellReadOnly: CellPropertyFunction<boolean>,
    addListener: boolean,

    onSelectionChange?: (selection: Rectangle) => void,
    onChange?: (changes: Change[], paste?: ClipboardTable<T>) => void,
    onCopy?: (selection: Rectangle, cut: boolean) => ClipboardTable<T> | null | undefined,
    onPaste?: (
        selection: Rectangle,
        table?: ClipboardTable<T>,
    ) => boolean | null | undefined | Promise<boolean | null | undefined>,
    clipboardOrigin: string = '',
) => {
    const { canPaste, copyTable, pasteTable } = useClipboardTable<T>(clipboardOrigin);

    const pasteIntoSelection = useCallback(
        async (selection: Rectangle, table: ClipboardTable<T>) => {
            const { rows, data, numbers } = table;

            const [min, max] = normalizeSelection(selection);
            const [minX, minY] = min;

            const left = Math.max(0, minX);
            const top = Math.max(0, minY);

            const width = rows.reduce((a, b) => Math.max(a, b.length), 0);
            const height = rows.length;

            const selectionSize = mulXY(addXY(subXY(max, min), [1, 1]), [1 / width, 1 / height]);
            const repeatX = Math.max(1, Math.floor(selectionSize[0]));
            const repeatY = Math.max(1, Math.floor(selectionSize[1]));

            const newSelection: Rectangle = [min, addXY(min, [width * repeatX - 1, height * repeatY - 1])];

            const shouldPaste = await onPaste?.(newSelection, table);
            if (shouldPaste !== false) {
                const changes = rows
                    .flatMap((row, j) =>
                        row.flatMap((value, i) => {
                            const cells: Change[] = [];
                            for (let rx = 0; rx < repeatX; ++rx) {
                                for (let ry = 0; ry < repeatY; ++ry) {
                                    const x = left + i + rx * width;
                                    const y = top + j + ry * height;
                                    const v = data?.cells?.[j]?.[i];
                                    const number = numbers?.[j]?.[i];
                                    if (cellReadOnly?.(x, y)) continue;

                                    const change: Change = { x, y, value, data: v };
                                    if (number != null) change.number = number;
                                    cells.push(change);
                                }
                            }
                            return cells;
                        }),
                    )
                    .filter((change) => !!change) as Change[];

                onChange?.(changes, table);
                onSelectionChange?.(newSelection);
            }
        },
        [onChange, onSelectionChange, cellReadOnly],
    );

    // Imperative API
    const copySelection = useCallback(
        async (selection: Rectangle, cut: boolean = false) => {
            const table =
                onCopy?.(selection, cut) ??
                (formatSelectionAsRows(selection, editData, sourceData) as ClipboardTable<T>);
            copyTable(table);

            if (table?.cut ?? cut) {
                const changes: Change[] = [];
                forSelectionRows(selection)((y: number) => {
                    forSelectionColumns(selection)((x: number) => {
                        if (!cellReadOnly?.(x, y)) {
                            const change = { x, y, value: '', data: null };
                            changes.push(change);
                        }
                    });
                });
                onChange?.(changes);
            }
        },
        [onCopy, onChange, cellReadOnly],
    );

    const pasteSelection = useCallback(
        async (selection: Rectangle) => {
            const table = await pasteTable();
            if (table) pasteIntoSelection(selection, table);
        },
        [pasteIntoSelection],
    );

    // Event handlers
    const onClipboardCopy = (cut: boolean) => {
        if (isEmptySelection(selection)) return;
        return copySelection(selection, cut);
    };

    const onClipboardPaste = async (e: any) => {
        e.preventDefault();

        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const parsed = await parseClipboardTable<T>(clipboardData);
        if (parsed) {
            const table = validateClipboardTable<T>(parsed, clipboardOrigin);
            if (table) pasteIntoSelection(selection, table);
        }
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
        [copySelection, pasteSelection, canPaste],
    );

    return { clipboardApi, onClipboardCopy, onClipboardPaste };
};

const validateClipboardTable = <T extends ClipboardTableCells>(
    parsed: ClipboardRawTable<T>,
    clipboardOrigin: string,
): ClipboardTable<T> => {
    const { rows, payload, numbers, separators } = parsed;

    // What the source says about its numbers holds wherever the copy came from;
    // the payload is only meaningful to the application that wrote it.
    const table: ClipboardTable<T> = { rows };
    if (numbers) table.numbers = numbers;
    if (separators) table.separators = separators;
    if (!payload) return table;

    const { origin, ...rest } = payload;
    if (origin === clipboardOrigin) return { ...table, ...rest };
    return table;
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

const pasteClipboardTable = async <T extends ClipboardTableCells>(): Promise<ClipboardTable<T> | null> => {
    // Chrome and Edge strip <style> from clipboard HTML unless asked not to, and that is
    // where Excel declares its separators. Browsers without the option ignore it.
    const items = await (navigator.clipboard as any).read({ unsanitized: ['text/html'] });
    const [item] = items;
    if (!item) return null;

    return await parseClipboardTable(item);
};

export const parseClipboardTable = async <T extends ClipboardTableCells>(
    item: ClipboardItem | DataTransfer,
): Promise<ClipboardRawTable<T> | null> => {
    // Work with both clipboard API (ClipboardItem) and onpaste event (DataTransfer)
    const has = (type: string) => {
        return item.types.includes(type);
    };

    const get = (type: string) => {
        if ('getData' in item) return item.getData(type);
        else if ('getType' in item) return (item as any).getType(type).then((blob: Blob) => blob.text());
        return '';
    };

    if (has('text/html')) {
        const parsed = parsePastedHtml(await get('text/html'));
        if (has('text/plain') && parsed.rows.some((row) => row.some(isOverflowText))) {
            restoreOverflowText(parsed.rows, parsePastedText(await get('text/plain')));
        }
        return parsed;
    }
    if (has('text/plain')) {
        const text = await get('text/plain');
        return { rows: parsePastedText(text) };
    }
    return { rows: [] };
};

// Excel renders a number too wide for its column as "#####", and copies that rendering
// into the HTML. The plain text flavor of the same copy can still hold the number.
const isOverflowText = (text: string) => /^#+$/.test(text);

const restoreOverflowText = (rows: string[][], plain: string[][]) => {
    // Every plain text row ends in a line break, which reads as one empty row too many
    const last = plain[plain.length - 1];
    if (last?.length === 1 && last[0] === '') plain = plain.slice(0, -1);

    // Only trust the plain text where it lines up with the table cell for cell
    if (plain.length !== rows.length) return;
    rows.forEach((row, j) => {
        if (plain[j].length !== row.length) return;
        row.forEach((text, i) => {
            const replacement = plain[j][i].trim();
            if (isOverflowText(text) && replacement !== '') row[i] = replacement;
        });
    });
};

const formatRowsAsTSV = (rows: string[][]) => rows.map((row) => row.join('\t')).join('\n');

const formatRowsAsHTML = (rows: string[][], payload?: ClipboardPayload<any>) => {
    const trs = rows
        .map((row) => {
            const tds = row
                .map(formatTextAsHTML)
                .map(
                    (cell) =>
                        `<td>${cell.replaceAll(/ +/g, (x) => ' ' + NON_BREAKING_SPACE.repeat(x.length - 1))}</td>`,
                );
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

const formatTextAsHTML = (s: string) => s?.toString().replace(/[&"'<>]/g, (i) => `&#${i.charCodeAt(0)};`) ?? '';

const formatSelectionAsRows = (
    selection: Rectangle,
    editData: CellPropertyFunction<string>,
    sourceData: CellPropertyFunction<object | string | number | null>,
): ClipboardTable => {
    if (isEmptySelection(selection)) return { rows: [] };

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

    const texts: string[][] = [];
    const datas: Record<string, Record<string, any>> = {};

    for (let y = minY; y <= maxY; y++) {
        const textRow: string[] = [];
        const dataRow: Record<string, any> = {};

        for (let x = minX; x <= maxX; x++) {
            const value = editData(x, y) ?? '';
            const data = sourceData(x, y) ?? null;
            dataRow[textRow.length] = data;
            textRow.push(value);
        }

        datas[texts.length] = dataRow;
        texts.push(textRow);
    }

    return { rows: texts, data: { cells: datas } };
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

// A number in the notation every source uses for its raw values: no grouping, period decimal
const PLAIN_NUMBER = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

const parsePlainNumber = (text: string): number | undefined => {
    if (!PLAIN_NUMBER.test(text)) return undefined;
    const number = Number(text);
    return Number.isFinite(number) ? number : undefined;
};

// The exact number a source application attached to a cell, next to the text it displays.
// The text alone is ambiguous ("1,220" is 1220 or 1.22 depending on who formatted it);
// these attributes are not. Anything malformed counts as no number: the text is still there.
const readCellNumber = (cell: Element): number | undefined => {
    // LibreOffice: the raw value, never grouped, with the decimal mark of its own locale.
    // It goes first because LibreOffice also writes Google's attribute, with fractions cut off.
    const sdval = cell.getAttribute('sdval');
    if (sdval != null) return parsePlainNumber(sdval.trim().replace(',', '.'));

    // Google Sheets: {"1": <type>, "<type>": <value>}, where type 3 is a number
    const sheetsValue = cell.getAttribute('data-sheets-value');
    if (sheetsValue != null) {
        try {
            const json = JSON.parse(sheetsValue);
            const number = json?.['1'] === 3 ? json['3'] : undefined;
            return typeof number === 'number' && Number.isFinite(number) ? number : undefined;
        } catch (e) {
            return undefined;
        }
    }

    // Excel: the raw value. Desktop Excel does not put it on the clipboard today, but files
    // it saves as a web page and other applications writing for Excel do.
    const excelNumber = cell.getAttribute('x:num');
    if (excelNumber) return parsePlainNumber(excelNumber.trim());

    return undefined;
};

// Value of a quoted CSS string property anywhere in the markup, with its escapes resolved
const readCssString = (html: string, property: string): string | undefined => {
    const match = new RegExp(`${property}\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i').exec(html);
    if (!match) return undefined;

    return match[1].replace(/\\(?:([0-9a-f]{1,6}) ?|(.))/gi, (_, hex, char) =>
        hex ? String.fromCodePoint(parseInt(hex, 16)) : char,
    );
};

// Excel declares the characters it formatted the copied numbers with, once, in its <style>:
//   table {mso-displayed-decimal-separator:"\."; mso-displayed-thousand-separator:"\,";}
// Read from the raw markup, because a CSS parser drops properties it does not know.
const readSeparators = (html: string): ClipboardSeparators | undefined => {
    const isSeparator = (s: string) => s.length === 1 && !/\d/.test(s);

    const decimal = readCssString(html, 'mso-displayed-decimal-separator');
    if (decimal == null || !isSeparator(decimal)) return undefined;

    // Cell text has its non-breaking spaces replaced, so a grouping space is a plain one too
    const group = readCssString(html, 'mso-displayed-thousand-separator')?.replace(NON_BREAKING_SPACES, ' ');
    if (group == null || group === '') return { decimal, group: null };
    if (!isSeparator(group) || group === decimal) return undefined;

    return { decimal, group };
};

export const parsePastedHtml = (html: string): ClipboardRawTable<any> => {
    // A document of its own, so nothing in the clipboard's markup loads or runs in the page
    const root = new DOMParser().parseFromString(html.trim(), 'text/html').documentElement;

    const rows: string[][] = [];
    const numbers: ClipboardNumbers = {};
    let payload: any = undefined;

    const addNumber = (cell: Element, row: number, column: number) => {
        const number = readCellNumber(cell);
        if (number == null) return;
        if (!numbers[row]) numbers[row] = {};
        numbers[row][column] = number;
    };

    const sheetNode = findTag(root, 'SHEETHAPPENS');
    if (sheetNode) {
        const json = sheetNode.getAttribute('payload');
        try {
            payload = JSON.parse(json);
            if (!payload || typeof payload !== 'object') payload = null;
        } catch (e) {}
    }

    const tableNode = findTag(root, 'TABLE');
    const spanNode = findTag(root, 'SPAN');

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
                                str = str.replaceAll(/[\r\n\t ]+/g, ' ');
                                str = str.replaceAll(NON_BREAKING_SPACES, ' ');

                                addNumber(td, rows.length, row.length);
                                row.push(str);
                            }
                        }
                        rows.push(row);
                    }
                }
            }
        }
    } else if (spanNode) {
        // A single cell copied from Google Sheets is a bare span carrying the cell's attributes
        let str: string = '';

        str = spanNode.textContent.trim();
        str = str.replaceAll('\n', '');
        str = str.replaceAll(/\s\s+/g, ' ');

        addNumber(spanNode, 0, 0);
        rows.push([str]);
    }

    const parsed: ClipboardRawTable<any> = { rows, payload };
    if (Object.keys(numbers).length) parsed.numbers = numbers;

    const separators = readSeparators(html);
    if (separators) parsed.separators = separators;

    return parsed;
};

export const parsePastedText = (text: string): string[][] => {
    return text.split(/\r?\n/).map((line) => line.split('\t'));
};
