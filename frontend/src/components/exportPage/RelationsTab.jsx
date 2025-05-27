const RelationsTab = ({ foreignKeys }) => {
    const COLUMN_LABELS = ["Column", "Foreign Table", "Foreign Column"];

    const COLUMN_RENDERS = [
        (fk) => (
            <span className="font-medium text-blue-300">{fk.COLUMN_NAME}</span>
        ),
        (fk) => (
            <span className="text-purple-300">{fk.REFERENCED_TABLE_NAME}</span>
        ),
        (fk) => (
            <span className="text-green-300">{fk.REFERENCED_COLUMN_NAME}</span>
        ),
    ];

    return (
        <div className="space-y-4 text-center">
            <div className="flex justify-between items-center">
                <h4 className="text-white text-lg font-semibold">
                    Foreign Key Relationships
                </h4>
                <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {foreignKeys.length} relations
                </span>
            </div>

            {foreignKeys.length > 0 ? (
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
                            {foreignKeys.map((fk, i) => (
                                <tr
                                    key={i}
                                    className="hover:bg-gray-800/30 transition-colors"
                                >
                                    {COLUMN_RENDERS.map((render, j) => (
                                        <td
                                            key={j}
                                            className="px-4 py-3 text-sm"
                                        >
                                            {render(fk)}
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
                        No foreign key relationships found for this table
                    </p>
                </div>
            )}
        </div>
    );
};

export default RelationsTab;
