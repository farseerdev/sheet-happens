import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { xcode } from 'react-syntax-highlighter/dist/esm/styles/hljs';

function Code() {
    return (
        <SyntaxHighlighter language="javascript" style={xcode}>
            {`function SheetBox() {
    const [data, setData] = useState(initialData);
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
}`}
        </SyntaxHighlighter>
    );
}

export default Code;
