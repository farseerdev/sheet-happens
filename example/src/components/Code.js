import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { xcode } from 'react-syntax-highlighter/dist/esm/styles/hljs';
xcode.hljs.padding = '10px 20px';
xcode.hljs.background = '#f8f9fa';
xcode.hljs.width = '100%';
xcode.hljs.maxWidth = '100%';
xcode.hljs.overflow = 'auto';
xcode.hljs.borderRadius = '3px';
xcode.hljs.fontSize = '14px';

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

export function SourceDisplayDataCode() {
    let xcode2 = { ...xcode };
    xcode2.hljs.height = '100%';
    return (
        <SyntaxHighlighter language="javascript" style={xcode2}>
            {`const [data, setData] = useState([[1,2,3], [10,20,30]]);
    
const displayData = (x, y) => {
    return data?.[y]?.[x]?.toFixed?.(2);
};

return (
    <div className="sheet-box">
        <Sheet
            sourceData={data} // array of arrays of data 
            displayData={displayData} // function example
        />
    </div>
);`}
        </SyntaxHighlighter>
    );
}

export function InitSheetCode() {
    return (
        <SyntaxHighlighter language="javascript" style={xcode}>
            {`import React, { Component } from 'react'
import Sheet from 'sheet-happens'
import 'sheet-happens/dist/index.css'

class Example extends Component {
  render() {
    return <Sheet />
  }
}`}
        </SyntaxHighlighter>
    );
}

export function InitSheetWithDataCode() {
    return (
        <SyntaxHighlighter language="javascript" style={xcode}>
            {`const [data, setData] = useState([[1,2,3], [10,20,30]]);
    
const displayData = (x, y) => {
    return data?.[y]?.[x]?.toFixed?.(2);
};

return (
    <div className="sheet-box">
        <Sheet
            sourceData={data}
            displayData={displayData}
        />
    </div>
);`}
        </SyntaxHighlighter>
    );
}

export function EditDataCode() {
    return (
        <SyntaxHighlighter language="javascript" style={xcode}>
            {`...

const editData = (x, y) => {
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
            ...
            sourceData={sourceData}
            onChange={onChange}
            readOnly={isReadOnly}
        />
    </div>
);`}
        </SyntaxHighlighter>
    );
}

export function CellStyleSizeCode() {
    return (
        <SyntaxHighlighter language="javascript" style={xcode}>
            {`...

const cellStyle = (x, y) => {
    return { textAlign: 'right' };
};

const [cellWidth, setCellWidth] = useState([]);

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

return (
    <div className="sheet-box">
        <Sheet
            ...
            cellStyle={cellStyle}
            cellWidth={cellWidth}
            onCellWidthChange={onCellWidthChange}
        />
    </div>
);`}
        </SyntaxHighlighter>
    );
}
