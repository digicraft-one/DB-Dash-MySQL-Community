import { useState } from "react";
import {
    FaCheck,
    FaColumns,
    FaExclamationTriangle,
    FaPlus,
    FaTrash,
} from "react-icons/fa";
import { FiSave } from "react-icons/fi";
import { IoMdClose } from "react-icons/io";
import ColumnForm from "../tables/createTableModal/ColumnForm";

const AddColumnsTab = ({ dbName, tableName, setShowPremiumModal }) => {
    const [newColumns, setNewColumns] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);

    const initialColumnState = {
        name: "",
        type: "VARCHAR(255)",
        notNull: false,
        defaultValue: "",
        autoIncrement: false,
        unique: false,
        primaryKey: false,
        checkExpression: "",
    };

    const addNewColumn = () =>
        setNewColumns((prev) => [...prev, initialColumnState]);

    const updateColumn = (index, field, value) => {
        setNewColumns((prev) =>
            prev.map((col, i) =>
                i === index ? { ...col, [field]: value } : col,
            ),
        );
    };

    const removeColumn = (index) =>
        setNewColumns((prev) => prev.filter((_, i) => i !== index));

    const clearAllColumns = () => {
        setNewColumns([]);
        setShowClearModal(false);
    };

    // Confirmation Modal Component
    const ConfirmationModal = ({
        isOpen,
        onClose,
        onConfirm,
        title,
        description,
        confirmText,
        danger = false,
    }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
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
                                    <FaCheck />
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
                            <IoMdClose size={18} />
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
            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => setShowPremiumModal(true)}
                title="Confirm Add Columns"
                description={`Are you sure you want to add ${newColumns.length} column(s) to ${tableName}?`}
                confirmText="Add Columns"
            />
            <ConfirmationModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                onConfirm={clearAllColumns}
                title="Clear All Columns"
                description="This will remove all columns you've added. This action cannot be undone."
                confirmText="Clear All"
                danger={true}
            />

            {/* Header with Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 group-hover:border-blue-500/30 transition-colors">
                        <FaColumns className="text-blue-400 text-lg group-hover:text-blue-300 transition-colors" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-white">
                            Add Columns
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                            {dbName} • {tableName}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <button
                        onClick={addNewColumn}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-95 flex-1 sm:flex-none justify-center"
                    >
                        <FaPlus className="text-md" />
                        <span>Add Column</span>
                    </button>
                    <button
                        onClick={() =>
                            newColumns.length > 0
                                ? setShowClearModal(true)
                                : null
                        }
                        disabled={newColumns.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-[1.02] active:scale-95 flex-1 sm:flex-none justify-center ${
                            newColumns.length === 0
                                ? "bg-gray-800/30 text-gray-500 cursor-not-allowed"
                                : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600"
                        }`}
                    >
                        <FaTrash className="text-md" />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            {/* Columns List */}
            <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm transition-all duration-300">
                {newColumns.length > 0 ? (
                    <div className="space-y-4">
                        {newColumns.map((column, index) => (
                            <ColumnForm
                                column={column}
                                index={index}
                                updateColumn={updateColumn}
                                removeColumn={removeColumn}
                                isLastColumn={index === newColumns.length}
                                isNew={index === newColumns.length}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-gray-900/30 rounded-lg border-2 border-dashed border-gray-700/50 hover:border-blue-500/30 transition-all duration-300">
                        <p className="text-gray-400">No columns added yet</p>
                        <button
                            onClick={addNewColumn}
                            className="mt-3 px-4 py-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1.5 mx-auto hover:scale-[1.02] active:scale-95 transition-transform"
                        >
                            <FaPlus /> Add your first column
                        </button>
                    </div>
                )}

                {/* Save Button */}
                {newColumns.length > 0 && (
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={() => setShowConfirmModal(true)}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <FiSave />
                            <span>Save Changes</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddColumnsTab;
