import React from 'react';
import Logo from '../assets/logo.svg';

function Menu() {
    const scrollTo = (elId) => {
        var element = document.getElementById(elId);
        var headerOffset = elId === 'home' ? 0 : 86;
        var elementPosition = window.pageYOffset + element.getBoundingClientRect().top;
        var offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
             top: offsetPosition,
             behavior: "smooth"
        });
    }

    return (
        <div className="container blue-bg menu">
            <div className="content flex-row">
                <div className="logo-box">
                    <img src={Logo} alt="Logo" />
                    <h2 className="page-title">sheet - happens</h2>
                </div>
                <div className="nav">
                    <div className="nav-item" onClick={() => scrollTo('home')} >home</div>
                    <div className="nav-item" onClick={() => scrollTo('usage')} >usage</div>
                    <div className="nav-item" onClick={() => scrollTo('features')} >features</div>
                    <div className="nav-item" onClick={() => scrollTo('documentation')} >documentation</div>
                </div>
            </div>
        </div>
    );
}

export default Menu;
