import { readFileSync } from 'fs';
import { join } from 'path';
import { createElement } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { parseClipboardTable, parsePastedHtml, useClipboardAPI } from './clipboard';
import { Change, ClipboardTable, Rectangle } from './types';

// A real clipboard capture: Excel for Mac 16, en-US separators. Column B2:B10 of a test
// workbook, one cell per number format. Only the user name in the file path was changed.
const EXCEL_MAC = readFileSync(join(__dirname, '__fixtures__', 'excel-mac.html'), 'utf8');

const attr = (json: object) => JSON.stringify(json).replace(/"/g, '&quot;');

// The shapes below are written after published captures of each application, not captured here.
const googleSheetsRange = (cells: string[]) =>
    `<meta charset='utf-8'><google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}--></style>` +
    `<table xmlns="http://www.w3.org/1999/xhtml" cellspacing="0" cellpadding="0" dir="ltr" border="1" data-sheets-root="1"><colgroup><col width="100"/></colgroup><tbody>` +
    cells.map((cell) => `<tr style="height:21px;">${cell}</tr>`).join('') +
    `</tbody></table>`;

const libreOffice = (cells: string[]) =>
    `<!DOCTYPE html>\n<html>\n<head>\n<meta http-equiv="content-type" content="text/html; charset=utf-8"/>\n<title></title>\n` +
    `<meta name="generator" content="LibreOffice 7.5.0.3 (MacOSX)"/>\n<style type="text/css">\nbody,div,table,thead,tbody,tfoot,tr,th,td,p { font-family:"Liberation Sans"; font-size:x-small }\n</style>\n</head>\n<body>\n` +
    `<table cellspacing="0" border="0">\n<colgroup width="85"></colgroup>\n` +
    cells.map((cell) => `<tr>\n${cell}\n</tr>\n`).join('') +
    `</table>\n</body>\n</html>`;

describe('text of pasted cells', () => {
    it('reads each Excel cell as it is displayed, padding included', () => {
        expect(parsePastedHtml(EXCEL_MAC).rows).toEqual([
            ['-1220'],
            ['-1,220.00'],
            // the format pads between sign and digits with non-breaking spaces
            ['-' + ' '.repeat(23) + '1,220'],
            ['1220.5'],
            ['12%'],
            ['11/16/26'],
            ['00123'],
            ['1,234,567.89'],
            ['1,220'],
        ]);
    });

    it('still reads the payload of a copy made by sheet-happens', () => {
        const payload = { origin: 'here', data: { cells: { 0: { 0: 5 } } } };
        const html = `<SheetHappens payload="${attr(payload)}"></SheetHappens><table><tr><td>5,00</td></tr></table>`;
        expect(parsePastedHtml(html)).toEqual({ rows: [['5,00']], payload });
    });
});

describe('separators declared by the source', () => {
    it('reads the ones Excel formatted the copy with', () => {
        expect(parsePastedHtml(EXCEL_MAC).separators).toEqual({ decimal: '.', group: ',' });
    });

    it('follows the declaration when Excel uses a decimal comma', () => {
        const html = EXCEL_MAC.replace('separator:"\\."', 'separator:"\\,"').replace(
            'thousand-separator:"\\,"',
            'thousand-separator:"\\."',
        );
        expect(parsePastedHtml(html).separators).toEqual({ decimal: ',', group: '.' });
    });

    it('reads a non-breaking grouping space as the plain space cell text gets', () => {
        const html = EXCEL_MAC.replace('separator:"\\."', 'separator:"\\,"').replace(
            'thousand-separator:"\\,"',
            'thousand-separator:"\\00A0"',
        );
        expect(parsePastedHtml(html).separators).toEqual({ decimal: ',', group: ' ' });
    });

    it('is absent for a source that declares none', () => {
        expect(parsePastedHtml('<table><tr><td>1,220</td></tr></table>').separators).toBeUndefined();
    });

    it('ignores a declaration that cannot be a pair of separators', () => {
        const html = EXCEL_MAC.replace('thousand-separator:"\\,"', 'thousand-separator:"\\."');
        expect(parsePastedHtml(html).separators).toBeUndefined();
    });
});

describe('exact numbers attached by the source', () => {
    it('finds none in an Excel copy, which carries displayed text only', () => {
        expect(parsePastedHtml(EXCEL_MAC).numbers).toBeUndefined();
    });

    it('reads Google Sheets numbers, and leaves text and booleans to the cell text', () => {
        const html = googleSheetsRange([
            `<td data-sheets-value="${attr({ '1': 3, '3': -1220 })}" data-sheets-numberformat="${attr({ '1': 2, '2': '#,##0.00', '3': 1 })}">-1,220.00</td>` +
                `<td data-sheets-value="${attr({ '1': 2, '2': '00123' })}">00123</td>`,
            `<td data-sheets-value="${attr({ '1': 3, '3': 0.125 })}">12.50%</td>` +
                `<td data-sheets-value="${attr({ '1': 4, '4': 1 })}">TRUE</td>`,
        ]);
        expect(parsePastedHtml(html)).toMatchObject({
            rows: [
                ['-1,220.00', '00123'],
                ['12.50%', 'TRUE'],
            ],
            numbers: { 0: { 0: -1220 }, 1: { 0: 0.125 } },
        });
    });

    it('reads a single Google Sheets cell, which is copied as a span instead of a table', () => {
        const html =
            `<meta charset="utf-8"><google-sheets-html-origin><style type="text/css"><!--td {border: 1px solid #cccccc;}--></style>` +
            `<span style="font-size:10pt;font-family:Arial;" data-sheets-root="1" data-sheets-value="${attr({ '1': 3, '3': 1.23456 })}">1.23</span>`;
        expect(parsePastedHtml(html)).toMatchObject({ rows: [['1.23']], numbers: { 0: { 0: 1.23456 } } });
    });

    it('reads LibreOffice values, written with the decimal mark of its locale', () => {
        const html = libreOffice([
            `<td height="17" align="right" sdval="1234567,891" sdnum="1031;0;#.##0,00">1.234.567,89</td>`,
            `<td align="right" sdval="-1234.5" sdnum="1033;0;#,##0.00">-1,234.50</td>`,
            `<td align="right" sdval="1,23456789012346E+017" sdnum="1031;">1,23456789012346E+017</td>`,
            `<td align="left">Text</td>`,
        ]);
        expect(parsePastedHtml(html).numbers).toEqual({
            0: { 0: 1234567.891 },
            1: { 0: -1234.5 },
            2: { 0: 1.23456789012346e17 },
        });
    });

    it('prefers the LibreOffice value over the Google one LibreOffice writes with fractions cut off', () => {
        const html = libreOffice([
            `<td align="right" sdval="1234.5678" sdnum="1033;0;#,##0.00" data-sheets-value="${attr({ '1': 3, '3': 1234 })}">1,234.57</td>`,
        ]);
        expect(parsePastedHtml(html).numbers).toEqual({ 0: { 0: 1234.5678 } });
    });

    it('reads the raw value Excel writes into saved web pages', () => {
        const html = `<table><tr><td x:num="1234.5">1,234.50</td><td x:num>42</td><td x:num="1234,5">1.234,50</td></tr></table>`;
        expect(parsePastedHtml(html).numbers).toEqual({ 0: { 0: 1234.5 } });
    });

    it('treats a malformed value as no value', () => {
        const html = googleSheetsRange([
            `<td data-sheets-value="{not json">1</td>` +
                `<td data-sheets-value="${attr({ '1': 3, '3': '5' })}">5</td>` +
                `<td sdval="1.234,5">1.234,5</td>` +
                `<td sdval="abc" data-sheets-value="${attr({ '1': 3, '3': 7 })}">7</td>`,
        ]);
        expect(parsePastedHtml(html)).toMatchObject({ rows: [['1', '5', '1.234,5', '7']] });
        expect(parsePastedHtml(html).numbers).toBeUndefined();
    });
});

describe('a separator nothing on the clipboard explains', () => {
    const clipboard = (flavors: Record<string, string>) =>
        ({ types: Object.keys(flavors), getData: (type: string) => flavors[type] }) as any;
    const plain = async (text: string) =>
        (await parseClipboardTable(clipboard({ 'text/plain': text })))?.ambiguousSeparator;

    it('is the comma before three digits, in a paste of plain text', async () => {
        expect(await plain('1,220\t2,500\t- 1,220\n')).toBe(',');
    });

    it('looks past the sign, brackets and currency around the number', async () => {
        expect(await plain('-1,220\t(1,220)\t$1,220\n')).toBe(',');
    });

    it('is absent when the cells disagree on the character', async () => {
        expect(await plain('1,220\t1.220\n')).toBeUndefined();
    });

    it('is absent when no cell has three digits after its separator', async () => {
        expect(await plain('1,22\t12,5\tabc\n')).toBeUndefined();
    });

    it('is found in a table that carries no hints', async () => {
        const html = '<table><tr><td>1,220</td></tr></table>';
        expect((await parseClipboardTable(clipboard({ 'text/html': html })))?.ambiguousSeparator).toBe(',');
    });

    it('is absent when Excel declares its separators', async () => {
        const parsed = await parseClipboardTable(clipboard({ 'text/html': EXCEL_MAC }));
        expect(parsed?.ambiguousSeparator).toBeUndefined();
    });

    it('is absent when Google Sheets attaches the exact numbers', async () => {
        const html = googleSheetsRange([`<td data-sheets-value="${attr({ '1': 3, '3': 1220 })}">1,220</td>`]);
        expect((await parseClipboardTable(clipboard({ 'text/html': html })))?.ambiguousSeparator).toBeUndefined();
    });
});

describe('a number too wide for its Excel column', () => {
    const html = `<table><tr><td>#######</td><td>12.35</td></tr><tr><td>#DIV/0!</td><td>####</td></tr></table>`;
    const clipboard = (plain: string) =>
        ({
            types: ['text/html', 'text/plain'],
            getData: (type: string) => (type === 'text/html' ? html : plain),
        }) as any;

    it('is taken from the plain text of the same copy', async () => {
        const parsed = await parseClipboardTable(clipboard('123456789.25\t12.35\r\n#DIV/0!\t0.5\r\n'));
        expect(parsed?.rows).toEqual([
            ['123456789.25', '12.35'],
            ['#DIV/0!', '0.5'],
        ]);
    });

    it('stays as displayed when the plain text does not line up with the table', async () => {
        const parsed = await parseClipboardTable(clipboard('123456789.25\t12.35\r\n'));
        expect(parsed?.rows).toEqual([
            ['#######', '12.35'],
            ['#DIV/0!', '####'],
        ]);
    });
});

describe('pasting into the sheet', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
    });
    afterEach(() => {
        act(() => {
            unmountComponentAtNode(container);
        });
    });

    const paste = async (html: string, readOnly: (x: number, y: number) => boolean = () => false) => {
        const onChange = jest.fn<void, [Change[], ClipboardTable | undefined]>();
        const selection: Rectangle = [
            [2, 3],
            [2, 3],
        ];
        const Paster = () => {
            useClipboardAPI(
                selection,
                () => '',
                () => null,
                readOnly,
                true,
                undefined,
                onChange,
            );
            return null;
        };
        act(() => {
            render(createElement(Paster), container);
        });

        const event: any = new Event('paste');
        event.clipboardData = { types: ['text/html'], getData: () => html };
        await act(async () => {
            window.document.dispatchEvent(event);
        });
        return onChange;
    };

    it('hands each change the exact number of its cell, and the paste its separators', async () => {
        const html = googleSheetsRange([
            `<td data-sheets-value="${attr({ '1': 3, '3': -1220 })}">-1,220.00</td><td>plain</td>`,
        ]);
        const onChange = await paste(html);

        expect(onChange).toHaveBeenCalledTimes(1);
        const [changes, table] = onChange.mock.calls[0];
        expect(changes).toEqual([
            { x: 2, y: 3, value: '-1,220.00', data: undefined, number: -1220 },
            { x: 3, y: 3, value: 'plain', data: undefined },
        ]);
        expect(changes[1]).not.toHaveProperty('number');
        expect(table?.numbers).toEqual({ 0: { 0: -1220 } });
    });

    it('passes on the separators Excel declared', async () => {
        const onChange = await paste(EXCEL_MAC);
        const [changes, table] = onChange.mock.calls[0];
        expect(changes.map((change) => change.value)).toContain('-1,220.00');
        expect(table?.separators).toEqual({ decimal: '.', group: ',' });
    });

    it('passes on a separator nothing on the clipboard explains', async () => {
        const onChange = await paste('<table><tr><td>1,220</td></tr></table>');
        const [, table] = onChange.mock.calls[0];
        expect(table?.ambiguousSeparator).toBe(',');
    });
});
