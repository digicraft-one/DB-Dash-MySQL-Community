const IndexesTab = ({ indexes }) => {
    const COLUMN_LABELS = ["Name", "Column", "Unique", "Type", "Order"];
    const COLUMN_KEYS = [
        "Key_name",
        "Column_name",
        "Non_unique",
        "Index_type",
        "Collation",
    ];

    const renderValue = (key, value) => {
        switch (key) {
            case "Non_unique":
                return value ? (
                    <span className="text-red-400">No</span>
                ) : (
                    <span className="text-green-400">Yes</span>
                );
            case "Collation":
                return value === "A" ? (
                    <span className="text-blue-300">Asc</span>
                ) : (
                    <span className="text-purple-300">Desc</span>
                );
            case "Key_name":
                return (
                    <span className="font-medium text-gray-300">
                        {value || "PRIMARY"}
                    </span>
                );
            case "Column_name":
                return <span className="text-cyan-400">{value || "-"}</span>;
            case "Index_type":
                return (
                    <span className="text-yellow-400">{value || "BTREE"}</span>
                );
            default:
                return value || "-";
        }
    };

    return (
        <div className="space-y-4 text-center">
            <div className="flex justify-between items-center">
                <h4 className="text-white text-lg font-semibold">
                    Table Indexes
                </h4>
                <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {indexes.length} index{indexes.length !== 1 ? "es" : ""}
                </span>
            </div>

            {indexes.length > 0 ? (
                <div className="overflow-x-auto border border-gray-700 rounded-lg shadow-lg">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-800">
                            <tr>
                                {COLUMN_LABELS.map((label, idx) => (
                                    <th
                                        key={idx}
                                        className="px-4 py-3 text-xs font-semibold text-gray-300 uppercase tracking-wider"
                                    >
                                        {label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-900/50 divide-y divide-gray-700/50">
                            {indexes.map((idx, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-gray-800/30 transition-colors"
                                >
                                    {COLUMN_KEYS.map((key, j) => (
                                        <td
                                            key={j}
                                            className="px-4 py-3 text-sm"
                                        >
                                            {renderValue(key, idx[key])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400">
                        No indexes found for this table
                    </p>
                </div>
            )}
        </div>
    );
};

export default IndexesTab;
