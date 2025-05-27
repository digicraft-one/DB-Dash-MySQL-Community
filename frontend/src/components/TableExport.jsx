import { useEffect, useState } from "react";
import { CgNotes } from "react-icons/cg";
import { FaFileCsv, FaFilePdf, FaTimes } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Error from "../ui/Error.jsx";
import Loader from "../ui/Loader.jsx";
import PremiumFeatureModal from "../ui/PremiumFeatureCard.jsx";
import { exportTable } from "../utils/api/axios.js";
import ColumnsTab from "./exportPage/ColumnsTab.jsx";
import DataTab from "./exportPage/DataTab.jsx";
import IndexesTab from "./exportPage/IndexesTab.jsx";
import RelationsTab from "./exportPage/RelationsTab.jsx";

const TABS = [
    { key: "data", label: "Data" },
    { key: "columns", label: (meta) => `Columns (${meta.columns.length})` },
    {
        key: "relations",
        label: (meta) => `Relations (${meta.foreignKeys.length})`,
    },
    { key: "indexes", label: (meta) => `Indexes (${meta.indexes.length})` },
];

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-gray-800 rounded-lg w-full max-w-lg mx-4 border border-gray-700 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
                >
                    <FaTimes className="w-5 h-5" />
                </button>
                {children}
            </div>
        </div>
    );
};

