import { ReactElement, useCallback, useMemo, useState } from 'react';
import { renderToString } from 'react-dom/server';
import toRGBA from 'color-rgba';
import { CellContentItem, Rectangle, Style } from './types';

const DEFAULT_ICON_SIZE = 32;

export const svgToImage = (icon: ReactElement | string): HTMLImageElement => {
    const image = new Image();
    try {
        const iconAsString = typeof icon === 'string' ? icon : renderToString(icon);
        const base64String = window.btoa(iconAsString);
        image.src = `data:image/svg+xml;base64,${base64String}`;
    } catch (err) {
        console.log(err);
    }
    return image;
};

export const useImageRenderer = () => {
    const [, setVersion] = useState(0);

    const [canvasWidth, setCanvasWidth] = useState(DEFAULT_ICON_SIZE);
    const [canvasHeight, setCanvasHeight] = useState(DEFAULT_ICON_SIZE);

    const imageMap = useMemo(() => new Map<string, HTMLImageElement>(), []);
    const loadImage = useCallback(
        (src: string): HTMLImageElement => {
            let image = imageMap.get(src);
            if (image) return image;

            image = new Image();
            image.src = src;
            imageMap.set(src, image!);
            return image!;
        },
        [imageMap],
    );

    const dpi = window.devicePixelRatio;
    const iconContext = useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth * dpi;
        canvas.height = canvasHeight * dpi;

        const context = canvas.getContext('2d', { willReadFrequently: true }) as any as CanvasRenderingContext2D;
        return context;
    }, [canvasWidth, canvasHeight, dpi]);

    return (
        renderContext: CanvasRenderingContext2D,
        item: CellContentItem & { display: 'image' | 'icon' },
        style: Required<Style>,
        box: Rectangle,
    ) => {
        if (!iconContext) return;

        const { display } = item;

        const image = 'image' in item ? item.image : 'src' in item ? loadImage(item.src) : null;
        if (!image) return;

        if (!image.complete) {
            if (!image.onload) {
                image.onload = () => {
                    setVersion((v) => v + 1);
                    setCanvasWidth((w) => Math.max(w, image.width));
                    setCanvasHeight((h) => Math.max(h, image.height));
                };
            }
            return;
        } else {
            if (canvasWidth < image.width) setCanvasWidth((w) => Math.max(w, image.width));
            if (canvasHeight < image.height) setCanvasHeight((h) => Math.max(h, image.height));
        }

        const [[left, top], [right, bottom]] = box;
        const width = right - left;
        const height = bottom - top;

        if (display === 'image') {
            // Draw image directly
            renderContext.drawImage(image, 0, 0, image.width, image.height, left, top, width, height);
        } else if (display === 'icon') {
            // Recolor icon according to text color style
            const color = item.color ?? style.color;
            const rgba = toRGBA(color);
            const [r = 0, g = 0, b = 0, a = 1] = rgba;

            try {
                const wDpi = width * dpi;
                const hDpi = height * dpi;

                iconContext.clearRect(0, 0, wDpi, hDpi);
                iconContext.drawImage(image, 0, 0, image.width, image.height, 0, 0, wDpi, hDpi);

                const imageData = iconContext.getImageData(0, 0, wDpi, hDpi);
                const { data } = imageData;
                const n = data.length;

                for (let i = 0; i < n; i += 4) {
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = data[i + 3] * a;
                }

                iconContext.putImageData(imageData, 0, 0, 0, 0, wDpi, hDpi);
                renderContext.drawImage(iconContext.canvas, 0, 0, wDpi, hDpi, left, top, width, height);
            } catch (e) {
                console.error(e);
            }
        }
    };
};
