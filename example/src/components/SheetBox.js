import React, { useState } from 'react';
import Sheet from 'sheet-happens';
import { svgToImage } from 'sheet-happens';
import 'sheet-happens/dist/index.css';

const initialDataBig = [];
for (let row = 0; row < 1000; row++) {
    const r = [];
    for (let col = 0; col < 100; col++) {
        r.push(`Row: ${row}, Col: ${col}`);
    }
    initialDataBig.push(r);
}

const initialDataBasic = [
    ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'],
    [1, 2, 3, 'Lorem ipsum dolor sit amet', 5, 6],
    [1, 2, 3, 'consectetur adipisicing elit', 5, 6],
    [1, 2, 3, 'sed do eiusmod tempor incididunt', 5, 6],
    [1, 2, 3, '4', 5, 6],
    [1, 2, 3, '4', 5, 6],
    [1, 2, 3, '4', 5, 6],
    [1, 2, 3, '4', 5, 6],
    [1, 2, 3, '4', 5, 6],
];

const initialDataFormatting = [];
for (let row = 0; row < 1000; row++) {
    const r = [];
    for (let col = 0; col < 100; col++) {
        r.push(Math.random() * 1000000);
    }
    initialDataFormatting.push(r);
}

const triangleDownImageSrc =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiDQoJIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBvdmVyZmxvdz0idmlzaWJsZSIgPg0KPHBvbHlnb24gcG9pbnRzPSIwLDAgMTAwLDAgNTAsMTAwIiBzdHlsZT0iZmlsbDojOTk5OTk5OyIvPg0KPC9zdmc+DQo=';

const checkedSVG = svgToImage(
    <svg fillRule="evenodd" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5 2C3.34315 2 2 3.34315 2 5V11C2 12.6569 3.34315 14 5 14H11C12.6569 14 14 12.6569 14 11V5C14 3.34315 12.6569 2 11 2H5ZM11.2071 7.20711C11.5976 6.81658 11.5976 6.18342 11.2071 5.79289C10.8165 5.40237 10.1834 5.40237 9.79285 5.79289L7.24133 8.34441L6.20706 7.31014C5.81654 6.91962 5.18338 6.91962 4.79285 7.31014C4.40233 7.70066 4.40233 8.33383 4.79285 8.72435L6.53422 10.4657L7.24133 11.1728L7.94844 10.4657L11.2071 7.20711Z"
        />
    </svg>,
);

export const DEFAULT_HEADER_WIDTH = 50;

export const DEFAULT_CELL_WIDTH = 100;
export const DEFAULT_CELL_HEIGHT = 22;

export function useWidthHeightControl(
    initialWidths = {},
    initialHeights = {},
    getColumnOrder = (i) => i,
    getRowOrder = (i) => i,
) {
    const [cellWidth, setCellWidth] = useState(initialWidths);
    const [cellHeight, setCellHeight] = useState(initialHeights);

    const onCellWidthChange = (indices, newWidths) => {
        setCellWidth((cellWidth) => {
            const cw = { ...cellWidth };
            for (const [i, order] of indices.entries()) {
                const idx = getColumnOrder(order);
                cw[idx] = newWidths[i] ?? DEFAULT_CELL_WIDTH;
            }
            return cw;
        });
    };

    const onCellHeightChange = (indices, newHeights) => {
        setCellHeight((cellHeight) => {
            const ch = { ...cellHeight };
            for (const [i, order] of indices.entries()) {
                const idx = getRowOrder(order);
                ch[idx] = newHeights[i] ?? DEFAULT_CELL_HEIGHT;
            }
            return ch;
        });
    };

    const cw = (x) => cellWidth[getColumnOrder(x)] ?? (x < 0 ? DEFAULT_HEADER_WIDTH : DEFAULT_CELL_WIDTH);
    const ch = (y) => cellHeight[getRowOrder(y)] ?? DEFAULT_CELL_HEIGHT;

    return { onCellWidthChange, onCellHeightChange, cellWidth: cw, cellHeight: ch };
}

