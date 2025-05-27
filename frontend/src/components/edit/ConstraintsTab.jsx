import { useState } from "react";
import {
    FaCheckCircle,
    FaColumns,
    FaExclamationTriangle,
    FaKey,
    FaLink,
    FaStar,
} from "react-icons/fa";
import {
    FiChevronDown,
    FiPlus,
    FiSave,
    FiSettings,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import { IoMdClose } from "react-icons/io";

const ConstraintsTab = ({
    dbName,
    tableName,
    columns,
    constraints,
    setShowPremiumModal,
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [constraintType, setConstraintType] = useState("PRIMARY KEY");
    const [constraintName, setConstraintName] = useState("");
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [referenceTable, setReferenceTable] = useState("");
    const [onDelete, setOnDelete] = useState("");
    const [onUpdate, setOnUpdate] = useState("");
    const [checkExpression, setCheckExpression] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [constraintToDelete, setConstraintToDelete] = useState(null);

    const resetForm = () => {
        setConstraintType("PRIMARY KEY");
        setConstraintName("");
        setSelectedColumns([]);
        setReferenceTable("");
        setOnDelete("");
        setOnUpdate("");
        setCheckExpression("");
    };

    const toggleColumnSelection = (columnName) => {
        setSelectedColumns((prev) =>
            prev.includes(columnName)
                ? prev.filter((col) => col !== columnName)
                : [...prev, columnName],
        );
    };

    const getConstraintIcon = (type) => {
        switch (type) {
            case "PRIMARY KEY":
                return <FaKey className="text-blue-400" />;
            case "FOREIGN KEY":
                return <FaLink className="text-purple-400" />;
            case "CHECK":
                return <FaCheckCircle className="text-green-400" />;
            case "UNIQUE":
                return <FaStar className="text-yellow-400" />;
            default:
                return <FaColumns className="text-gray-400" />;
        }
    };

    const ConfirmationModal = ({
        isOpen,
        onClose,
        onConfirm,
        title,
        description,
        confirmText = "Confirm",
        danger = false,
    }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleIn">
                    <div className="p-5 border-b border-gray-700 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 rounded-full ${
                                    danger
                                        ? "bg-red-900/30 text-red-400"
                                        : "bg-blue-900/30 text-blue-400"
                                }`}
                            >
                                {danger ? (
                                    <FaExclamationTriangle />
                                ) : (
                                    <FaCheckCircle />
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-white">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700/50 transition-all"
                        >
                            <FiX size={18} />
                        </button>
                    </div>
                    <div className="p-5">
                        <p className="text-gray-300">{description}</p>
                    </div>
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700/50 hover:bg-gray-600/70 rounded-lg border border-gray-600 transition-all hover:scale-[1.02]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg border transition-all hover:scale-[1.02] ${
                                danger
                                    ? "bg-red-600/90 hover:bg-red-500/90 border-red-700"
                                    : "bg-blue-600/90 hover:bg-blue-500/90 border-blue-700"
                            }`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!constraintToDelete}
                onClose={() => setConstraintToDelete(null)}
                onConfirm={() => setShowPremiumModal(true)}
                title="Drop Constraint"
                description={`Are you sure you want to drop the constraint "${constraintToDelete}"? This action cannot be undone.`}
                confirmText="Drop Constraint"
                danger={true}
            />

            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 group-hover:border-blue-500/30 transition-colors">
                        <FiSettings className="text-blue-400 text-lg group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">
                            Table Constraints
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {dbName} • {tableName}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-95"
                >
                    <FiPlus className="text-lg" />
                    <span>Add Constraint</span>
                </button>
            </div>

            {/* Existing Constraints */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm transition-all duration-300">
                <h4 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                    <span className="bg-blue-900/30 text-blue-400 p-1.5 rounded-lg">
                        <FaColumns />
                    </span>
                    Existing Constraints
                </h4>

                {constraints.length === 0 ? (
                    <div className="p-8 text-center bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                        <p className="text-gray-400">
                            No constraints defined for this table
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {constraints.map((constraint) => (
                            <div
                                key={constraint.name}
                                className="bg-gray-800/30 p-4 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors duration-200 group relative"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`mt-1 p-2 rounded-lg ${
                                                constraint.type ===
                                                "PRIMARY KEY"
                                                    ? "bg-blue-900/20 text-blue-400"
                                                    : constraint.type ===
                                                      "FOREIGN KEY"
                                                    ? "bg-purple-900/20 text-purple-400"
                                                    : constraint.type ===
                                                      "CHECK"
                                                    ? "bg-green-900/20 text-green-400"
                                                    : "bg-yellow-900/20 text-yellow-400"
                                            }`}
                                        >
                                            {getConstraintIcon(constraint.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">
                                                    {constraint.type}
                                                </span>
                                                {constraint.name &&
                                                    constraint.name !==
                                                        "PRIMARY" && (
                                                        <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full">
                                                            {constraint.name}
                                                        </span>
                                                    )}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-300">
                                                Columns:{" "}
                                                <span className="font-mono text-blue-300">
                                                    {constraint.columns?.join(
                                                        ", ",
                                                    )}
                                                </span>
                                            </div>
                                            {constraint.referencedTable && (
                                                <div className="mt-1 text-sm text-gray-300">
                                                    References:{" "}
                                                    <span className="font-mono text-purple-300">
                                                        {
                                                            constraint.referencedTable
                                                        }
                                                    </span>
                                                    {constraint
                                                        .referencedColumns
                                                        ?.length > 0 && (
                                                        <span className="font-mono text-purple-300">
                                                            (
                                                            {constraint.referencedColumns?.join(
                                                                ", ",
                                                            )}
                                                            )
                                                        </span>
                                                    )}
                                                    {constraint.onDelete && (
                                                        <span className="ml-2 text-xs bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                                                            ON DELETE{" "}
                                                            {
                                                                constraint.onDelete
                                                            }
                                                        </span>
                                                    )}
                                                    {constraint.onUpdate && (
                                                        <span className="ml-2 text-xs bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                                                            ON UPDATE{" "}
                                                            {
                                                                constraint.onUpdate
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {constraint.checkExpression && (
                                                <div className="mt-1 text-sm text-gray-300">
                                                    Condition:{" "}
                                                    <span className="font-mono text-green-300">
                                                        {
                                                            constraint.checkExpression
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setConstraintToDelete(
                                                constraint.name,
                                            )
                                        }
                                        className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100 hover:scale-110"
                                        title="Drop constraint"
                                    >
                                        <FiTrash2 />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Constraint Form */}
            {showAddForm && (
                <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="bg-blue-900/30 text-blue-400 p-1.5 rounded-lg">
                                <FiPlus />
                            </span>
                            Add New Constraint
                        </h4>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                resetForm();
                            }}
                            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-colors hover:rotate-90"
                        >
                            <IoMdClose size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Constraint Type
                            </label>
                            <div className="relative">
                                <select
                                    value={constraintType}
                                    onChange={(e) =>
                                        setConstraintType(e.target.value)
                                    }
                                    className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm appearance-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                >
                                    <option value="PRIMARY KEY">
                                        Primary Key
                                    </option>
                                    <option value="UNIQUE">Unique</option>
                                    <option value="FOREIGN KEY">
                                        Foreign Key
                                    </option>
                                    <option value="CHECK">Check</option>
                                </select>
                                <FiChevronDown className="absolute right-3 top-3.5 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Constraint Name
                            </label>
                            <input
                                type="text"
                                value={constraintName}
                                onChange={(e) =>
                                    setConstraintName(e.target.value)
                                }
                                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                placeholder="Enter constraint name"
                                disabled={constraintType === "PRIMARY KEY"}
                            />
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Select Columns
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {columns.map((column) => (
                                <div
                                    key={column.name}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-95 ${
                                        selectedColumns.includes(column.name)
                                            ? "bg-blue-500/10 border-blue-500/50 shadow-blue-500/10"
                                            : "bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50"
                                    }`}
                                    onClick={() =>
                                        toggleColumnSelection(column.name)
                                    }
                                >
                                    <div
                                        className={`w-3 h-3 rounded-full border transition-all ${
                                            selectedColumns.includes(
                                                column.name,
                                            )
                                                ? "bg-blue-500 border-blue-500"
                                                : "bg-gray-800 border-gray-600"
                                        }`}
                                    ></div>
                                    <div>
                                        <div className="text-sm font-medium text-white">
                                            {column.name}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">
                                            {column.type}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {constraintType === "FOREIGN KEY" && (
                        <div className="space-y-5 mb-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reference Table
                                </label>
                                <input
                                    type="text"
                                    value={referenceTable}
                                    onChange={(e) =>
                                        setReferenceTable(e.target.value)
                                    }
                                    className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                    placeholder="Enter reference table name"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        On Delete
                                    </label>
                                    <select
                                        value={onDelete}
                                        onChange={(e) =>
                                            setOnDelete(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                    >
                                        <option value="">No Action</option>
                                        <option value="CASCADE">Cascade</option>
                                        <option value="SET NULL">
                                            Set Null
                                        </option>
                                        <option value="RESTRICT">
                                            Restrict
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        On Update
                                    </label>
                                    <select
                                        value={onUpdate}
                                        onChange={(e) =>
                                            setOnUpdate(e.target.value)
                                        }
                                        className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                    >
                                        <option value="">No Action</option>
                                        <option value="CASCADE">Cascade</option>
                                        <option value="SET NULL">
                                            Set Null
                                        </option>
                                        <option value="RESTRICT">
                                            Restrict
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {constraintType === "CHECK" && (
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Check Expression
                            </label>
                            <input
                                type="text"
                                value={checkExpression}
                                onChange={(e) =>
                                    setCheckExpression(e.target.value)
                                }
                                className="w-full px-4 py-2 bg-gray-800/70 border border-gray-700/50 rounded-lg text-white text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition hover:border-gray-600/50"
                                placeholder="e.g. age > 18"
                            />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                resetForm();
                            }}
                            className="px-5 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            disabled={selectedColumns.length === 0}
                            className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-lg border border-blue-600 shadow-lg hover:shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FiSave />
                            <span>Add Constraint</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Add Constraint Confirmation Modal */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => setShowPremiumModal(true)}
                title="Add Constraint"
                description={`Are you sure you want to add this ${constraintType} constraint?`}
                confirmText="Add Constraint"
            />
        </div>
    );
};

export default ConstraintsTab;
