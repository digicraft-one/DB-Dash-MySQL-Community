import { useEffect, useState } from "react";
import {
    FiBarChart,
    FiCalendar,
    FiCode,
    FiDatabase,
    FiHardDrive,
    FiHash,
    FiLayers,
    FiList,
    FiRepeat,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import Error from "../ui/Error.jsx";
import Loader from "../ui/Loader.jsx";
import { getDatabaseDetails } from "../utils/api/axios.js";
import RefreshButton from "./common/RefreshButton.jsx";

const InfoCard = ({
    title,
    value,
    icon,
    iconBg,
    isMono = false,
    isLoading = false,
    tooltip = "",
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            title={tooltip}
            className={`relative bg-gradient-to-br from-gray-800/40 to-gray-800/20 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 ${
                isHovered
                    ? "shadow-lg shadow-blue-500/10 scale-[1.02]"
                    : "shadow-md"
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-3 mb-4">
                <div
                    className={`p-2 rounded-full ${iconBg} transition-colors duration-300 group-hover:opacity-90`}
                >
                    {icon}
                </div>
                <h3 className="font-medium text-gray-300 group-hover:text-blue-200 transition-colors duration-300">
                    {title}
                </h3>
            </div>
            {isLoading ? (
                <div className="animate-pulse h-8 bg-gray-700/50 rounded-md"></div>
            ) : typeof value === "string" || typeof value === "number" ? (
                <p
                    className={`text-${isMono ? "lg" : "2xl"} ${
                        isMono ? "font-mono" : "font-bold"
                    } text-white bg-gray-700/50 px-3 py-1 rounded-md transition-all duration-200 ${
                        isHovered ? "bg-gray-700/70" : ""
                    }`}
                >
                    {value}
                </p>
            ) : (
                value
            )}
        </div>
    );
};

const ProgressStat = ({ value, max, color = "blue", label = "" }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    const colorClasses = {
        blue: "bg-blue-500",
        green: "bg-green-500",
        yellow: "bg-yellow-500",
        red: "bg-red-500",
        purple: "bg-purple-500",
    };

    return (
        <div className="space-y-1 group">
            <div className="flex justify-between text-sm text-gray-400">
                <span>{label || `${value} / ${max}`}</span>
                <span>{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 relative">
                <div
                    className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const DatabaseDetails = () => {
    const { dbName } = useParams();
    const navigate = useNavigate();
    const [databaseInfo, setDatabaseInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDatabaseInfo = async () => {
        try {
            const isInitialLoad = !refreshing;
            if (!isInitialLoad) setRefreshing(true);

            setError(null);
            const { data } = await getDatabaseDetails(dbName);
            setDatabaseInfo(data);

            if (!isInitialLoad) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Failed to fetch database information",
            );
            console.error("Error fetching database info:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDatabaseInfo();
    }, [dbName]);

    if (loading) return <Loader />;
    if (error) return <Error error={error} />;
    if (!databaseInfo) return null;

    return (
        <div className="space-y-6">
            {/* Header with enhanced hover effects */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-700 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors duration-300">
                        <FiDatabase className="text-blue-400 text-2xl group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                    <h1 className="text-2xl font-bold pb-2 text-white group-hover:text-blue-100 transition-colors duration-300">
                        {databaseInfo.database}
                    </h1>
                </div>
                <RefreshButton
                    action={fetchDatabaseInfo}
                    loading={refreshing}
                    title="Refresh Database Information"
                />
            </div>

            {/* Stats Grid with tooltips */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <InfoCard
                    title="Database Size"
                    value={`${databaseInfo.sizeInMB} MB`}
                    icon={<FiHardDrive className="text-blue-400 text-xl" />}
                    iconBg="bg-blue-900/30"
                    tooltip="Total size of the database including data and indexes"
                />

                <InfoCard
                    title="Tables"
                    value={databaseInfo.numberOfTables}
                    icon={<FiList className="text-purple-400 text-xl" />}
                    iconBg="bg-purple-900/30"
                    tooltip="Number of tables in the database"
                />

                <InfoCard
                    title="Total Rows"
                    value={databaseInfo.totalRows?.toLocaleString()}
                    icon={<FiBarChart className="text-lime-400 text-xl" />}
                    iconBg="bg-lime-900/30"
                    tooltip="Total number of rows across all tables"
                />

                <InfoCard
                    title="Total Indexes"
                    value={databaseInfo.totalIndexes}
                    icon={<FiLayers className="text-fuchsia-400 text-xl" />}
                    iconBg="bg-fuchsia-900/30"
                    tooltip="Total number of indexes defined in the database"
                />

                <InfoCard
                    title="Collation"
                    value={databaseInfo.collation}
                    icon={<FiHash className="text-amber-400 text-xl" />}
                    iconBg="bg-amber-900/30"
                    isMono
                    tooltip="Default collation for string comparison in the database"
                />

                <InfoCard
                    title="Character Set"
                    value={databaseInfo.charset}
                    icon={<FiCode className="text-red-400 text-xl" />}
                    iconBg="bg-red-900/30"
                    isMono
                    tooltip="Default character encoding for the database"
                />

                <InfoCard
                    title="Created On"
                    value={
                        <p className="text-lg text-white">
                            {new Date(
                                databaseInfo.creationDate,
                            ).toLocaleDateString()}
                            <span className="text-gray-400 text-sm block">
                                {new Date(
                                    databaseInfo.creationDate,
                                ).toLocaleTimeString()}
                            </span>
                        </p>
                    }
                    icon={<FiCalendar className="text-indigo-400 text-xl" />}
                    iconBg="bg-indigo-900/30"
                    tooltip="Date and time when the database was created"
                />

                <InfoCard
                    title="Replication Role"
                    value={databaseInfo.replication?.role || "Standalone"}
                    icon={<FiRepeat className="text-teal-400 text-xl" />}
                    iconBg="bg-teal-900/30"
                    tooltip="Replication role of the database instance"
                />
            </div>

            {/* Enhanced Largest Tables Section */}
            {databaseInfo.largestTables &&
                databaseInfo.largestTables.length > 0 && (
                    <div className="bg-gradient-to-br from-gray-800/40 to-gray-800/20 p-6 rounded-xl border border-gray-700 hover:border-blue-500/30 transition-all duration-300 group">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 group-hover:text-blue-100 transition-colors duration-300">
                            <FiList className="text-purple-400 group-hover:text-purple-300 transition-colors duration-300" />
                            Largest Tables
                            <span className="text-xs text-gray-500 group-hover:text-blue-300 transition-colors duration-300">
                                (Click to view details)
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {databaseInfo.largestTables.map((table, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-700/30 p-4 rounded-lg border border-gray-700 hover:border-purple-500/50 hover:shadow-purple-500/10 hover:shadow-lg transition-all duration-300 cursor-pointer group/table"
                                    onClick={() => navigate(`${table.name}`)}
                                >
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-medium text-white group-hover/table:text-purple-100 transition-colors duration-300">
                                            {table.name}
                                        </h3>
                                        <span className="text-sm bg-purple-900/30 text-purple-400 px-2 py-1 rounded group-hover/table:bg-purple-800/40 group-hover/table:text-purple-300 transition-colors duration-300">
                                            {(
                                                table.size /
                                                (1024 * 1024)
                                            ).toFixed(2)}{" "}
                                            MB
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-400 space-y-1">
                                        <div className="flex justify-between group-hover/table:text-white transition-colors duration-300">
                                            <span>Rows:</span>
                                            <span>
                                                {table?.rows?.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between group-hover/table:text-white transition-colors duration-300">
                                            <span>Indexes:</span>
                                            <span>
                                                {table.indexes || "N/A"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between group-hover/table:text-white transition-colors duration-300">
                                            <span>Engine:</span>
                                            <span>
                                                {table.engine || "InnoDB"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
};

export default DatabaseDetails;
