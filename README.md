# sheet-happens

> React Spreadsheet

[![NPM](https://img.shields.io/npm/v/sheet-happens.svg)](https://www.npmjs.com/package/sheet-happens) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

![Sheeeeeit](https://media.giphy.com/media/in6mnJNYjGKpq/source.gif)

## About
Canvas-based spreadsheet component for React. <br />
Super fast and responsive regardless of the dataset size because it draws only the data user currently sees.

![sheet-happens](https://raw.githubusercontent.com/farseerdev/sheet-happens/main/example/src/assets/sheethappensimg.png)

## Install

```bash
npm install --save sheet-happens
```

## Usage
To use our Sheet in your project, just import the component and its style and render it:

```jsx
import React, { Component } from 'react'

import Sheet from 'sheet-happens'
import 'sheet-happens/dist/index.css'

class Example extends Component {
  render() {
    return <Sheet />
  }
}
```

Of course, you can also display some data in it:
```jsx
const [data, setData] = useState([[1,2,3], [10,20,30]]);
    
const displayData = (x, y) => {
    return data?.[y]?.[x]?.toFixed?.(2);
};

return (
    <div className="sheet-box">
        <Sheet
            sourceData={data}
            displayData={displayData}
        />
    </div>
);
```

Go to our [example page](https://farseerdev.github.io/sheet-happens/) to learn more about [features](https://farseerdev.github.io/sheet-happens#features) it has and checkout [documentation](https://farseerdev.github.io/sheet-happens#documentation) for detailed list of props you can send to this component. <br />

Along with descriptions, page also contains multiple Sheet components you can use to try out is it a good match for your needs. Edit some values, paste some data, drag columns and rows for resize, and so on.


## License

MIT © [Luka-M](https://github.com/Luka-M)
