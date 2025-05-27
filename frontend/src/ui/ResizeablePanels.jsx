import { useState, useRef, useCallback, useEffect } from "react";

export const ResizablePanels = ({
    left,
    center,
    right,
    defaultLeftWidth = 300,
    defaultRightWidth = 100,
    minWidth = 200,
    maxWidth = 400,
}) => {
    const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
    const [isDraggingLeft, setIsDraggingLeft] = useState(false);
    const containerRef = useRef(null);
    const startXRef = useRef(0);
    const startLeftWidthRef = useRef(defaultLeftWidth);

    const handleLeftMouseDown = useCallback(
        (e) => {
            setIsDraggingLeft(true);
            startXRef.current = e.clientX;
            startLeftWidthRef.current = leftWidth;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        },
        [leftWidth],
    );

    const handleMouseMove = useCallback(
        (e) => {
            if (isDraggingLeft) {
                const deltaX = e.clientX - startXRef.current;
                const newWidth = startLeftWidthRef.current + deltaX;
                setLeftWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
            }
        },
        [isDraggingLeft, minWidth, maxWidth],
    );

    const handleMouseUp = useCallback(() => {
        setIsDraggingLeft(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
    }, []);

    useEffect(() => {
        if (isDraggingLeft) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        } else {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        }

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDraggingLeft, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="flex h-full w-full overflow-hidden relative gap-4"
        >
            <div
                className="h-full overflow-y-auto"
                style={{ width: `${leftWidth}px` }}
            >
                {left}
            </div>

            <div
                className={`absolute w-2 h-full bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors ${
                    isDraggingLeft ? "bg-blue-600" : ""
                }`}
                style={{ left: `${leftWidth}px` }}
                onMouseDown={handleLeftMouseDown}
            />

            <div className="flex-1 overflow-y-scroll">{center}</div>

            {right && (
                <div
                    className="h-full overflow-y-auto"
                    style={{ width: `${defaultRightWidth}px` }}
                >
                    {right}
                </div>
            )}
        </div>
    );
};
