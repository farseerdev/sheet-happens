import { RefObject, KeyboardEvent, useLayoutEffect } from 'react';

import { ARROW_KEYS, MAX_SEARCHABLE_INDEX, ORIGIN, NEG_NEG } from './constants';

import { findInDisplayData } from './props';

import { CellContentType, CellPropertyFunction, CellPropertyStyledFunction, Change, Rectangle, XY } from './types';

import {
    normalizeSelection,
    isRowSelection,
    isColumnSelection,
    isEmptySelection,
    getDirectionStep,
    maxXY,
    addXY,
} from './coordinate';

export const useKeyboard = (
    arrowKeyCommitMode: boolean,
    overlayRef: RefObject<HTMLDivElement>,
    cellReadOnly: CellPropertyFunction<boolean | null>,
    displayData: CellPropertyStyledFunction<CellContentType>,
    editCell: XY,
    editMode: boolean,
    focused: boolean,
    rawSelection: Rectangle,
    selection: Rectangle,

    onEdit?: (cell: XY, arrowKeyCommitMode?: boolean) => void,
    onCommit?: () => void,
    onCancel?: () => void,
    onSelectionChange?: (selection: Rectangle, scrollTo?: boolean, toHead?: boolean) => void,
    onFocusChange?: (focus: boolean) => void,
    onClipboardCopy?: (cut: boolean) => void,
    onChange?: (changes: Change[]) => void,
) => {
    const onInputKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel?.();
            return;
        }

        const direction =
            e.key === 'Enter' ? 'down' : e.key === 'Tab' ? 'right' : arrowKeyCommitMode ? ARROW_KEYS[e.key] : null;

        if (direction) {
            e.preventDefault();
            const step = getDirectionStep(direction);
            const head = maxXY(addXY(editCell, step), ORIGIN);
            onCommit?.();
            onSelectionChange?.([head, head]);
        }
    };

    const onGridKeyDown = (e: KeyboardEvent) => {
        if (editMode && arrowKeyCommitMode && e.key in ARROW_KEYS) {
            onCommit?.();
            return;
        }

        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'v') {
            return;
        }

        // copy
        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'c') {
            onClipboardCopy?.(false);
            return;
        }
        // cut
        if ((e.metaKey || e.ctrlKey) && String.fromCharCode(e.which).toLowerCase() === 'x') {
            onClipboardCopy?.(true);
            return;
        }

        if (e.key === 'Backspace' || e.key === 'Delete') {
            let [[x1, y1], [x2, y2]] = normalizeSelection(selection);
            if (isRowSelection(selection)) {
                x1 = 0;
                x2 = MAX_SEARCHABLE_INDEX;
            }
            if (isColumnSelection(selection)) {
                y1 = 0;
                y2 = MAX_SEARCHABLE_INDEX;
            }

            const changes: Change[] = [];
            for (let y = y1; y <= y2; y++) {
                for (let x = x1; x <= x2; x++) {
                    if (!cellReadOnly(x, y)) {
                        changes.push({ x: x, y: y, value: null });
                    }
                }
            }

            onChange?.(changes);
            return;
        }

        // nothing selected
        if (isEmptySelection(selection)) {
            return;
        }

        if (
            (e.keyCode >= 48 && e.keyCode <= 57) ||
            (e.keyCode >= 96 && e.keyCode <= 105) ||
            (e.keyCode >= 65 && e.keyCode <= 90) ||
            e.key === 'Enter' ||
            e.key === '-' ||
            e.key === '.' ||
            e.key === ','
        ) {
            const [cell] = selection;
            const [cellX, cellY] = cell;
            if (cellReadOnly(cellX, cellY)) {
                return;
            }

            if (e.key === 'Enter') e.preventDefault();
            onEdit?.(cell, e.key !== 'Enter');
            return;
        }

        e.preventDefault();

        if (e.key in ARROW_KEYS) {
            let [anchor, head] = rawSelection;

            const direction = ARROW_KEYS[e.key];
            const step = getDirectionStep(direction);
            const shift = e.shiftKey;

            if (e.metaKey || e.ctrlKey) {
                head = findInDisplayData(displayData, head, direction);
            } else {
                // Allow stepping into row/column headers with shift
                const limit: XY = shift
                    ? isRowSelection(selection)
                        ? [-1, 0]
                        : isColumnSelection(selection)
                          ? [0, -1]
                          : NEG_NEG
                    : ORIGIN;
                head = maxXY(addXY(head, step), limit);
            }

            if (!shift) {
                anchor = head;
            }

            onSelectionChange?.([anchor, head], true, true);
            return;
        }
    };

    const onGridFocus = () => {
        onFocusChange?.(true);
    };

    const onGridBlur = () => {
        onFocusChange?.(false);
    };

    // Focus canvas for keyboard
    useLayoutEffect(() => {
        const { current: overlay } = overlayRef;
        if (!overlay) {
            return;
        }
        if (editMode || !focused) {
            return;
        }
        if (document.activeElement === overlay) {
            return;
        }

        const activeTagName = (document as any).activeElement.tagName.toLowerCase();
        if (
            !(
                (activeTagName === 'div' && (document as any).activeElement.contentEditable === 'true') ||
                activeTagName === 'input' ||
                activeTagName === 'textarea' ||
                activeTagName === 'select'
            )
        ) {
            overlay.focus({ preventScroll: true });
        }
    }, [editMode, focused]);

    return { onInputKeyDown, onGridFocus, onGridBlur, onGridKeyDown };
};
