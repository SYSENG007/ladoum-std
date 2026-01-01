import { useRef, useState, useCallback, type RefObject } from 'react';
import type { ViewportTransform } from '../types/pedigree';

interface UseZoomPanResult {
    transform: ViewportTransform;
    handlers: {
        onWheel: (e: React.WheelEvent) => void;
        onMouseDown: (e: React.MouseEvent) => void;
        onMouseMove: (e: React.MouseEvent) => void;
        onMouseUp: () => void;
        onMouseLeave: () => void;
    };
    reset: () => void;
    fitToView: (bounds: { minX: number; maxX: number; minY: number; maxY: number }) => void;
}

/**
 * Hook for Figma-style zoom and pan interactions
 * - Wheel zoom centered on cursor
 * - Drag to pan
 * - Reset and fit-to-view helpers
 */
export function useZoomPan(
    svgRef: RefObject<SVGSVGElement>
): UseZoomPanResult {
    const [transform, setTransform] = useState<ViewportTransform>({
        x: 400,  // Initial offset to center content
        y: 400,
        scale: 1,
    });

    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });

    /**
     * Wheel zoom - centered on cursor position
     */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();

        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom delta
        const delta = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, Math.min(5, transform.scale + delta));

        // Adjust offset to keep cursor at same point
        const scaleFactor = newScale / transform.scale;
        const newX = mouseX - (mouseX - transform.x) * scaleFactor;
        const newY = mouseY - (mouseY - transform.y) * scaleFactor;

        setTransform({
            x: newX,
            y: newY,
            scale: newScale,
        });
    }, [transform, svgRef]);

    /**
     * Mouse down - start drag
     */
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only drag on left click
        if (e.button !== 0) return;

        isDraggingRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };

        // Change cursor
        if (svgRef.current) {
            svgRef.current.style.cursor = 'grabbing';
        }
    }, [svgRef]);

    /**
     * Mouse move - pan if dragging
     */
    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDraggingRef.current) return;

        const deltaX = e.clientX - lastMousePosRef.current.x;
        const deltaY = e.clientY - lastMousePosRef.current.y;

        setTransform(prev => ({
            ...prev,
            x: prev.x + deltaX,
            y: prev.y + deltaY,
        }));

        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }, []);

    /**
     * Mouse up - end drag
     */
    const handleMouseUp = useCallback(() => {
        isDraggingRef.current = false;
        if (svgRef.current) {
            svgRef.current.style.cursor = 'grab';
        }
    }, [svgRef]);

    /**
     * Mouse leave - end drag
     */
    const handleMouseLeave = useCallback(() => {
        isDraggingRef.current = false;
        if (svgRef.current) {
            svgRef.current.style.cursor = 'grab';
        }
    }, [svgRef]);

    /**
     * Reset to initial view
     */
    const reset = useCallback(() => {
        setTransform({ x: 400, y: 400, scale: 1 });
    }, []);

    /**
     * Fit all content in view
     */
    const fitToView = useCallback((bounds: { minX: number; maxX: number; minY: number; maxY: number }) => {
        const svg = svgRef.current;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();
        const padding = 50;

        const contentWidth = bounds.maxX - bounds.minX;
        const contentHeight = bounds.maxY - bounds.minY;

        const scaleX = (rect.width - padding * 2) / contentWidth;
        const scaleY = (rect.height - padding * 2) / contentHeight;
        const newScale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x

        const centerX = bounds.minX + contentWidth / 2;
        const centerY = bounds.minY + contentHeight / 2;

        const newX = rect.width / 2 - centerX * newScale;
        const newY = rect.height / 2 - centerY * newScale;

        setTransform({
            x: newX,
            y: newY,
            scale: newScale,
        });
    }, [svgRef]);

    return {
        transform,
        handlers: {
            onWheel: handleWheel,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseLeave,
        },
        reset,
        fitToView,
    };
}
