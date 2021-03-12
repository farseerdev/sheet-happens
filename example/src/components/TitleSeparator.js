import React from 'react';

function TitleSeparator({ title, id }) {
    return (
        <div className="title-separator" id={id ? id : ''}>
            <p>{title ? title : 'No title'}</p>
            <div className="separator"></div>
        </div>
    );
}

export default TitleSeparator;
