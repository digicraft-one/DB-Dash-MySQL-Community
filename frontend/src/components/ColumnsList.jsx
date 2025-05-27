import { memo, useEffect, useState } from "react";
import {
    FaDatabase,
    FaKey,
    FaLink,
    FaSearch,
    FaStar,
    FaTimes,
} from "react-icons/fa";
import {
    FiColumns,
    FiCopy,
    FiMinus,
    FiPlus,
    FiTrash2,
    FiX,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Error from "../ui/Error.jsx";
import Loader from "../ui/Loader.jsx";
import {
    dropColumns,
    dropTable,
    getTableDetails,
    truncateTable,
} from "../utils/api/axios.js";

const ColumnItem = memo(
    ({ column, selected, onSelect, onDelete, isDeleting, isPrimaryKey }) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <div
                className={`group relative p-2 px-3 transition-all duration-300 hover:bg-gray-700/30 rounded-md ${
                    selected ? "bg-blue-900/20 border-l-2 border-blue-500" : ""
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2 truncate">
                        {onSelect && (
                            <div className="transition-transform hover:scale-110 active:scale-95">
                                <input
                                    title={
                                        isPrimaryKey
                                            ? "Primary key columns cannot be modified"
                                            : "Select column"
                                    }
                                    type="checkbox"
                                    checked={selected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onSelect(column.name, e.target.checked);
                                    }}
                                    className={`mr-2 h-3.5 w-3.5 rounded border ${
                                        isPrimaryKey
                                            ? "border-gray-600 cursor-not-allowed"
                                            : "border-gray-500 hover:border-blue-400"
                                    } ${
                                        selected
                                            ? "bg-blue-500 border-blue-500"
                                            : "bg-gray-800"
                                    } focus:ring-blue-500 focus:ring-offset-gray-800 transition-all`}
                                    disabled={isPrimaryKey}
                                />
                            </div>
                        )}
                        <div
                            className={`p-1.5 rounded transition-all duration-300 ${
                                column.key === "PRI"
                                    ? "bg-blue-900/30 text-blue-400 group-hover:bg-blue-900/40"
                                    : column.key === "MUL"
                                    ? "bg-purple-900/30 text-purple-400 group-hover:bg-purple-900/40"
                                    : column.key === "UNI"
                                    ? "bg-yellow-700/40 text-yellow-400 group-hover:bg-yellow-700/50"
                                    : "bg-gray-700/40 text-gray-400 group-hover:bg-gray-700/50"
                            } ${isHovered ? "scale-105" : ""}`}
                            title={
                                column.key === "PRI"
                                    ? "Primary Key"
                                    : column.key === "MUL"
                                    ? "Foreign Key"
                                    : column.key === "UNI"
                                    ? "Unique Key"
                                    : "Regular Column"
                            }
                        >
                            {column.key === "PRI" ? (
                                <FaKey className="text-xs" />
                            ) : column.key === "MUL" ? (
                                <FaLink className="text-xs" />
                            ) : column.key === "UNI" ? (
                                <FaStar className="text-xs" />
                            ) : (
                                <FiColumns className="text-xs" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span
                                className={`text-sm font-medium ${
                                    isHovered ? "text-white" : "text-gray-200"
                                } truncate transition-colors duration-300`}
                                title={column.name}
                            >
                                {column.name}
                            </span>
                            <span
                                className="text-xs text-gray-500 truncate"
                                title={`${column.type}${
                                    column.length ? `(${column.length})` : ""
                                }`}
                            >
                                {column.type}
                                {column.length ? `(${column.length})` : ""}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                        <span
                            className={`text-xs px-2 py-0.5 rounded transition-colors duration-300 ${
                                column.nullable === "YES"
                                    ? "bg-yellow-900/30 text-yellow-400"
                                    : "bg-green-900/30 text-green-400"
                            } ${isHovered ? "scale-105" : ""}`}
                            title={
                                column.nullable === "YES"
                                    ? "This column allows NULL values"
                                    : "This column does not allow NULL values"
                            }
                        >
                            {column.nullable === "YES" ? "NULL" : "NOT NULL"}
                        </span>

                        {!isPrimaryKey && (
                            <button
                                title="Delete this column"
                                className={`p-1 rounded-md transition-all duration-300 ${
                                    onSelect
                                        ? "invisible group-hover:visible text-gray-400 hover:text-red-400"
                                        : "text-gray-500 hover:text-red-400"
                                } hover:scale-110 active:scale-95`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete([column.name]);
                                }}
                                disabled={isDeleting}
                            >
                                <FiTrash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    },
);

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    danger = false,
    inputConfirmation = null,
}) => {
    const [confirmationText, setConfirmationText] = useState("");
    const isConfirmed = inputConfirmation
        ? confirmationText === inputConfirmation
        : true;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl animate-scaleIn">
                <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>

                <div className="mb-6">
                    {danger && (
                        <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/50 p-4 rounded-lg mb-4">
                            <FaTimes className="text-red-400 mt-0.5 flex-shrink-0" />
                            <p className="text-gray-300">{description}</p>
                        </div>
                    )}
                    {!danger && <p className="text-gray-300">{description}</p>}

                    {inputConfirmation && (
                        <>
                            <div className="mt-4">
                                <p className="text-gray-300 mb-2">
                                    Type the following to confirm:
                                </p>
                                <p className="font-mono bg-gray-900/50 px-3 py-2 rounded text-red-300 text-sm">
                                    {inputConfirmation}
                                </p>
                            </div>
                            <input
                                type="text"
                                value={confirmationText}
                                onChange={(e) =>
                                    setConfirmationText(e.target.value)
                                }
                                className="w-full mt-2 px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-white placeholder-gray-400 font-mono text-sm"
                                placeholder={`Type exactly as shown above`}
                                autoFocus
                            />
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                    >
                        <FaTimes />
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                        className={`px-6 py-2 bg-gradient-to-r ${
                            danger
                                ? "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
                                : "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                        } text-white rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 shadow-md hover:scale-[1.02] hover:shadow-lg`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ColumnsList = () => {
    const { dbName, tableName } = useParams();
    const [tableDetails, setTableDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [multiSelectMode, setMultiSelectMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // Modal states
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [columnsToDelete, setColumnsToDelete] = useState([]);
    const [truncateModalOpen, setTruncateModalOpen] = useState(false);
    const [dropModalOpen, setDropModalOpen] = useState(false);

    const fetchTableDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await getTableDetails(dbName, tableName);
            setTableDetails(data);
            setSelectedColumns([]);
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to fetch table details",
            );
            toast.error("Failed to load table structure");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableDetails();
    }, [dbName, tableName]);

    const filteredColumns =
        tableDetails?.columns?.filter((column) =>
            column.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ) || [];

    const handleDeleteColumns = async (columnsToDelete) => {
        if (!columnsToDelete || columnsToDelete.length === 0) return;

        const isPrimaryKey = tableDetails?.columns?.some(
            (col) => columnsToDelete.includes(col.name) && col.key === "PRI",
        );

        if (isPrimaryKey) {
            toast.error("Cannot delete primary key columns");
            return;
        }

        setColumnsToDelete(columnsToDelete);
        setDeleteModalOpen(true);
    };

    const confirmDeleteColumns = async () => {
        try {
            setActionLoading(true);
            setDeleteModalOpen(false);
            await dropColumns(dbName, tableName, columnsToDelete);
            toast.success(
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-30 animate-[shimmer_1.5s_infinite]"></div>
                    <div className="font-medium relative z-10">
                        {columnsToDelete.length > 1
                            ? "Columns deleted successfully!"
                            : "Column deleted successfully!"}
                    </div>
                </div>,
                {
                    className: "bg-green-900/80 border border-green-700",
                    bodyClassName: "relative",
                },
            );
            setMultiSelectMode(false);
            setSelectedColumns([]);
            fetchTableDetails();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to delete columns",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const toggleColumnSelection = (columnName, isSelected) => {
        setSelectedColumns((prev) =>
            isSelected
                ? [...prev, columnName]
                : prev.filter((name) => name !== columnName),
        );
    };

    const toggleMultiSelectMode = () => {
        setMultiSelectMode(!multiSelectMode);
        if (multiSelectMode) {
            setSelectedColumns([]);
            setSearchQuery("");
        }
    };

    const handleTruncateTable = async () => {
        setTruncateModalOpen(true);
    };

    const confirmTruncateTable = async () => {
        try {
            setActionLoading(true);
            setTruncateModalOpen(false);
            await truncateTable(dbName, tableName);
            toast.success(
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-30 animate-[shimmer_1.5s_infinite]"></div>
                    <div className="font-medium relative z-10">
                        Table truncated successfully!
                    </div>
                    <div className="text-xs text-gray-300 mt-1 relative z-10">
                        {tableName}
                    </div>
                </div>,
                {
                    className: "bg-green-900/80 border border-green-700",
                    bodyClassName: "relative",
                },
            );
            fetchTableDetails();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to truncate table",
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDropTable = async () => {
        setDropModalOpen(true);
    };

    const confirmDropTable = async () => {
        try {
            setActionLoading(true);
            setDropModalOpen(false);
            await dropTable(dbName, tableName);
            toast.success(
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-30 animate-[shimmer_1.5s_infinite]"></div>
                    <div className="font-medium relative z-10">
                        Table dropped successfully!
                    </div>
                    <div className="text-xs text-gray-300 mt-1 relative z-10">
                        {tableName}
                    </div>
                </div>,
                {
                    className: "bg-green-900/80 border border-green-700",
                    bodyClassName: "relative",
                },
            );
            navigate(`/home/${dbName}`, { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to drop table");
        } finally {
            setActionLoading(false);
        }
    };

    const clearSearch = () => setSearchQuery("");

    return (
        <>
            <div className="w-full min-w-60 h-screen bg-gray-800/90 backdrop-blur-sm border-r border-gray-700/50 overflow-y-auto flex flex-col">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaDatabase className="text-blue-400" />
                            {tableName}
                        </h2>
                        <span
                            title="Total Columns"
                            className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full"
                        >
                            {loading
                                ? "..."
                                : tableDetails?.columns?.length || 0}
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div
                        className="relative mt-4 mb-3"
                        title="Type a column name to search for it"
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-white placeholder-gray-400"
                            placeholder="Search columns..."
                            disabled={multiSelectMode}
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors hover:scale-110"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Info */}
                {!loading && !error && tableDetails && (
                    <div className="p-4 border-b border-gray-700/50 bg-gray-800/60">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="text-gray-400">Engine:</div>
                            <div className="text-gray-300 font-mono text-right">
                                {tableDetails.engine || "-"}
                            </div>

                            <div className="text-gray-400">Rows:</div>
                            <div className="text-gray-300 font-mono text-right">
                                {tableDetails.rowCount?.toLocaleString() || "-"}
                            </div>

                            <div className="text-gray-400">Collation:</div>
                            <div className="text-gray-300 font-mono text-right">
                                {tableDetails.collation || "-"}
                            </div>

                            <div className="text-gray-400">Size:</div>
                            <div className="text-gray-300 font-mono text-right">
                                {tableDetails.size
                                    ? `${tableDetails.size} KB`
                                    : "-"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Column List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <Error error={error} />
                    ) : (
                        <div className="divide-y divide-gray-700/30">
                            {filteredColumns.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    {searchQuery
                                        ? `No columns found matching "${searchQuery}"`
                                        : "No columns found"}
                                </div>
                            ) : (
                                filteredColumns.map((column) => (
                                    <div
                                        key={column.name}
                                        className="cursor-pointer"
                                    >
                                        <ColumnItem
                                            column={column}
                                            selected={selectedColumns.includes(
                                                column.name,
                                            )}
                                            onSelect={
                                                multiSelectMode
                                                    ? toggleColumnSelection
                                                    : null
                                            }
                                            onDelete={handleDeleteColumns}
                                            isDeleting={actionLoading}
                                            isPrimaryKey={column.key === "PRI"}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-700/50 sticky bottom-0 bg-gray-800/90 backdrop-blur-sm flex flex-col gap-3">
                    {multiSelectMode ? (
                        <div className="flex gap-2">
                            <button
                                title="Delete selected columns"
                                onClick={() =>
                                    handleDeleteColumns(selectedColumns)
                                }
                                disabled={
                                    actionLoading ||
                                    selectedColumns.length === 0
                                }
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm transition-all hover:scale-[1.02] ${
                                    selectedColumns.length === 0
                                        ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                                        : "bg-red-900/40 hover:bg-red-800/50 border border-red-800 text-red-300 hover:text-white"
                                }`}
                            >
                                <FiMinus size={14} />
                                Delete{" "}
                                {selectedColumns.length > 0 &&
                                    `(${selectedColumns.length})`}
                            </button>
                            <button
                                title="Cancel column selection"
                                onClick={toggleMultiSelectMode}
                                className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600 text-gray-300 rounded-md text-sm transition-all hover:scale-[1.02]"
                            >
                                <FiX size={14} /> Cancel
                            </button>
                        </div>
                    ) : (
                        <button
                            title="Enable multi-column selection"
                            onClick={toggleMultiSelectMode}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-gray-700/50 hover:bg-gray-600/70 border border-gray-600 text-gray-300 rounded-md text-sm transition-all hover:scale-[1.02]"
                        >
                            <FiPlus size={14} /> Select Columns
                        </button>
                    )}

                    <div className="flex gap-2">
                        <button
                            title="Truncate this table (removes all rows but keeps structure)"
                            onClick={handleTruncateTable}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-900/40 hover:bg-yellow-800/50 border border-yellow-800 text-yellow-300 hover:text-white rounded-md text-sm transition-all hover:scale-[1.02]"
                        >
                            <FiCopy size={14} /> Truncate
                        </button>
                        <button
                            title="Drop this table (completely removes it)"
                            onClick={handleDropTable}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-900/40 hover:bg-red-800/50 border border-red-800 text-red-300 hover:text-white rounded-md text-sm transition-all hover:scale-[1.02]"
                        >
                            <FiTrash2 size={14} /> Drop
                        </button>
                    </div>
                </div>

                {/* Confirmation Modals */}
            </div>
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteColumns}
                title={
                    columnsToDelete.length === 1
                        ? `Delete column "${columnsToDelete[0]}"?`
                        : `Delete ${columnsToDelete.length} columns?`
                }
                description={
                    columnsToDelete.length === 1
                        ? "This will permanently delete the column and its data."
                        : "This will permanently delete the selected columns and their data."
                }
                confirmText="Delete"
                danger={true}
                inputConfirmation={
                    columnsToDelete.length > 1
                        ? `delete ${columnsToDelete.length} columns`
                        : `delete column ${columnsToDelete[0]}`
                }
            />

            <ConfirmationModal
                isOpen={truncateModalOpen}
                onClose={() => setTruncateModalOpen(false)}
                onConfirm={confirmTruncateTable}
                title={`Truncate table ${tableName}?`}
                description="This will permanently delete ALL data in the table but keep the structure intact."
                confirmText="Truncate"
                danger={true}
                inputConfirmation={`truncate table ${tableName}`}
            />

            <ConfirmationModal
                isOpen={dropModalOpen}
                onClose={() => setDropModalOpen(false)}
                onConfirm={confirmDropTable}
                title={`Drop table ${tableName}?`}
                description="This will permanently delete the table and ALL its data. This action cannot be undone!"
                confirmText="Drop"
                danger={true}
                inputConfirmation={`drop table ${tableName}`}
            />
        </>
    );
};

export default ColumnsList;
