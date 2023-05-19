import React, { useState } from 'react';
import Sheet from 'sheet-happens';
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
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
    [1, 2, 3, 4, 5, 6],
];

const initialDataFormatting = [];
for (let row = 0; row < 1000; row++) {
    const r = [];
    for (let col = 0; col < 100; col++) {
        r.push(Math.random() * 1000000);
    }
    initialDataFormatting.push(r);
}

const triangleDown = new Image();
triangleDown.src =
    'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiDQoJIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBvdmVyZmxvdz0idmlzaWJsZSIgPg0KPHBvbHlnb24gcG9pbnRzPSIwLDAgMTAwLDAgNTAsMTAwIiBzdHlsZT0iZmlsbDojOTk5OTk5OyIvPg0KPC9zdmc+DQo=';
triangleDown.width = 10;
triangleDown.height = 10;

export const DEFAULT_CELL_WIDTH = 100;
export const DEFAULT_CELL_HEIGHT = 22;

export function useWidthHeightControl(
    initialWidths = [],
    initialHeights = [],
    getColumnOrder = (i: number) => i,
    getRowOrder = (i: number) => i,
) {
    const [cellWidth, setCellWidth] = useState(initialWidths);
    const [cellHeight, setCellHeight] = useState(initialHeights);

    const onCellWidthChange = (indices, newWidth) => {
        const cw = [...cellWidth];
        for (const order of indices) {
            const idx = getColumnOrder(order);
            if (idx > cw.length) {
                for (let i = cw.length; i <= idx; i++) {
                    cw.push(DEFAULT_CELL_WIDTH);
                }
            }
            cw[idx] = newWidth;
        }
        setCellWidth(cw);
    };

    const onCellHeightChange = (indices, newHeight) => {
        const ch = [...cellHeight];
        for (const order of indices) {
            const idx = getRowOrder(order);
            if (idx > ch.length) {
                for (let i = ch.length; i <= idx; i++) {
                    ch.push(DEFAULT_CELL_HEIGHT);
                }
            }
            ch[idx] = newHeight;
        }
        setCellHeight(ch);
    };

    const cw = (x: number) => cellWidth[getColumnOrder(x)] ?? DEFAULT_CELL_WIDTH;
    const ch = (y: number) => cellHeight[getRowOrder(y)] ?? DEFAULT_CELL_HEIGHT;

    return { onCellWidthChange, onCellHeightChange, cellWidth: cw, cellHeight: ch };
}

export function useOrderControl(initialColumns = [], initialRows = []) {
    const [columnOrder, setColumnOrder] = useState(initialColumns);
    const [rowOrder, setRowOrder] = useState(initialRows);

    const getColumnOrder = (x: number) => columnOrder[x] ?? x;
    const getRowOrder = (y: number) => rowOrder[y] ?? y;

    const onColumnOrderChange = (indices: number[], order: number) => {
        const co = [...columnOrder];

        const min = indices[0];
        const n = Math.max(order + indices.length, indices.reduce((a, b) => Math.max(a, b)));
        while (co.length < n) co.push(co.length);

        co.splice(min, indices.length);
        co.splice(order, 0, ...indices.map(i => getColumnOrder(i)));
        setColumnOrder(co);
    };

    const onRowOrderChange = (indices: number[], order: number) => {
        const ro = [...rowOrder];

        const min = indices[0];
        const n = Math.max(order + indices.length, indices.reduce((a, b) => Math.max(a, b)));
        while (ro.length < n) ro.push(ro.length);

        ro.splice(min, indices.length);
        ro.splice(order, 0, ...indices.map(i => getRowOrder(i)));
        setRowOrder(ro);
    };

    return { getColumnOrder, getRowOrder, onColumnOrderChange, onRowOrderChange };
}

export function SheetBoxHeader() {
    const [data, setData] = useState(initialDataBig);

    const { onColumnOrderChange, onRowOrderChange, getColumnOrder, getRowOrder } = useOrderControl();
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl([], [], getColumnOrder, getRowOrder);

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
                cacheLayout
            />
        </div>
    );
}

export function SheetBoxBasic() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(initialDataBasic)));
    const { onColumnOrderChange, onRowOrderChange, getColumnOrder, getRowOrder } = useOrderControl();
    const { onCellWidthChange, onCellHeightChange, cellWidth, cellHeight } = useWidthHeightControl([], [], getColumnOrder, getRowOrder);

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