export function useOrderControl(initialColumns = [], initialRows = []) {
    const [columnOrder, setColumnOrder] = useState(initialColumns);
    const [rowOrder, setRowOrder] = useState(initialRows);

    const getColumnOrder = (x) => columnOrder[x] ?? x;
    const getRowOrder = (y) => rowOrder[y] ?? y;

    const onColumnOrderChange = (indices, order) => {
        const co = [...columnOrder];

        // Extend column order to cover operation
        const n = Math.max(order + indices.length, order + indices.reduce((a, b) => Math.max(a, b), 0));
        while (co.length < n) co.push(co.length);

        // Remove old columns one by one (indices may be disjoint but are always increasing)
        for (let i = 0; i < indices.length; ++i) co.splice(indices[i] - i, 1);

        // Splice in new indices mapped to old order
        co.splice(order, 0, ...indices.map((i) => columnOrder[i] ?? i));

        setColumnOrder(co);
    };

    const onRowOrderChange = (indices, order) => {
        const ro = [...rowOrder];

        // Extend row order to cover operation
        const n = Math.max(order + indices.length, order + indices.reduce((a, b) => Math.max(a, b), 0));

        while (ro.length < n) ro.push(ro.length);

        // Remove old rows one by one (indices may be disjoint but are always increasing)
        for (let i = 0; i < indices.length; ++i) ro.splice(indices[i] - i, 1);

        // Splice in new indices mapped to old order
        ro.splice(order, 0, ...indices.map((i) => rowOrder[i] ?? i));

        setRowOrder(ro);
    };

    return { getColumnOrder, getRowOrder, onColumnOrderChange, onRowOrderChange };
}

