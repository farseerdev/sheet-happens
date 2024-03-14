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

const onCellWidthChange = (indices, newWidths) => {
    setCellWidth((cellWidth) => {
        const cw = [...cellWidth];
        for (const [i, order] of indices.entries()) {
            const idx = getColumnOrder(order);
            if (idx > cw.length) {
                for (let i = cw.length; i <= idx; i++) {
                    cw.push(DEFAULT_CELL_WIDTH);
                }
            }
            cw[idx] = newWidths[i];
        }
        return cw;
    });
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
