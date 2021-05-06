import React, { useState, useEffect } from 'react';
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

export function SheetBoxHeader() {
    const [data, setData] = useState(initialDataBig);
    const [cellWidth, setCellWidth] = useState(Array(100).fill(150));
    const [cellHeight, setCellHeight] = useState([]);

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

    const onCellWidthChange = (columnIdx, newWidth) => {
        const cw = [...cellWidth];
        if (columnIdx > cw.length) {
            for (let i = cw.length; i <= columnIdx; i++) {
                cw.push(150);
            }
        }
        cw[columnIdx] = newWidth;
        setCellWidth(cw);
    };
    const onCellHeightChange = (rowIdx, newHeight) => {
        const ch = [...cellHeight];
        if (rowIdx > ch.length) {
            for (let i = ch.length; i <= rowIdx; i++) {
                ch.push(22);
            }
        }
        ch[rowIdx] = newHeight;
        setCellHeight(ch);
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
                freezeColumns={0}
                freezeRows={0}
            />
        </div>
    );
}

export function SheetBoxBasic() {
    const [data, setData] = useState(JSON.parse(JSON.stringify(initialDataBasic)));
    const [cellWidth, setCellWidth] = useState([]);
    const [cellHeight, setCellHeight] = useState([]);

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

    const onCellWidthChange = (columnIdx, newWidth) => {
        const cw = [...cellWidth];
        if (columnIdx > cw.length) {
            for (let i = cw.length; i <= columnIdx; i++) {
                cw.push(100);
            }
        }
        cw[columnIdx] = newWidth;
        setCellWidth(cw);
    };
    const onCellHeightChange = (rowIdx, newHeight) => {
        const ch = [...cellHeight];
        if (rowIdx > ch.length) {
            for (let i = ch.length; i <= rowIdx; i++) {
                ch.push(22);
            }
        }
        ch[rowIdx] = newHeight;
        setCellHeight(ch);
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
                freezeColumns={0}
                freezeRows={0}
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
    const [cellWidth, setCellWidth] = useState([]);
    const [cellHeight, setCellHeight] = useState([]);

    const onSelectionChanged = (x1, y1, x2, y2) => {};
    const onRightClick = () => {};
    const columnHeaders = [];
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
                        horiozntalAlign: 'right',
                        onClick: () => {
                            incrementCell(x, y);
                        },
                    },
                    {
                        content: data?.[y]?.[x],
                        x: 0,
                        y: 0,
                        horiozntalAlign: 'left',
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

    const onCellWidthChange = (columnIdx, newWidth) => {
        const cw = [...cellWidth];
        if (columnIdx > cw.length) {
            for (let i = cw.length; i <= columnIdx; i++) {
                cw.push(100);
            }
        }
        cw[columnIdx] = newWidth;
        setCellWidth(cw);
    };
    const onCellHeightChange = (rowIdx, newHeight) => {
        const ch = [...cellHeight];
        if (rowIdx > ch.length) {
            for (let i = ch.length; i <= rowIdx; i++) {
                ch.push(22);
            }
        }
        ch[rowIdx] = newHeight;
        setCellHeight(ch);
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
                freezeColumns={1}
                freezeRows={1}
            />
        </div>
    );
}

export function SheetBoxFormatting() {
    const [data, setData] = useState(initialDataFormatting);
    const [cellWidth, setCellWidth] = useState([]);
    const [cellHeight, setCellHeight] = useState([]);

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

    const onCellWidthChange = (columnIdx, newWidth) => {
        const cw = [...cellWidth];
        if (columnIdx > cw.length) {
            for (let i = cw.length; i <= columnIdx; i++) {
                cw.push(100);
            }
        }
        cw[columnIdx] = newWidth;
        setCellWidth(cw);
    };
    const onCellHeightChange = (rowIdx, newHeight) => {
        const ch = [...cellHeight];
        if (rowIdx > ch.length) {
            for (let i = ch.length; i <= rowIdx; i++) {
                ch.push(22);
            }
        }
        ch[rowIdx] = newHeight;
        setCellHeight(ch);
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
                freezeColumns={0}
                freezeRows={0}
            />
        </div>
    );
}

export function SheetBoxVeryBigData() {
    const [loadingStatus, setLoadingStatus] = useState('initial');
    const [data, setData] = useState([]);
    const [cellWidth, setCellWidth] = useState([]);
    const [cellHeight, setCellHeight] = useState([]);

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

    const onCellWidthChange = (columnIdx, newWidth) => {
        const cw = [...cellWidth];
        if (columnIdx > cw.length) {
            for (let i = cw.length; i <= columnIdx; i++) {
                cw.push(100);
            }
        }
        cw[columnIdx] = newWidth;
        setCellWidth(cw);
    };
    const onCellHeightChange = (rowIdx, newHeight) => {
        const ch = [...cellHeight];
        if (rowIdx > ch.length) {
            for (let i = ch.length; i <= rowIdx; i++) {
                ch.push(22);
            }
        }
        ch[rowIdx] = newHeight;
        setCellHeight(ch);
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
            {loadingStatus === 'initial' ? (
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
                    freezeColumns={0}
                    freezeRows={1}
                />
            </div>
        </>
    );
}