export function SheetBoxHeader() {
    const [data, setData] = useState(initialDataBig);

    const { onColumnOrderChange, onRowOrderChange, getColumnOrder, getRowOrder } = useOrderControl();
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl(
        [],
        [],
        getColumnOrder,
        getRowOrder,
    );

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = ['A', 'B', 'C'];
    const cellStyle = (x, y) => {
        return {};
    };

    const editData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const displayData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const sourceData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const editKeys = (x, y) => {
        return `${x},${y}`;
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            const cx = getColumnOrder(change.x);
            const cy = getRowOrder(change.y);
            if (!newData[cy]) {
                newData[cy] = [];
            }
            newData[cy][cx] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                onColumnOrderChange={onColumnOrderChange}
                onRowOrderChange={onRowOrderChange}
                editKeys={editKeys}
                autoFocus
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxBasic() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(initialDataBasic)));
    const { onColumnOrderChange, onRowOrderChange, getColumnOrder, getRowOrder } = useOrderControl();
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl(
        [],
        [],
        getColumnOrder,
        getRowOrder,
    );

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = ['A', 'B', 'C'];
    const cellStyle = (x, y) => {
        return {};
    };

    const editData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const displayData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const sourceData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            const cx = getColumnOrder(change.x);
            const cy = getRowOrder(change.y);
            if (!newData[cy]) {
                newData[cy] = [];
            }
            newData[cy][cx] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                onColumnOrderChange={onColumnOrderChange}
                onRowOrderChange={onRowOrderChange}
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxStyle() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(initialDataBasic)));
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl();

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = (index) => {
        if (index === 0) {
            return {
                items: [
                    {
                        display: 'space',
                        width: 12,
                        height: 12,
                    },
                    {
                        display: 'inline',
                        text: 'A',

                        textAlign: 'center',
                        flexGrow: 1,
                        flexShrink: 0,
                    },
                    {
                        display: 'icon',
                        src: triangleDownImageSrc,

                        width: 12,
                        height: 12,

                        flexShrink: 0,
                        flexAlignSelf: 'start',
                        marginTop: 2,

                        onClick: () => {
                            console.log('click');
                        },
                    },
                ],
            };
        } else {
            return null;
        }
    };
    const colors = ['#000', '#d02', '#290', '#24f'];
    const alignment = ['left', 'right', 'center'];
    const weight = ['normal', 'bold', 'lighter'];
    const cellStyle = (x, y) => {
        if (x === 0 || y === 0) {
            return {
                color: colors[y % 4],
                fillColor: '#6DA2FB22',
                marginRight: 5,
            };
        }
        return {
            color: colors[y % 4],
            textAlign: x === 3 && y < 4 ? alignment[(y - 1) % 3] : alignment[x % 3],
            weight: weight[y % 3],
        };
    };
    const editData = (x, y) => {
        return data?.[y]?.[x];
    };
    const incrementCell = (x, y) => {
        const newData = [...data];
        if (newData[y] && newData[y][x] !== undefined) {
            newData[y][x] += 1;
        }
        setData(newData);
    };
    const displayData = (x, y) => {
        if (x === 0 && y > 0 && y < 9) {
            return {
                items: [
                    {
                        display: 'inline',
                        text: data?.[y]?.[x],

                        textAlign: 'left',
                        flexGrow: 1,
                    },
                    {
                        display: 'icon',
                        image: checkedSVG,

                        width: 16,
                        height: 16,

                        flexShrink: 0,
                        flexAlignSelf: 'start',

                        onClick: () => {
                            incrementCell(x, y);
                        },
                    },
                ],
            };
        }
        return data?.[y]?.[x];
    };
    const sourceData = (x, y) => {
        return data?.[y]?.[x];
    };
    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            if (!newData[change.y]) {
                newData[change.y] = [];
            }
            newData[change.y][change.x] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                sheetStyle={{
                    freezeColumns: 1,
                    freezeRows: 1,
                }}
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxFormatting() {
    const [data, setData] = useState(initialDataFormatting);
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl();

    const cellStyle = (x, y) => {
        return {};
    };
    const editData = (x, y) => {
        return data?.[y]?.[x];
    };
    const displayData = (x, y) => {
        return data?.[y]?.[x]?.toFixed?.(2);
    };
    const sourceData = (x, y) => {
        return data?.[y]?.[x];
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            if (!newData[change.y]) {
                newData[change.y] = [];
            }
            newData[change.y][change.x] = Number(change.value);
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxRender() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(initialDataBasic)));
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl();

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = ['A', 'B', 'C'];
    const cellStyle = (x, y) => {
        return {};
    };

    const editData = (x, y) => {
        return data?.[y]?.[x];
    };
    const displayData = (x, y) => {
        return data?.[y]?.[x];
    };
    const sourceData = (x, y) => {
        return data?.[y]?.[x];
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const { x, y, value } of changes) {
            if (!newData[y]) {
                newData[y] = [];
            }
            newData[y][x] = value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    const render = ({ visibleCells, cellLayout, selection, editMode }) => {
        if (editMode) return;

        const cell = [1, 2];
        const [anchor] = selection;
        const noteOpen = anchor[0] === cell[0] && anchor[1] === cell[1];

        const isCellVisible = visibleCells.columns.includes(cell[0]) && visibleCells.rows.includes(cell[1]);
        if (!isCellVisible) return null;

        const [, top] = cellLayout.cellToPixel(cell, [0, 0]);
        const [right] = cellLayout.cellToPixel(cell, [1, 1]);

        const marker = (
            <div
                style={{
                    position: 'absolute',
                    left: right,
                    top: top,
                    marginLeft: '-12px',
                    borderTop: '12px solid blue',
                    borderLeft: '12px solid transparent',
                    pointerEvents: 'none',
                }}
            />
        );

        const note = noteOpen ? (
            <div
                style={{
                    position: 'absolute',
                    left: right,
                    top,
                    padding: 10,
                    background: '#fff',
                    border: '1px solid #ccc',
                }}
            >
                Hello world
            </div>
        ) : null;

        return (
            <div onPointerDown={(e) => e.stopPropagation()}>
                {note}
                {marker}
            </div>
        );
    };

    return (
        <div className="sheet-box">
            <Sheet
                selection={[
                    [1, 2],
                    [1, 2],
                ]}
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                renderInside={render}
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxGrouped() {
    const [data, setData] = useState(initialDataBig);

    const { onColumnOrderChange, onRowOrderChange, getColumnOrder, getRowOrder } = useOrderControl();
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl(
        [],
        [],
        getColumnOrder,
        getRowOrder,
    );

    const groupKeys = [1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8];
    const orderedGroupKeys = groupKeys.map((_, i) => groupKeys[getRowOrder(i)]);

    const alternatingGroups = orderedGroupKeys
        .map((key, i) => key !== orderedGroupKeys[i - 1])
        .reduce((list, start) => {
            const last = list.at(-1) ?? 1;
            const bit = start ? 1 - last : last;
            list.push(bit);
            return list;
        }, []);

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = ['A', 'B', 'C'];
    const cellStyle = (x, y) => {
        return {
            fillColor: ['#ffffff', '#e0e0e0'][alternatingGroups[y]],
        };
    };

    const rowGroupKeys = (y) => {
        return orderedGroupKeys[y];
    };

    const editData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const displayData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const sourceData = (x, y) => {
        return data?.[getRowOrder(y)]?.[getColumnOrder(x)];
    };
    const editKeys = (x, y) => {
        return `${x},${y}`;
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            const cx = getColumnOrder(change.x);
            const cy = getRowOrder(change.y);
            if (!newData[cy]) {
                newData[cy] = [];
            }
            newData[cy][cx] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                onColumnOrderChange={onColumnOrderChange}
                onRowOrderChange={onRowOrderChange}
                rowGroupKeys={rowGroupKeys}
                editKeys={editKeys}
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxVeryBigData() {
    const [loadingStatus, setLoadingStatus] = useState('initial');
    const [data, setData] = useState([]);
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl();

    const loadClick = (e) => {
        e.preventDefault();
        setLoadingStatus('loading');
        fetch('./out.json')
            .then((response) => {
                return response.json();
            })
            .then((dataset) => {
                setData(dataset);
                setLoadingStatus('done');
            });
    };

    const cellStyle = (x, y) => {
        if (y === 0) {
            return {
                weight: 'bold',
                fontSize: 14,
            };
        }
        if (x === 4) {
            return {
                textAlign: 'right',
            };
        } else if (x === 1) {
            return {
                weight: 'bold',
                color: '#3b85ff',
            };
        } else if (x === 2) {
            return {
                color: '#fc3bff',
            };
        }
        return {};
    };
    const editData = (x, y) => {
        return data?.[y]?.[x];
    };
    const displayData = (x, y) => {
        if (x === 4 && y > 0) {
            if (data && data[y] && data[y][x]) {
                return Number(data[y][x]).toFixed(2);
            } else {
                return '';
            }
        }
        return data?.[y]?.[x];
    };
    const sourceData = (x, y) => {
        return data?.[y]?.[x];
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            if (!newData[change.y]) {
                newData[change.y] = [];
            }
            newData[change.y][change.x] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    const headerStyle = (index) => {
        const r = ((index * 2421) % 255).toString(16).padStart(2, '0');
        const g = ((index * 3215) % 255).toString(16).padStart(2, '0');
        const b = ((index * 1243) % 255).toString(16).padStart(2, '0');
        const color = `#${r}${g}${b}55`;
        return {
            backgroundColor: color,
        };
    };

    const columnHeaders = (index) => {
        return index ? '' + index : 'Long header with wrapping';
    };

    return (
        <>
            {loadingStatus === 'initial' ? (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a href="#" onClick={loadClick}>
                    Load global database of power plants
                </a>
            ) : loadingStatus === 'loading' ? (
                'Loading...'
            ) : null}
            <div className="sheet-box">
                <Sheet
                    cellStyle={cellStyle}
                    editData={editData}
                    displayData={displayData}
                    sourceData={sourceData}
                    cellWidth={cellWidth}
                    cellHeight={cellHeight}
                    onChange={onChange}
                    readOnly={isReadOnly}
                    onCellWidthChange={onCellWidthChange}
                    onCellHeightChange={onCellHeightChange}
                    columnHeaderStyle={headerStyle}
                    columnHeaders={columnHeaders}
                    sheetStyle={{
                        freezeColumns: 0,
                        freezeRows: 1,
                    }}
                    cacheLayout
                />
            </div>
        </>
    );
}

const customInputOptions = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
const customInputOptions2 = ['Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'];
const customInputData = [
    customInputOptions,
    customInputOptions2,
    customInputOptions,
    customInputOptions2,
    customInputOptions,
    customInputOptions2,
    customInputOptions,
];

export function SheetBoxCustomInput() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(customInputData)));
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl();

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = ['A', 'B', 'C'];
    const cellStyle = (x, y) => {
        return {};
    };
    const editData = (x, y) => {
        return data?.[y]?.[x];
    };
    const displayData = (x, y) => {
        return data?.[y]?.[x];
    };
    const sourceData = (x, y) => {
        return data?.[y]?.[x];
    };

    const onChange = (changes) => {
        const newData = [...data];
        for (const change of changes) {
            if (!newData[change.y]) {
                newData[change.y] = [];
            }
            newData[change.y][change.x] = change.value;
        }
        setData(newData);
    };

    const isReadOnly = (x, y) => {
        return false;
    };

    return (
        <div className="sheet-box">
            <Sheet
                onSelectionChanged={onSelectionChanged}
                onRightClick={onRightClick}
                columnHeaders={columnHeaders}
                cellStyle={cellStyle}
                editData={editData}
                displayData={displayData}
                sourceData={sourceData}
                cellWidth={cellWidth}
                cellHeight={cellHeight}
                onChange={onChange}
                readOnly={isReadOnly}
                onCellWidthChange={onCellWidthChange}
                onCellHeightChange={onCellHeightChange}
                inputComponent={CustomInput}
                cacheLayout
            />
        </div>
    );
}

function CustomInput(x, y, inputProps, commitEditingCell) {
    const clickHandler = (value) => {
        commitEditingCell(value);
    };

    return (
        <div style={{ ...inputProps.style, backgroundColor: '#fff' }}>
            <div style={{ border: '1px solid #ddd', boxShadow: '3px 5px 5px #ddd' }}>
                {(y % 2 ? customInputOptions2 : customInputOptions).map((opt) => {
                    return (
                        <CustomOption
                            key={opt}
                            opt={opt}
                            value={inputProps.value}
                            clickHandler={() => clickHandler(opt)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function CustomOption({ opt, value, clickHandler }) {
    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => {
                setHover(true);
            }}
            onMouseLeave={() => {
                setHover(false);
            }}
            style={{
                backgroundColor: value === opt || hover ? '#f6f6f6' : '#fff',
                padding: '5px 10px',
                cursor: 'pointer',
            }}
            value={opt}
            onClick={() => clickHandler(opt)}
        >
            {opt}
        </div>
    );
}

export function SheetBoxSourceDisplayData() {
    const [data] = useState([
        [1, 2, 3],
        [10, 20, 30],
    ]);

    const displayData = (x, y) => {
        return data?.[y]?.[x]?.toFixed?.(2);
    };

    return (
        <div className="sheet-box">
            <Sheet
                sourceData={data} // array of arrays of data
                displayData={displayData}
            />
        </div>
    );
}
