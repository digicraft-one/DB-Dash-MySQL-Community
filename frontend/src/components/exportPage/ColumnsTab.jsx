const ColumnsTab = ({ columns }) => {
    const COLUMN_LABELS = ["Name", "Type", "Nullable", "Key", "Default"];

    const COLUMN_RENDERS = [
        (col) => (
            <span className="font-medium text-blue-300">{col.COLUMN_NAME}</span>
        ),
        (col) => <span className="text-purple-300">{col.COLUMN_TYPE}</span>,
        (col) =>
            col.IS_NULLABLE === "YES" ? (
                <span className="text-red-400">YES</span>
            ) : (
                <span className="text-green-400">NO</span>
            ),
        (col) =>
            col.COLUMN_KEY ? (
                <span className="bg-yellow-900/30 text-yellow-300 px-2 py-0.5 rounded text-xs">
                    {col.COLUMN_KEY}
                </span>
            ) : (
                ""
            ),
        (col) =>
            col.COLUMN_DEFAULT ? (
                <span className="bg-gray-700/50 px-2 py-0.5 rounded">
                    {col.COLUMN_DEFAULT}
                </span>
            ) : (
                <span className="text-gray-500">NULL</span>
            ),
    ];

    return (
        <div className="space-y-4 text-center">
            <div className="flex justify-between items-center">
                <h4 className="text-white text-lg font-semibold">
                    Table Columns
                </h4>
                <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {columns.length} columns
                </span>
            </div>

            <div className="overflow-x-auto border border-gray-700 rounded-lg shadow-lg">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800">
                        <tr>
                            {COLUMN_LABELS.map((label, idx) => (
                                <th
                                    key={idx}
                                    className="px-4 py-3  text-xs font-semibold text-gray-300 uppercase tracking-wider"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-gray-900/50 divide-y divide-gray-700/50">
                        {columns.map((col, i) => (
                            <tr
                                key={col.COLUMN_NAME || i}
                                className="hover:bg-gray-800/30 transition-colors"
                            >
                                {COLUMN_RENDERS.map((render, j) => (
                                    <td key={j} className="px-4 py-3 text-sm">
                                        {render(col)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ColumnsTab;
