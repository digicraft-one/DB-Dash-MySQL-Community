import { useEffect, useRef } from "react";
import { FaTrash, FaInfoCircle, FaCheck, FaTimes } from "react-icons/fa";
import { dataTypes } from "./dataTypes.js";

const ColumnForm = ({
    column,
    index,
    updateColumn,
    removeColumn,
    isLastColumn,
    isNew,
    focusOnMount,
}) => {
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (focusOnMount) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [focusOnMount]);

    return (
        <div
            className={`bg-gray-800/90 border rounded-xl p-4 mb-4 shadow-lg transition-all duration-200
      ${
          isNew
              ? "border-blue-500/60 ring-2 ring-blue-500/20"
              : "border-gray-700/50 hover:border-gray-600/60"
      }`}
        >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700/40">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                        <span className="text-blue-400 font-medium text-xs">
                            {index + 1}
                        </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200">
                        Column Settings
                    </h3>
                </div>
                <button
                    onClick={() => removeColumn(index)}
                    disabled={isLastColumn}
                    className={`text-xs px-2.5 py-1 rounded-md transition-all flex items-center gap-1
            ${
                isLastColumn
                    ? "text-gray-500 bg-gray-800/20 border-gray-700/40 cursor-not-allowed"
                    : "text-red-400 hover:text-white bg-red-900/20 border-red-800/40 hover:bg-red-900/30"
            } border`}
                    title={
                        isLastColumn
                            ? "Cannot remove the last column"
                            : "Remove this column"
                    }
                >
                    <FaTrash className="text-xs" />
                    <span>Remove</span>
                </button>
            </div>

            {/* Main Form Grid - Redesigned Card Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Column Name - Highlighted Card */}
                <div className="bg-gray-750/80 p-3 rounded-lg border border-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-medium text-gray-300/90 flex items-center gap-1">
                            Column Name
                            <FaInfoCircle
                                className="text-gray-500/80 hover:text-blue-400 cursor-help"
                                title="Must be unique (letters, numbers, underscores)"
                            />
                        </label>
                    </div>
                    <input
                        ref={nameInputRef}
                        type="text"
                        value={column.name}
                        onChange={(e) =>
                            updateColumn(index, "name", e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-gray-700/60 border border-gray-600/50 rounded-md 
              focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/70 outline-none 
              text-white/90 text-sm placeholder-gray-500/60 transition-all"
                        placeholder="e.g. username"
                    />
                </div>

                {/* Data Type - Highlighted Card */}
                <div className="bg-gray-750/80 p-3 rounded-lg border border-gray-700/50">
                    <label className="text-xs font-medium text-gray-300/90 mb-1 block">
                        Data Type
                    </label>
                    <div className="relative">
                        <select
                            value={column.type}
                            onChange={(e) =>
                                updateColumn(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-1.5 bg-gray-700/60 border border-gray-600/50 rounded-md 
                focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/70 outline-none 
                text-white/90 text-sm appearance-none transition-all"
                        >
                            {dataTypes.map((type) => (
                                <option
                                    key={type}
                                    value={type}
                                    className="bg-gray-800 text-white"
                                >
                                    {type}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500/70">
                            <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Default Value - Highlighted Card */}
                <div className="bg-gray-750/80 p-3 rounded-lg border border-gray-700/50">
                    <label className="text-xs font-medium text-gray-300/90 mb-1 block">
                        Default Value
                    </label>
                    <input
                        type="text"
                        value={column.defaultValue}
                        onChange={(e) =>
                            updateColumn(index, "defaultValue", e.target.value)
                        }
                        className="w-full px-3 py-1.5 bg-gray-700/60 border border-gray-600/50 rounded-md 
              focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/70 outline-none 
              text-white/90 text-sm placeholder-gray-500/60 transition-all"
                        placeholder="(optional)"
                    />
                </div>

                {/* Check Constraint - Highlighted Card */}
                <div className="bg-gray-750/80 p-3 rounded-lg border border-gray-700/50">
                    <label className="text-xs font-medium text-gray-300/90 mb-1 block">
                        Check Constraint
                    </label>
                    <input
                        type="text"
                        value={column.checkExpression}
                        onChange={(e) =>
                            updateColumn(
                                index,
                                "checkExpression",
                                e.target.value,
                            )
                        }
                        className="w-full px-3 py-1.5 bg-gray-700/60 border border-gray-600/50 rounded-md 
              focus:ring-1 focus:ring-blue-500/60 focus:border-blue-500/70 outline-none 
              text-white/90 text-sm placeholder-gray-500/60 transition-all"
                        placeholder="e.g. age > 18"
                    />
                </div>
            </div>

            {/* Constraints - Interactive Toggle Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                {[
                    {
                        key: "notNull",
                        label: "NOT NULL",
                        title: "Require value in this column",
                    },
                    {
                        key: "autoIncrement",
                        label: "AUTO INCR",
                        title: "Automatically increment values",
                    },
                    {
                        key: "unique",
                        label: "UNIQUE",
                        title: "Enforce unique values",
                    },
                    {
                        key: "primaryKey",
                        label: "PRIMARY KEY",
                        title: "Set as primary identifier",
                    },
                ].map(({ key, label, title }) => (
                    <div
                        key={key}
                        onClick={() => updateColumn(index, key, !column[key])}
                        className={`p-2 rounded-md border cursor-pointer transition-colors flex items-center gap-2
              ${
                  column[key]
                      ? "bg-blue-900/30 border-blue-700/50 text-blue-300"
                      : "bg-gray-800/40 border-gray-700/50 text-gray-400 hover:bg-gray-700/60 hover:border-gray-600/60"
              }`}
                        title={title}
                    >
                        <div
                            className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors
              ${
                  column[key]
                      ? "bg-blue-500/90 border-blue-400/80"
                      : "bg-gray-700/80 border-gray-600/70"
              }`}
                        >
                            {column[key] && (
                                <FaCheck className="text-white text-xs" />
                            )}
                        </div>
                        <span className="text-xs font-medium">{label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColumnForm;
