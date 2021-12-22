import React from 'react';
import './index.css';

import Menu from './components/Menu';
import Header from './components/Header';
import TitleSeparator from './components/TitleSeparator';
import Wrap from './components/Wrap';
import Code from './components/Code';
import {
    SheetBoxStyle,
    SheetBoxBasic,
    SheetBoxFormatting,
    SheetBoxVeryBigData,
    SheetBoxCustomInput,
} from './components/SheetBox';
import Footer from './components/Footer';

const App = () => {
    return (
        <>
            <Menu />
            <Header />

            <TitleSeparator title="usage" id="usage" />
            <Wrap>
                <div className="box full-width" style={{ overflowX: 'auto' }}>
                    <Code />
                </div>
            </Wrap>

            <TitleSeparator title="Let me show you its features" id="features" />
            <Wrap>
                <div className="box">
                    <SheetBoxBasic />
                </div>
                <div className="box">
                    <h3>Basic spreadsheet</h3>
                    <p>
                        It has all the features you'd expect from the spreadsheet: keyboard navigation, copy cells by
                        dragging the small square, copy/paste from and to Excel and Google Sheets, resize columns and
                        rows.
                    </p>
                </div>
            </Wrap>
            <Wrap>
                <div className="box">
                    <SheetBoxStyle />
                </div>
                <div className="box">
                    <h3>Styling</h3>
                    <p>
                        You can change the cell color, alignment, font weight, margins and more. It's also possible to
                        freeze first rows or columns, and add clickable images.
                    </p>
                </div>
            </Wrap>
            <Wrap>
                <div className="box">
                    <SheetBoxFormatting />
                </div>
                <div className="box">
                    <h3>Formatting</h3>
                    <p>
                        Sheet Happens uses different datasets for display and edit so you can apply different formatting
                        when displaying the cell and editing the cell.
                    </p>
                </div>
            </Wrap>

            <TitleSeparator title="big dataset example" id="big dataset example" />
            <Wrap>
                <div className="box full-width">
                    <SheetBoxVeryBigData />
                </div>
            </Wrap>

            <TitleSeparator title="custom input fields" id="custom input example" />
            <Wrap>
                <div className="box">
                    <SheetBoxCustomInput />
                </div>
                <div className="box">
                    <h3>Custom input component</h3>
                    <p>
                        If basic text input isn't enough, you can send your own React component to be displayed instead.
                    </p>
                </div>
            </Wrap>

            <TitleSeparator title="documentation" id="documentation" />
            <Wrap>
                <div className="box full-width">
                    <p>Comming soon</p>
                </div>
            </Wrap>

            <Footer />
        </>
    );
};

export default App;
