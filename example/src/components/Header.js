import React from 'react';
import { useRef, useState } from 'react';
import { SheetBoxHeader } from './SheetBox';
import GitIcon from '../assets/git.svg';

function Header() {
    const textAreaRef = useRef(null);
    const [copySuccess, setCopySuccess] = useState('');

    const copyToClipboard = (e) => {
        textAreaRef.current.select();
        document.execCommand('copy');
        e.target.focus();
        setCopySuccess('Copied!');
        setTimeout(() => {
            setCopySuccess('');
        }, 1000);
    };

    return (
        <div className="container blue-bg" id="home">
            <div className="content flex-row header">
                <div className="box text-box">
                    <div>
                        <h1>Beautiful and fast spreadsheet component for React</h1>
                        <p className="lightblue-p">
                            Sheet Happens is easy to implement and extend. 
                            <br></br>
                            And it's super fast.
                        </p>
                    </div>
                    <div className="lib-box">
                        <div className="install-box" onClick={copyToClipboard}>
                            <input readOnly ref={textAreaRef} value="npm install --save sheet-happens" />
                            {copySuccess !== '' && <div className="copy-success">{copySuccess}</div>}
                        </div>
                        <a href="https://github.com/farseerdev/sheet-happens" className="git-box" target="_blank">
                            <img src={GitIcon} alt="Git" />
                            view on github
                        </a>
                    </div>
                </div>
                <div className="box">
                    <SheetBoxHeader />
                </div>
            </div>
        </div>
    );
}

export default Header;
