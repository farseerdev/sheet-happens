import React from 'react';
import Logo from '../assets/logo.svg';

function Menu() {
    return (
        <div className="container blue-bg">
            <div className="content flex-row menu">
                <div className="logo-box">
                    <img src={Logo} alt="Logo" />
                    <h2 className="page-title">sheet - happens</h2>
                </div>
                <div className="nav">
                    <a href="">home</a>
                    <a href="">usage</a>
                    <a href="">features</a>
                    <a href="">documentation</a>
                </div>
            </div>
        </div>
    )
}

export default Menu;