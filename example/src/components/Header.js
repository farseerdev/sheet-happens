import React from 'react';
import SheetBox from './SheetBox';
import GitIcon from '../assets/git.svg';

function Header() {
    return (
        <div className="container blue-bg">
            <div className="content flex-row header">
                <div className="box text-box">
                    <div>
                        <h1>Beautiful and fast spreadsheet component for React</h1>
                        <p className="lightblue-p">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                        Nunc sit amet fringilla nisl. In nec tortor tellus.</p>
                    </div>
                    <div className="lib-box">
                        <div className="install-box">npm install --save sheet-happens</div>
                        <div className="git-box"><img src={GitIcon} alt="Git" />view on github</div>
                    </div>
                </div>
                <div className="box">
                    <SheetBox />
                </div>
            </div>
        </div>
    )
}

export default Header;