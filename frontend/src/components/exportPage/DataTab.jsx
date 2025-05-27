import { useState } from "react";
import CopyButton from "../common/CopyButton";

const DataTab = ({ data, rowLimit, setRowLimit }) => {
    const ROW_OPTIONS = [10, 100, 1000, "all"];
    const [dataToShow] = useState(JSON.stringify(data, null, 2));

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h4 className="text-white text-lg font-semibold">
                    Data Preview:{" "}
                    <span className="text-blue-400 text-xl font-bold">
                        {rowLimit === "all" ? "All" : rowLimit}
                    </span>{" "}
                    Rows
                </h4>
                <div className="flex gap-2">
                    <select
                        onChange={(e) => setRowLimit(e.target.value)}
                        value={rowLimit}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    >
                        {ROW_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                                {option === "all"
                                    ? "Show All Rows"
                                    : `Show ${option} Rows`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="relative">
                <pre className="text-gray-300 text-sm font-mono bg-gray-900/50 p-4 rounded-lg border border-gray-700 overflow-x-auto ">
                    {dataToShow}
                </pre>
                <CopyButton
                    query={dataToShow}
                    position="top-right"
                    iconClass="text-gray-400 hover:text-white"
                />
            </div>
        </div>
    );
};

export default DataTab;
