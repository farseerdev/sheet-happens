import React from 'react';

function Code() {
    return (
        <div className="code-box">
            <div className="code-line">
                <span className="red padd-10">{`import`}</span>
                <span className="orange ">{`React`}</span>
                <span className="padd-10">{`,`}</span>
                <span className="padd-10">{`{`}</span>
                <span className="orange padd-10">{`Component`}</span>
                <span className="padd-10">{` } `}</span>
                <span className="red padd-10">{`from `}</span>
                <span>{`'react';`}</span>
            </div>
            <div className="code-space"></div>
            <div className="code-line">
                <span className="red padd-10">{`import`}</span>
                <span className="orange padd-10">{`Sheet`}</span>
                <span className="red padd-10">{` from `}</span>
                <span>{`'sheet-happens';`}</span>
            </div>
            <div className="code-line">
                <span className="red padd-10">{`import `}</span>
                <span>{`'sheet-happens/dist/index.css';`}</span>
            </div>
            <div className="code-space"></div>
            <div className="code-line">
                <span className="red padd-10">{`class `}</span>
                <span className="orange padd-10">{`Example`}</span>
                <span className="red padd-10">{` extends `}</span>
                <span className="orange padd-10">{`Component`}</span>
                <span>{`{`}</span>
            </div>
            <div className="code-line padd-20">
                <span className="violet">{`  render `}</span>
                <span className="padd-10">{`()`}</span>
                <span>{`{`}</span>
            </div>
            <div className="code-line padd-40">
                <span className="red padd-10">{`return `}</span>
                <span className="blue">{`<`}</span>
                <span className="green padd-10">{`Sheet`}</span>
                <span className="blue">{`/>`}</span>
                <span>{`;`}</span>
            </div>
            <div className="code-line padd-20">
                <span>{`  }`}</span>
            </div>
            <div className="code-line">
                <span>{`}`}</span>
            </div>
        </div>
    );
}

export default Code;