const faCheck = new Image();
faCheck.src =
    'data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJjaGVjay1jaXJjbGUiIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1jaGVjay1jaXJjbGUgZmEtdy0xNiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjMGFkNjZiIiBkPSJNNTA0IDI1NmMwIDEzNi45NjctMTExLjAzMyAyNDgtMjQ4IDI0OFM4IDM5Mi45NjcgOCAyNTYgMTE5LjAzMyA4IDI1NiA4czI0OCAxMTEuMDMzIDI0OCAyNDh6TTIyNy4zMTQgMzg3LjMxNGwxODQtMTg0YzYuMjQ4LTYuMjQ4IDYuMjQ4LTE2LjM3OSAwLTIyLjYyN2wtMjIuNjI3LTIyLjYyN2MtNi4yNDgtNi4yNDktMTYuMzc5LTYuMjQ5LTIyLjYyOCAwTDIxNiAzMDguMTE4bC03MC4wNTktNzAuMDU5Yy02LjI0OC02LjI0OC0xNi4zNzktNi4yNDgtMjIuNjI4IDBsLTIyLjYyNyAyMi42MjdjLTYuMjQ4IDYuMjQ4LTYuMjQ4IDE2LjM3OSAwIDIyLjYyN2wxMDQgMTA0YzYuMjQ5IDYuMjQ5IDE2LjM3OSA2LjI0OSAyMi42MjguMDAxeiI+PC9wYXRoPjwvc3ZnPg==';
faCheck.width = 16;
faCheck.height = 16;

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
                        content: 'A',
                        x: 0,
                        y: 0,
                        horizontalAlign: 'center',
                    },
                    {
                        content: triangleDown,
                        x: 0,
                        y: -6,
                        width: 12,
                        height: 12,
                        horizontalAlign: 'right',
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
    const colors = ['#f00', '#0f0', '#00f', '#000'];
    const alignment = ['left', 'right', 'center'];
    const weight = ['normal', 'bold', 'lighter'];
    const marginRight = [0, 0, 0, 0, 20];
    const cellStyle = (x, y) => {
        if (x === 0 || y === 0) {
            return {
                fillColor: '#6DA2FB22',
                marginRight: 10,
            };
        }
        return {
            color: colors[y % 4],
            textAlign: alignment[x % 3],
            marginRight: marginRight[x % 5],
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
                        content: faCheck,
                        x: 0,
                        y: -8,
                        width: 16,
                        height: 16,
                        horizontalAlign: 'right',
                        onClick: () => {
                            incrementCell(x, y);
                        },
                    },
                    {
                        content: data?.[y]?.[x],
                        x: 0,
                        y: 0,
                        horizontalAlign: 'left',
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
        for (const {x, y, value} of changes) {
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

    const render = ({
        visibleCells,
        cellLayout,
        selection,
        editMode,
    }) => {
        if (editMode) return;
        
        const cell = [1, 2];
        const [anchor] = selection;
        const noteOpen = (anchor[0] === cell[0] && anchor[1] === cell[1]);

        const isCellVisible = (
            visibleCells.columns.includes(cell[0]) &&
            visibleCells.rows.includes(cell[1])
        );
        if (!isCellVisible) return null;

        const [, top] = cellLayout.cellToPixel(cell, [0, 0]);
        const [right, ] = cellLayout.cellToPixel(cell, [1, 1]);

        const marker = <div
            style={{
                position: 'absolute',
                left: right,
                top: top,
                marginLeft: '-12px',
                borderTop: '12px solid blue',
                borderLeft: '12px solid transparent',
                pointerEvents: 'none',
            }} />

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
            <div onPointerDown={(e: any) => e.stopPropagation()}>
                {note}
                {marker}
            </div>
        );
    };

    return (
        <div className="sheet-box">
            <Sheet
                selection={[[1, 2], [1, 2]]}
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
        return '' + index;
    };

    return (
        <>
            {loadingStatus === 'initial' ?
                (
                    // eslint-disable-next-line jsx-a11y/anchor-is-valid
                    <a href="#" onClick={loadClick}>
                        Load global database of power plants
                    </a>
                ) : loadingStatus === 'loading' ? (
                    'Loading...'
                ) : null
            }
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
