import { useCallback, useEffect, useState } from "react";
import {
    FaDatabase,
    FaExclamationTriangle,
    FaPlus,
    FaSearch,
    FaTable,
    FaTimes,
    FaTrash,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Error from "../../ui/Error";
import Loader from "../../ui/Loader";
import {
    createTable,
    dropTable,
    getTables,
    renameTable,
} from "../../utils/api/axios";
import CreateTableModal from "./createTableModal/CreateTableModal";
import TableItem from "./TableItem";

const TablesList = () => {
    const { dbName } = useParams();
    const navigate = useNavigate();
    const [tables, setTables] = useState([]);
    const [filteredTables, setFilteredTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newTable, setNewTable] = useState({
        name: "",
        columns: [{ name: "id", type: "INT" }],
    });

    const fetchTables = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await getTables(dbName);
            setTables(data.tables || []);
            setFilteredTables(data.tables || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch tables");
            console.error("Error fetching tables:", err);
            toast.error("Failed to fetch tables");
        } finally {
            setLoading(false);
        }
    }, [dbName]);

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    useEffect(() => {
        if (searchQuery.trim() === "") {
            setFilteredTables(tables);
        } else {
            const filtered = tables.filter((table) =>
                table.tableName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            );
            setFilteredTables(filtered);
        }
    }, [searchQuery, tables]);

    const handleTableClick = useCallback(
        (tableName) => {
            navigate(`/home/${dbName}/${tableName}`);
        },
        [dbName, navigate],
    );

    const handleCreateTable = useCallback(async () => {
        if (!newTable.name.trim()) {
            toast.error("Table name is required");
            return;
        }

        if (newTable.columns.length === 0) {
            toast.error("At least one column is required");
            return;
        }

        try {
            await createTable(dbName, newTable.name, newTable.columns);

            toast.success(`Table ${newTable.name} created successfully!`);

            setCreateModalVisible(false);
            setNewTable({ name: "", columns: [{ name: "id", type: "INT" }] });
            fetchTables();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to create table",
            );
            console.error("Error creating table:", err);
        }
    }, [dbName, newTable, fetchTables]);

    const handleRenameTable = useCallback(
        async (oldName, newName) => {
            if (!newName.trim()) return;
            if (newName === oldName) return;

            try {
                await renameTable(dbName, oldName, newName);
                toast.success(
                    `Table renamed successfully! ${oldName} → ${newName}`,
                );
                fetchTables();
            } catch (err) {
                toast.error(
                    err.response?.data?.message || "Failed to rename table",
                );
                console.error("Error renaming table:", err);
            }
        },
        [dbName, fetchTables],
    );

    const clearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    const [deleteModal, setDeleteModal] = useState({
        visible: false,
        loading: false,
        tableName: null,
        confirmationText: "",
    });

    const handleDeleteTable = useCallback(async (tableName) => {
        setDeleteModal({
            visible: true,
            loading: false,
            tableName,
            confirmationText: "",
        });
    }, []);

    const confirmDeleteTable = useCallback(async () => {
        if (!deleteModal.tableName) return;
        if (
            deleteModal.confirmationText !==
            `delete table ${deleteModal.tableName}`
        )
            return;

        try {
            setDeleteModal((prev) => ({ ...prev, loading: true }));
            await dropTable(dbName, deleteModal.tableName);

            toast.success(
                `Table ${deleteModal.tableName} deleted successfully!`,
            );

            setDeleteModal({
                visible: false,
                loading: false,
                tableName: null,
                confirmationText: "",
            });
            fetchTables();
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to delete table",
            );
            setDeleteModal((prev) => ({ ...prev, loading: false }));
        }
    }, [
        dbName,
        deleteModal.tableName,
        deleteModal.confirmationText,
        fetchTables,
    ]);

    return (
        <>
            <div className="w-full min-w-60 h-screen bg-gray-800/95 py-3 border-gray-700/50 overflow-y-auto flex flex-col backdrop-blur-sm">
                {/* Sidebar Header */}
                <div className="p-4 border-b border-gray-700/50 sticky top-0 bg-gray-800/80 z-10 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FaDatabase className="text-blue-400 animate-pulse" />
                            <span className="bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">
                                {dbName}
                            </span>
                        </h2>
                        <span
                            title="Total tables"
                            className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded-full"
                        >
                            {loading ? "..." : tables.length}
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div
                        className="relative mt-4 mb-3 group"
                        title="Type a table name to search for it."
                    >
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400 group-hover:text-blue-300 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-8 py-2 bg-gray-700/70 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-500/70 focus:border-blue-500/70 outline-none transition-all text-white placeholder-gray-400 hover:border-gray-500/70"
                            placeholder="Search tables..."
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                                title="Clear search"
                            >
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setCreateModalVisible(true)}
                        title="Create a new table"
                        className="flex mt-2 items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] group"
                    >
                        <FaPlus
                            size={12}
                            className="transition-transform group-hover:rotate-90"
                        />
                        <span className="group-hover:translate-x-0.5 transition-transform">
                            New Table
                        </span>
                    </button>
                </div>

                {/* Tables List */}
                <div className="flex-1 overflow-y-auto px-2">
                    {loading ? (
                        <Loader />
                    ) : error ? (
                        <Error error={error} />
                    ) : (
                        <div className="divide-y divide-gray-700/30">
                            {filteredTables.length === 0 ? (
                                <div className="p-6 text-center text-gray-400/80 text-sm flex flex-col items-center">
                                    <FaTable className="text-3xl mb-2 opacity-30" />
                                    {searchQuery ? (
                                        <>
                                            No tables found matching{" "}
                                            <span className="font-medium text-gray-300">
                                                "{searchQuery}"
                                            </span>
                                        </>
                                    ) : (
                                        "No tables found in this database"
                                    )}
                                </div>
                            ) : (
                                filteredTables.map((table) => (
                                    <TableItem
                                        key={table.tableName}
                                        table={table}
                                        onClick={() =>
                                            handleTableClick(table.tableName)
                                        }
                                        onDelete={() =>
                                            handleDeleteTable(table.tableName)
                                        }
                                        onRename={(newName) =>
                                            handleRenameTable(
                                                table.tableName,
                                                newName,
                                            )
                                        }
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.visible && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-xl border border-gray-700/70 shadow-2xl animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FaExclamationTriangle className="text-red-400 animate-pulse" />
                                Confirm Deletion
                            </h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/50 p-4 rounded-lg mb-4">
                                <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-gray-300">
                                        You are about to delete the table :{" "}
                                        <b>{deleteModal.tableName}</b>
                                    </p>
                                    <p className="text-red-400 text-sm">
                                        This will permanently erase all data and
                                        cannot be undone.
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm mb-2">
                                Type{" "}
                                <span className="font-mono bg-gray-900/50 px-2 py-1 rounded text-red-300">
                                    delete table {deleteModal.tableName}
                                </span>{" "}
                                to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteModal.confirmationText}
                                onChange={(e) =>
                                    setDeleteModal((prev) => ({
                                        ...prev,
                                        confirmationText: e.target.value,
                                    }))
                                }
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-white placeholder-gray-400 font-mono text-sm"
                                placeholder={`Type "delete table ${deleteModal.tableName}"`}
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() =>
                                    setDeleteModal({
                                        visible: false,
                                        loading: false,
                                        tableName: null,
                                        confirmationText: "",
                                    })
                                }
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                                disabled={deleteModal.loading}
                            >
                                <FaTimes />
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteTable}
                                disabled={
                                    deleteModal.loading ||
                                    deleteModal.confirmationText !==
                                        `delete table ${deleteModal.tableName}`
                                }
                                className={`px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 shadow-md hover:scale-[1.02] hover:shadow-lg`}
                            >
                                {deleteModal.loading ? (
                                    <Loader size="small" />
                                ) : (
                                    <>
                                        <FaTrash className="transition-transform group-hover:scale-110" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <CreateTableModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSubmit={handleCreateTable}
                newTable={newTable}
                setNewTable={setNewTable}
            />
        </>
    );
};

export default TablesList;
