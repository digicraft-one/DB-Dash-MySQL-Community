import { useEffect, useMemo, useState } from "react";
import {
    FaCalendarAlt,
    FaCheck,
    FaCircleNotch,
    FaDatabase,
    FaHashtag,
    FaInfoCircle,
    FaPlus,
    FaTextHeight,
    FaTimes,
    FaToggleOn,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { insertRow } from "../utils/api/axios";

const AddDataModal = ({ columns, dbName, tableName, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [activeInput, setActiveInput] = useState(null);

    // Enhanced column information with icons and max lengths
    const enhancedColumns = useMemo(() => {
        return columns.map((col) => {
            let icon = <FaTextHeight className="text-blue-400" />;
            let inputClass = "";
            let maxLength = 255;

            if (
                col.type.includes("int") ||
                col.type.includes("decimal") ||
                col.type.includes("float")
            ) {
                icon = <FaHashtag className="text-green-400" />;
                inputClass = "font-mono";
            } else if (col.type.includes("date") || col.type.includes("time")) {
                icon = <FaCalendarAlt className="text-purple-400" />;
            } else if (col.type.includes("bool")) {
                icon = <FaToggleOn className="text-amber-400" />;
            }

            if (col.type.includes("varchar")) {
                const matches = col.type.match(/varchar\((\d+)\)/);
                maxLength = matches ? parseInt(matches[1]) : 255;
            } else if (col.type.includes("char(")) {
                const matches = col.type.match(/char\((\d+)\)/);
                maxLength = matches ? parseInt(matches[1]) : 255;
            } else if (col.type.includes("text")) {
                maxLength = 65535;
            }

            return { ...col, icon, inputClass, maxLength };
        });
    }, [columns]);

    useEffect(() => {
        // Initialize form data with empty values for each column
        const initialData = {};
        enhancedColumns.forEach((col) => {
            initialData[col.name] = col.type.includes("bool") ? false : "";
        });
        setFormData(initialData);
    }, [enhancedColumns]);

    const handleChange = (columnName, value) => {
        setFormData((prev) => ({
            ...prev,
            [columnName]: value,
        }));

        // Clear error when user starts typing
        if (errors[columnName]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[columnName];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            const newErrors = {};
            enhancedColumns.forEach((col) => {
                if (
                    col.nullable === false &&
                    (formData[col.name] === "" || formData[col.name] === null)
                ) {
                    newErrors[col.name] = "This field is required";
                }

                // Validate max length for text fields
                if (
                    formData[col.name] &&
                    typeof formData[col.name] === "string" &&
                    formData[col.name].length > col.maxLength
                ) {
                    newErrors[
                        col.name
                    ] = `Maximum length is ${col.maxLength} characters`;
                }
            });

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                setLoading(false);
                return;
            }

            await insertRow(dbName, tableName, [formData]);

            toast.success(
                <div className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span>
                        Added new row to{" "}
                        <span className="font-bold text-purple-300">
                            {tableName}
                        </span>
                    </span>
                </div>,
            );

            onSuccess();
            onClose();
        } catch (err) {
            toast.error(
                <div className="flex items-center gap-2">
                    <FaTimes className="text-rose-400" />
                    <span>
                        {err?.response?.data?.message || "An error occurred"}
                        <span className="font-bold">{tableName}</span>
                    </span>
                </div>,
                { className: "bg-red-900/80 border border-red-700" },
            );
        } finally {
            setLoading(false);
        }
    };

    const getInputType = (columnType) => {
        if (
            columnType.includes("int") ||
            columnType.includes("decimal") ||
            columnType.includes("float")
        ) {
            return "number";
        }
        if (columnType.includes("date")) {
            return "date";
        }
        if (columnType.includes("time")) {
            return "time";
        }
        if (
            columnType.includes("datetime") ||
            columnType.includes("timestamp")
        ) {
            return "datetime-local";
        }
        if (columnType.includes("bool")) {
            return "checkbox";
        }
        return "text";
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700/50 shadow-2xl h-4/5 w-4/5 overflow-scroll">
                {/* Header */}
                <div className="bg-gray-800/90 p-4 border-b border-gray-700/50 flex justify-between items-center backdrop-blur-sm ">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-900/20 border border-blue-800/50">
                            <FaDatabase className="text-blue-400 text-lg" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">
                                Add to{" "}
                                <span className="text-purple-300">
                                    {tableName}
                                </span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                <span className="bg-gray-700/50 px-1.5 py-0.5 rounded text-blue-300">
                                    {dbName}
                                </span>
                                <span>•</span>
                                <span>{enhancedColumns.length} fields</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-gray-700/50 transition-all duration-200"
                    >
                        <FaTimes className="text-lg" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-5">
                        {enhancedColumns.map((column) => {
                            const isActive = activeInput === column.name;
                            const hasError = errors[column.name];
                            const charCount =
                                typeof formData[column.name] === "string"
                                    ? formData[column.name].length
                                    : 0;
                            const isTextInput =
                                getInputType(column.type) === "text";

                            return (
                                <div
                                    key={column.name}
                                    className={`relative group transition-all duration-150 ${
                                        isActive
                                            ? "opacity-100"
                                            : "opacity-90 hover:opacity-100"
                                    }`}
                                >
                                    <div className="grid grid-cols-12 gap-4">
                                        <label className="col-span-12 sm:col-span-3 flex items-start pt-2.5">
                                            <div className="flex items-center gap-3 w-full">
                                                <span className="text-gray-400 group-hover:text-blue-400 transition-colors">
                                                    {column.icon}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                                                        {column.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-mono truncate">
                                                        {column.type}
                                                    </p>
                                                </div>
                                                {column.nullable === false && (
                                                    <span className="text-xs text-rose-400 mt-0.5">
                                                        *
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                        <div className="col-span-12 sm:col-span-9 space-y-1.5">
                                            {getInputType(column.type) ===
                                            "checkbox" ? (
                                                <div className="flex items-center h-10">
                                                    <label className="inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                formData[
                                                                    column.name
                                                                ] || false
                                                            }
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    column.name,
                                                                    e.target
                                                                        .checked,
                                                                )
                                                            }
                                                            className="sr-only peer"
                                                        />
                                                        <div
                                                            className={`relative w-11 h-6 rounded-full peer ${
                                                                formData[
                                                                    column.name
                                                                ]
                                                                    ? "bg-blue-600"
                                                                    : "bg-gray-700"
                                                            } peer-focus:ring-2 peer-focus:ring-blue-800`}
                                                        >
                                                            <div
                                                                className={`absolute top-0.5 left-[2px] bg-white rounded-full h-5 w-5 transition-transform ${
                                                                    formData[
                                                                        column
                                                                            .name
                                                                    ]
                                                                        ? "translate-x-full"
                                                                        : ""
                                                                }`}
                                                            ></div>
                                                        </div>
                                                        <span className="ml-3 text-sm font-medium text-gray-300">
                                                            {formData[
                                                                column.name
                                                            ]
                                                                ? "True"
                                                                : "False"}
                                                        </span>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        id={column.name}
                                                        type={getInputType(
                                                            column.type,
                                                        )}
                                                        value={
                                                            formData[
                                                                column.name
                                                            ] || ""
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                column.name,
                                                                e.target.value,
                                                            )
                                                        }
                                                        onFocus={() =>
                                                            setActiveInput(
                                                                column.name,
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            setActiveInput(null)
                                                        }
                                                        maxLength={
                                                            isTextInput
                                                                ? column.maxLength
                                                                : undefined
                                                        }
                                                        className={`w-full px-3 py-2.5 rounded-md bg-gray-700/50 border ${
                                                            hasError
                                                                ? "border-rose-500/50 focus:ring-rose-500/50"
                                                                : "border-gray-600/50 focus:ring-blue-500/50"
                                                        } text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:border-blue-500 transition-all duration-200 ${
                                                            column.inputClass
                                                        } ${
                                                            isActive
                                                                ? "bg-gray-700/70 border-blue-500/30"
                                                                : ""
                                                        }`}
                                                        placeholder={`Enter ${column.type.replace(
                                                            /\(\d+\)/g,
                                                            "",
                                                        )}`}
                                                    />
                                                    {isTextInput && (
                                                        <div
                                                            className={`absolute bottom-1 right-2 text-xs ${
                                                                charCount >
                                                                column.maxLength *
                                                                    0.9
                                                                    ? "text-amber-400"
                                                                    : "text-gray-500"
                                                            }`}
                                                        >
                                                            {charCount}/
                                                            {column.maxLength}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {hasError && (
                                                <p className="flex items-center gap-1.5 text-xs text-rose-400">
                                                    <FaInfoCircle className="flex-shrink-0" />
                                                    <span>
                                                        {errors[column.name]}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-5 border-t border-gray-700/30 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-700 rounded-md border border-gray-600/50 transition-all duration-200 hover:border-gray-500/50 flex items-center gap-2"
                        >
                            <FaTimes className="text-xs" />
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-md border border-blue-700/50 transition-all duration-200 hover:border-blue-600/50 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <FaCircleNotch className="animate-spin" />
                            ) : (
                                <FaPlus className="text-xs" />
                            )}
                            Add Row
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddDataModal;
