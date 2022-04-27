import React from 'react';
import './index.css';

import Menu from './components/Menu';
import Header from './components/Header';
import TitleSeparator from './components/TitleSeparator';
import Wrap from './components/Wrap';
import Code, {
    InitSheetCode,
    InitSheetWithDataCode,
    SourceDisplayDataCode,
    EditDataCode,
    CellStyleSizeCode,
} from './components/Code';
import {
    SheetBoxStyle,
    SheetBoxBasic,
    SheetBoxFormatting,
    SheetBoxVeryBigData,
    SheetBoxCustomInput,
    SheetBoxSourceDisplayData,
} from './components/SheetBox';
import Footer from './components/Footer';

const App = () => {
    return (
        <>
            <Menu />
            <Header />

            <TitleSeparator title="Get started" id="usage" />
            <Wrap>
                <div className="box full-width colored-pre" style={{ overflowX: 'auto' }}>
                    <p>Import the component and its style, and render it</p>
                    <InitSheetCode />

                    <div className="spacer" />

                    <p>Display some data</p>
                    <InitSheetWithDataCode />
                </div>
            </Wrap>

            <TitleSeparator title="Learn more about features" id="features" />
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

            <div className="spacer" />

            <TitleSeparator title="Big dataset example" id="big dataset example" />
            <Wrap>
                <div className="box full-width">
                    <p>
                        Our Sheet is designed and built with big datasets in mind. No matter the size of your data, it
                        will be handled blazingly fast and super responsive because component is canvas-based and it
                        draws only the small chunk of data user sees at the moment.
                    </p>
                    <br />
                    <SheetBoxVeryBigData />
                </div>
            </Wrap>

            <div className="spacer" />

            <TitleSeparator title="Custom input fields" id="custom input example" />
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

            <div className="spacer" />

            <TitleSeparator title="Documentation" id="documentation" />
            <Wrap>
                <div className="box full-width">
                    {/* sourceData displayData */}
                    <h3>Displaying data</h3>
                    <p>
                        If you have some data you want to display, you send it via <Emphased text="sourceData" /> and{' '}
                        <Emphased text="displayData" /> props.
                    </p>
                    <p>
                        The first one receives unformatted data which is used for data manipulation, and the second one
                        formatted which is used for displaying in cells.
                    </p>
                    <br />
                    <p>
                        Each of this can be either array of arrays of values (where each array is representing data for
                        one row) or function (which returns value based on x and y coordinates that are sent as
                        arguments to your function).
                    </p>
                </div>
            </Wrap>

            <Wrap>
                <div className="box colored-pre unmargin-pre" style={{ maxWidth: '100%', overflow: 'auto' }}>
                    <SourceDisplayDataCode />
                </div>
                <div className="box">
                    <SheetBoxSourceDisplayData />
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box">
                    {/*editData onChange readOnly */}
                    <h3>Editing data</h3>
                    <p>
                        Same as the previous two, prop <Emphased text="editData" /> can recieve either array of arrays
                        of values or function for data which will be displayed in edit mode. Edit mode is activated by
                        double click on the cell.
                    </p>
                    <br />
                    <p>
                        Once edit is done, function sent in <Emphased text="onChange" /> prop will be called with array
                        of changes as an argument. Each element of this array has value, x and y coordinates. Use this
                        information to change values in your data array.
                    </p>
                    <br />
                    <p>
                        Sheet also accepts <Emphased text="readOnly" /> prop which you can use if some cells should not
                        be editable. Same as the most of sheet's props, you can send function, array of arrays, or a
                        single value which then is applied to the whole table.
                    </p>
                </div>

                <div className="box unmargin-pre">
                    <EditDataCode />
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box full-width">
                    {/* columnHeaders */}
                    <h3>Column headers</h3>
                    <p>
                        By default, sheet has excel-like headers (A, B, C, ...) but you can send yours via{' '}
                        <Emphased text="columnHeaders" /> prop as an array or function.
                    </p>
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box">
                    {/* cellStyle cellWidth cellHeight onCellWidthChange onCellHeightChange */}
                    <h3>Cell style and width/height</h3>
                    <p>
                        Use prop <Emphased text="cellStyle" /> and <Emphased text="columnHeaderStyle" /> for customizing
                        cells visually.
                    </p>
                    <br />
                    <p>
                        You can also use <Emphased text="cellWidth" /> and <Emphased text="cellHeight" /> props to
                        customize cell size. If you send single value {`cellWidth={200}`}, it will be applayed to all
                        cells. If you send array of values {`cellWidth={[200, 80, 80]}`}, they will be applied in
                        respect to the index number.
                    </p>
                    <br />
                    <p>
                        There are also <Emphased text="onCellWidthChange" /> and <Emphased text="onCellHeightChange" />{' '}
                        props for functions which are called when user drags cell for resize. You can use these for
                        updating your cellWidth/cellHeight arrays.
                    </p>
                </div>
                <div className="box unmargin-pre">
                    <CellStyleSizeCode />
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box full-width">
                    {/* onSelectionChanged */}
                    <h3>Selection</h3>
                    <p>
                        You can send function to <Emphased text="onSelectionChanged" /> prop. It will be called on
                        selection change with x1, y1, x2 and y2 arguments.
                    </p>
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box full-width">
                    {/* onRightClick */}
                    <h3>Right click handler</h3>
                    <p>
                        If you send a function to <Emphased text="onRightClick" /> prop, it will be called on right
                        click with whole mouse event (extended with cellX and cellY values) as an argument.
                    </p>
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box full-width">
                    {/* freezeColumns freezeRows */}
                    <h3>Sticky columns/rows</h3>
                    <p>
                        Send a number to <Emphased text="freezeColumns" /> and/or <Emphased text="freezeRows" /> to make
                        first n of columns/rows sticky.
                    </p>
                </div>
            </Wrap>

            <div className="spacer" />

            <Wrap>
                <div className="box full-width">
                    {/* inputComponent */}
                    <h3>Custom input</h3>
                    <p>
                        By default edit mode turns cell into text edit component. But you can send your custom input
                        component via <Emphased text="inputComponent" /> props. It will be called with{' '}
                        <Emphased text="x" />, <Emphased text="y" />, <Emphased text="inputProps" /> and{' '}
                        <Emphased text="commitEditingCell" /> arguments.
                    </p>
                </div>
            </Wrap>

            <div className="spacer" />

            <Footer />
        </>
    );
};

function Emphased({ text }) {
    return <span className="emphased">{text}</span>;
}

export default App;
