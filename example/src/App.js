import React from 'react';

//import Sheet from 'sheet-happens'
//import 'sheet-happens/dist/index.css'
import './index.css';
import Menu from './components/Menu';
import Header from './components/Header';
import TitleSeparator from './components/TitleSeparator';
import Wrap from './components/Wrap';
import SheetBox from './components/SheetBox';
import Footer from './components/Footer';

const App = () => {
    //return <Sheet />
    return (
        <>
            <Menu />
            <Header />

            <TitleSeparator title="usage"/>
            <Wrap>
                <div className="box">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                    In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                    Nunc sit amet fringilla nisl. In nec tortor tellus.</p>

                    <p className="spacer-30">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                    In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                    Proin efficitur sodales convallis.</p>
                </div>
                <div className="box">
                    <SheetBox />
                </div>
            </Wrap>

            <TitleSeparator title="features"/>
            <Wrap>
                <div className="box">
                    <SheetBox />
                </div>
                <div className="box">
                    <h3>Feature naslov</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                    In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                    Nunc sit amet fringilla nisl. In nec tortor tellus.</p>
                </div>
            </Wrap>
            <Wrap>
                <div className="box">
                    <SheetBox />
                </div>
                <div className="box">
                    <h3>Feature naslov</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                    In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                    Nunc sit amet fringilla nisl. In nec tortor tellus.</p>
                </div>
            </Wrap>
            <Wrap>
                <div className="box">
                    <SheetBox />
                </div>
                <div className="box">
                    <h3>Feature naslov</h3>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                    In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                    Nunc sit amet fringilla nisl. In nec tortor tellus.</p>
                </div>
            </Wrap>

            <TitleSeparator title="documentation"/>
            <Wrap>
                <div className="box full-width">
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. Nunc sit amet fringilla nisl. 
                      In nec tortor tellus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin efficitur sodales convallis. 
                      Nunc sit amet fringilla nisl. In nec tortor tellus.</p>
                </div>
            </Wrap>
            <Footer />
        </>
    );
};

export default App;
