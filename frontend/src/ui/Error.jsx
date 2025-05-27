import { FiAlertTriangle } from "react-icons/fi";

const Error = ({ error }) => {
    return (
        <div className="relative bg-gradient-to-br from-red-900/30 to-red-900/20 border border-red-700/50 text-red-300 p-4 rounded-lg shadow-lg overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-red-900/10 animate-pulse opacity-30 -z-10" />

            {/* Error content */}
            <div className="flex items-start gap-3 pr-6">
                <div className="flex-shrink-0 pt-0.5">
                    <FiAlertTriangle className="text-lg text-red-400" />
                </div>
                <div className="space-y-1">
                    <h3 className="font-medium text-red-200">
                        Query Execution Failed
                    </h3>
                    <p className="text-sm font-mono text-red-300/90">{error}</p>
                    <div className="flex gap-2 pt-1">
                        <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded border border-red-800/50">
                            SQL_ERROR
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-red-900/30 rounded border border-red-800/50">
                            CODE: 0xERR
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error;
