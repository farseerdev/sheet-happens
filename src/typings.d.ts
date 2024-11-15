/**
 * Default CSS definition for typescript,
 * will be overridden with file-specific definitions by rollup
 */
declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

interface SvgrComponent extends React.StatelessComponent<React.SVGAttributes<SVGElement>> {}

declare module '*.svg' {
    const svgUrl: string;
    const svgComponent: SvgrComponent;
    export default svgUrl;
    export { svgComponent as ReactComponent };
}

declare module 'linebreak' {
    export class Break {
        constructor(position: number, required?: boolean | undefined);
        string: string | undefined;
        props: Record<string, any> | undefined;
        position: number;
        required: boolean;
    }

    export class LineBreak {
        constructor(s: string);
        nextBreak(): Break | null;
    }

    export default LineBreak;
}
