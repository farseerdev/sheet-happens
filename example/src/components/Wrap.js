import React from 'react';

function Wrap({ children }) {
    return (
        <div className="container">
            <div className="content flex-row">{children}</div>
        </div>
    );
}

export default Wrap;