const TableExport = () => {
    const { dbName, tableName } = useParams();
    const [dataToExport, setDataToExport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [rowLimit, setRowLimit] = useState(10);
    const [activeTab, setActiveTab] = useState("data");
    const [exportOption, setExportOption] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [savedColumns, setSavedColumns] = useState([]);
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
    const [selectAllColumns, setSelectAllColumns] = useState(true);
    const [columnsSaved, setColumnsSaved] = useState(false);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    useEffect(() => {
        const fetchExport = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data } = await exportTable(
                    dbName,
                    tableName,
                    rowLimit === "all" ? null : rowLimit,
                );
                setDataToExport(data);
                // Initialize selected columns with all columns
                setSelectedColumns(
                    data.meta.columns.map((col) => col.COLUMN_NAME),
                );
                toast.success(
                    `Fetched ${
                        rowLimit === "all" ? "all" : rowLimit
                    } rows of ${tableName} table.`,
                );
            } catch (err) {
                setError(
                    err.response?.data?.message || "Failed to export table",
                );
                console.error("Error exporting table:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExport();
    }, [dbName, tableName, rowLimit]);

    const handleExportData = (option) => {
        setExportOption(option);
        setIsColumnModalOpen(true);
        setColumnsSaved(false); // Reset saved state when opening modal
    };

    const handleColumnSelection = (columnName) => {
        setSelectedColumns((prev) =>
            prev.includes(columnName)
                ? prev.filter((col) => col !== columnName)
                : [...prev, columnName],
        );
    };

    const toggleSelectAllColumns = () => {
        if (selectAllColumns) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns(
                dataToExport.meta.columns.map((col) => col.COLUMN_NAME),
            );
        }
        setSelectAllColumns(!selectAllColumns);
    };

    const saveSelectedColumns = () => {
        if (selectedColumns.length === 0) {
            toast.error("Please select at least one column");
            return;
        }
        setSavedColumns([...selectedColumns]);
        setColumnsSaved(true);
        toast.success("Columns selection saved");
    };

    if (loading) return <Loader />;
    if (error) return <Error message={error} />;

    return (
        <>
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-700 shadow-lg overflow-scroll mb-6">
                {/* Header Section */}
                <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                            Table Export
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Exporting from{" "}
                            <span className="text-blue-400">{dbName}</span> /{" "}
                            <span className="text-blue-400">{tableName}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                                {dataToExport.meta.rowCount} rows
                            </span>
                            <span className="text-sm bg-gray-700/50 text-gray-300 px-2 py-1 rounded">
                                {dataToExport.meta.tableSizeMB} MB
                            </span>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {/* Export Data dropdown */}
                        <div className="relative group">
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors duration-200 shadow">
                                <CgNotes className="w-4 h-4" /> Export Data
                            </button>
                            <div className="absolute right-0 w-56 bg-gray-800 rounded-md shadow-lg z-10 hidden group-hover:block border border-gray-700">
                                <button
                                    onClick={() => handleExportData("datacsv")}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors duration-200"
                                >
                                    <FaFileCsv className="w-4 h-4 text-green-400" />{" "}
                                    CSV Data
                                </button>
                                <button
                                    onClick={() => handleExportData("datapdf")}
                                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2 transition-colors duration-200"
                                >
                                    <FaFilePdf className="w-4 h-4 text-red-400" />{" "}
                                    PDF Data
                                </button>
                            </div>
                        </div>

                        {/* Export Summary */}
                        <button
                            onClick={() => setShowPremiumModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors duration-200 shadow"
                        >
                            <FaFilePdf className="w-4 h-4" /> PDF Summary
                        </button>
                    </div>
                </div>

                {/* Column Selection Modal */}
                <Modal
                    isOpen={isColumnModalOpen}
                    onClose={() => {
                        setIsColumnModalOpen(false);
                        setColumnsSaved(false);
                    }}
                >
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-white mb-4">
                            Select Columns to Export
                        </h3>

                        <div className="flex items-center mb-4 p-3 bg-gray-700/50 rounded-lg">
                            <input
                                type="checkbox"
                                id="select-all-columns"
                                checked={selectAllColumns}
                                onChange={toggleSelectAllColumns}
                                className="mr-3 h-4 w-4 text-blue-500 rounded focus:ring-blue-500 border-gray-600 bg-gray-800"
                            />
                            <label
                                htmlFor="select-all-columns"
                                className="text-white text-sm font-medium"
                            >
                                Select All Columns
                            </label>
                            <span className="ml-auto text-gray-400 text-sm">
                                {selectedColumns.length} selected
                            </span>
                        </div>

                        <div className="max-h-96 overflow-y-auto mb-4 border border-gray-700 rounded-lg p-3 bg-gray-800/50">
                            {dataToExport.meta.columns.map((column) => (
                                <div
                                    key={column.COLUMN_NAME}
                                    className="flex items-center mb-2 p-2 hover:bg-gray-700/30 rounded transition-colors duration-150"
                                >
                                    <input
                                        type="checkbox"
                                        id={`col-${column.COLUMN_NAME}`}
                                        checked={selectedColumns.includes(
                                            column.COLUMN_NAME,
                                        )}
                                        onChange={() =>
                                            handleColumnSelection(
                                                column.COLUMN_NAME,
                                            )
                                        }
                                        className="mr-3 h-4 w-4 text-blue-500 rounded focus:ring-blue-500 border-gray-600 bg-gray-800"
                                    />
                                    <label
                                        htmlFor={`col-${column.COLUMN_NAME}`}
                                        className="text-white text-sm"
                                    >
                                        {column.COLUMN_NAME}
                                    </label>
                                    <span className="ml-auto text-xs text-gray-400">
                                        {column.DATA_TYPE}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-4">
                            {columnsSaved && (
                                <div className="text-green-400 text-sm mb-2 p-2 bg-green-900/20 rounded-lg">
                                    <span className="font-medium">
                                        {savedColumns.length}
                                    </span>{" "}
                                    columns saved for export
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                            <button
                                onClick={() => {
                                    setIsColumnModalOpen(false);
                                    setColumnsSaved(false);
                                }}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                                Cancel
                            </button>

                            {!columnsSaved ? (
                                <button
                                    onClick={saveSelectedColumns}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                                >
                                    Save Selection
                                    <span className="bg-blue-700/50 px-2 py-0.5 rounded text-xs">
                                        {selectedColumns.length}
                                    </span>
                                </button>
                            ) : (
                                <>
                                    {exportOption === "datacsv" ? (
                                        <button
                                            onClick={() =>
                                                setShowPremiumModal(true)
                                            }
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                                        >
                                            <FaFileCsv className="w-4 h-4" />
                                            Export CSV
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setShowPremiumModal(true)
                                            }
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm flex items-center gap-2 transition-colors duration-200 shadow"
                                        >
                                            <FaFilePdf className="w-4 h-4" />{" "}
                                            Export PDF
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </Modal>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-700 flex overflow-x-auto">
                    {TABS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`px-5 py-3 text-sm font-medium relative min-w-max ${
                                activeTab === key
                                    ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500"
                                    : "text-gray-400 hover:text-white"
                            } transition-colors duration-200`}
                        >
                            {typeof label === "function"
                                ? label(dataToExport.meta)
                                : label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-6 overflow-x-auto">
                    {activeTab === "data" && (
                        <DataTab
                            data={dataToExport.data}
                            rowLimit={rowLimit}
                            setRowLimit={setRowLimit}
                        />
                    )}
                    {activeTab === "columns" && (
                        <ColumnsTab columns={dataToExport.meta.columns} />
                    )}
                    {activeTab === "relations" && (
                        <RelationsTab
                            foreignKeys={dataToExport.meta.foreignKeys}
                        />
                    )}
                    {activeTab === "indexes" && (
                        <IndexesTab indexes={dataToExport.meta.indexes} />
                    )}
                </div>
            </div>
            <PremiumFeatureModal
                title="Download data as well as summary in CSV and PDF formats."
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />
        </>
    );
};

export default TableExport;
