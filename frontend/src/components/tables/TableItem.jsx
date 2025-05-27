import { memo, useState, useRef, useEffect } from "react";
import {
    FaChevronRight,
    FaPen,
    FaTable,
    FaTrash,
    FaCheck,
    FaTimes,
} from "react-icons/fa";

const TableItem = memo(({ table, onClick, onDelete, onRename }) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(table.tableName);
    const inputRef = useRef(null);
    const clickTimeout = useRef(null);

    const handleClick = () => {
        if (clickTimeout.current) clearTimeout(clickTimeout.current);

        clickTimeout.current = setTimeout(() => {
            clickTimeout.current = null;
            if (!isRenaming) onClick();
        }, 250);
    };

    const handleDoubleClick = () => {
        if (clickTimeout.current) {
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;
        }

        if (!isRenaming) setIsRenaming(true);
    };

    const handleRenameSubmit = () => {
        if (newName.trim() && newName !== table.tableName) onRename(newName);

        setIsRenaming(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleRenameSubmit();
        else if (e.key === "Escape") cancelRename();
    };

    const cancelRename = () => {
        setIsRenaming(false);
        setNewName(table.tableName);
    };

    useEffect(() => {
        return () => {
            if (clickTimeout.current) clearTimeout(clickTimeout.current);
        };
    }, []);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    return (
        <div
            title="Click to open the table, double click to rename or click the trash icon to delete."
            className="group relative p-3 px-4 transition-all duration-200 hover:bg-gray-700/50 hover:scale-[1.01] hover:shadow-md rounded-md"
        >
            {isRenaming ? (
                <div className="flex items-center justify-between gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={cancelRename}
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="flex gap-1">
                        <button
                            onClick={handleRenameSubmit}
                            className="p-1 text-green-400 hover:text-green-300"
                            title="Confirm rename"
                        >
                            <FaCheck className="text-xs" />
                        </button>
                        <button
                            onClick={cancelRename}
                            className="p-1 text-red-400 hover:text-red-300"
                            title="Cancel rename"
                        >
                            <FaTimes className="text-xs" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div
                        onClick={handleClick}
                        onDoubleClick={handleDoubleClick}
                        className="cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-md bg-gray-700/40 group-hover:bg-gray-600/60 transition-colors duration-200">
                                <FaTable className="text-sm text-gray-400 group-hover:text-white transition-colors duration-200" />
                            </div>
                            <span className="truncate text-gray-300 z-10 group-hover:text-white transition-colors duration-200">
                                {table.tableName}
                            </span>
                        </div>
                        <FaChevronRight className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors duration-200" />
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="absolute right-10 z-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-opacity duration-200"
                        title="Delete table"
                    >
                        <FaTrash className="text-sm" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDoubleClick();
                        }}
                        className="absolute right-20 z-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-yellow-400 hover:text-yellow-300 p-1 transition-opacity duration-200"
                        title="Rename table"
                    >
                        <FaPen className="text-sm" />
                    </button>
                </>
            )}
        </div>
    );
});

export default TableItem;
