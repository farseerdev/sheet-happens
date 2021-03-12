import React from 'react';

function TitleSeparator({title}) {
    return (
        <div className="title-separator">
            <p>{title ? title : 'No title'}</p>
            <div className="separator"></div>
        </div>
    )
}

export default TitleSeparator;