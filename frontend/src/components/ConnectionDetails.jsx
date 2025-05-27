import { useEffect, useState } from "react";
import {
    FiActivity,
    FiClock,
    FiCpu,
    FiDatabase,
    FiGlobe,
    FiHardDrive,
    FiHash,
    FiInfo,
    FiKey,
    FiLock,
    FiServer,
    FiShield,
    FiUser,
    FiZap,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { getConnectionDetails } from "../utils/api/axios.js";
import Loader from "../ui/Loader.jsx";
import Error from "../ui/Error.jsx";

// Utility functions
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${days}d ${hours}h ${mins}m ${secs}s`;
};

const formatBytes = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
};

const getPercentage = (used, total) => {
    return total > 0 ? ((used / total) * 100).toFixed(2) + "%" : "N/A";
};

// Component for displaying metric cards
const MetricCard = ({
    icon,
    title,
    value,
    subValue,
    className = "",
    tooltip,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`relative bg-gradient-to-br from-gray-800/40 to-gray-800/20 p-4 rounded-lg border border-gray-700/50 transition-all duration-300 ${
                isHovered
                    ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
                    : ""
            } ${className}`}
            title={tooltip}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 transition-opacity duration-300 pointer-events-none"
                style={{ opacity: isHovered ? 1 : 0 }}
            />
            <div className="flex items-center gap-2 text-gray-400 uppercase tracking-wider text-xs">
                {icon}
                {title}
            </div>
            <p
                className="text-2xl font-bold text-white mt-1 transition-transform duration-300"
                style={{ transform: isHovered ? "translateX(2px)" : "none" }}
            >
                {value}
            </p>
            {subValue && (
                <p
                    className="text-xs text-gray-400 mt-1 transition-opacity duration-300"
                    style={{ opacity: isHovered ? 0.8 : 0.6 }}
                >
                    {subValue}
                </p>
            )}
        </div>
    );
};

// Animated Clock Component
const AnimatedClock = ({ date }) => {
    if (!date) return <Loader size="small" />;

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const hourDegrees = (hours % 12) * 30 + minutes * 0.5;
    const minuteDegrees = minutes * 6;
    const secondDegrees = seconds * 6;

    return (
        <div className="relative w-10 h-10 rounded-full bg-blue-900/20 border border-blue-700/50 flex items-center justify-center shadow-inner">
            <div className="absolute w-3 h-3 rounded-full bg-blue-500/50 z-10"></div>
            {[...Array(12)].map((_, i) => (
                <div
                    key={i}
                    className="absolute w-px h-1 bg-blue-400/30"
                    style={{
                        transform: `rotate(${i * 30}deg) translateY(-15px)`,
                    }}
                />
            ))}

            {/* Hour hand */}
            <div
                className="absolute w-1 h-3 bg-blue-400 rounded-full origin-bottom transform -translate-y-1.5"
                style={{
                    transform: `rotate(${hourDegrees}deg) translateY(-1.5px)`,
                }}
            ></div>

            {/* Minute hand */}
            <div
                className="absolute w-1 h-4 bg-blue-300 rounded-full origin-bottom transform -translate-y-2"
                style={{
                    transform: `rotate(${minuteDegrees}deg) translateY(-2px)`,
                }}
            ></div>

            {/* Second hand */}
            <div
                className="absolute w-0.5 h-5 bg-blue-200 rounded-full origin-bottom transform -translate-y-2.5 transition-transform duration-300"
                style={{
                    transform: `rotate(${secondDegrees}deg) translateY(-2.5px)`,
                }}
            ></div>

            {/* Center dot */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 z-20"></div>
        </div>
    );
};

// Component for server information section
const ServerInfoSection = ({ connectionData }) => {
    const getMetric = (variableName) => {
        if (!connectionData) return "N/A";
        return (
            connectionData.serverStatus?.find(
                (s) => s.Variable_name === variableName,
            )?.Value ||
            connectionData.serverVariables?.find(
                (v) => v.Variable_name === variableName,
            )?.Value ||
            "N/A"
        );
    };

    const getServerFlavor = (version) => {
        if (version.includes("MariaDB")) return "MariaDB";
        if (version.includes("Percona")) return "Percona Server";
        return "MySQL Community/Enterprise";
    };

    return (
        <div className="space-y-6">
            {/* Server Info Card */}
            <div className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                        <FiServer className="text-xl text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                        Server Information
                    </h2>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            icon={<FiHash className="text-blue-400" />}
                            title="MySQL Version"
                            value={connectionData.serverInfo.version}
                            subValue={getServerFlavor(
                                connectionData.serverInfo.version,
                            )}
                            tooltip="Database server version and flavor"
                        />

                        <MetricCard
                            icon={<FiClock className="text-blue-400" />}
                            title="Uptime"
                            value={formatUptime(
                                connectionData.serverInfo.uptimeInSeconds,
                            )}
                            tooltip="How long the server has been running"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            icon={<FiKey className="text-blue-400" />}
                            title="Key Buffer Size"
                            value={formatBytes(
                                parseInt(getMetric("key_buffer_size")),
                            )}
                            tooltip="Size of buffer used for index blocks"
                        />

                        <MetricCard
                            icon={<FiLock className="text-blue-400" />}
                            title="Table Cache"
                            value={getMetric("table_open_cache")}
                            tooltip="Number of open tables cached"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group">
                            <p className="text-xs text-gray-400 uppercase tracking-wider group-hover:text-blue-300 transition-colors duration-300">
                                Character Set
                            </p>
                            <p className="text-lg font-medium text-white group-hover:text-blue-100 transition-colors duration-300">
                                {connectionData.serverInfo.characterSet}
                            </p>
                        </div>
                        <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group">
                            <p className="text-xs text-gray-400 uppercase tracking-wider group-hover:text-blue-300 transition-colors duration-300">
                                Collation
                            </p>
                            <p className="text-lg font-medium text-white group-hover:text-blue-100 transition-colors duration-300">
                                {connectionData.serverInfo.collation}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Metrics Card */}
            <div className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                        <FiCpu className="text-xl text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                    </div>
                    <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                        System Metrics
                    </h2>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            icon={<FiHardDrive className="text-blue-400" />}
                            title="Buffer Pool Size"
                            value={formatBytes(
                                parseInt(getMetric("innodb_buffer_pool_size")),
                            )}
                            tooltip="Size of InnoDB buffer pool"
                        />

                        <MetricCard
                            icon={<FiUser className="text-blue-400" />}
                            title="Max Connections"
                            value={getMetric("max_connections")}
                            tooltip="Maximum allowed simultaneous connections"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard
                            icon={<FiDatabase className="text-blue-400" />}
                            title="Query Cache Size"
                            value={formatBytes(
                                parseInt(getMetric("query_cache_size")),
                            )}
                            tooltip="Size of query cache"
                        />

                        <MetricCard
                            icon={<FiShield className="text-blue-400" />}
                            title="Temp Table Size"
                            value={formatBytes(
                                parseInt(getMetric("tmp_table_size")),
                            )}
                            tooltip="Maximum size of internal in-memory temporary tables"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component for performance metrics section
const PerformanceSection = ({ connectionData }) => {
    const getMetric = (variableName) => {
        if (!connectionData) return "N/A";
        return (
            connectionData.serverStatus?.find(
                (s) => s.Variable_name === variableName,
            )?.Value ||
            connectionData.serverVariables?.find(
                (v) => v.Variable_name === variableName,
            )?.Value ||
            "N/A"
        );
    };

    const getCacheHitRatio = () => {
        const qcacheHits = parseInt(getMetric("Qcache_hits")) || 0;
        const comSelect = parseInt(getMetric("Com_select")) || 0;
        const total = qcacheHits + comSelect;
        return total > 0
            ? ((qcacheHits / total) * 100).toFixed(2) + "%"
            : "N/A";
    };

    return (
        <div className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 p-6 h-full transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                    <FiActivity className="text-xl text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                    Performance Metrics
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    icon={<FiCpu className="text-blue-400" />}
                    title="Thread Cache Size"
                    value={getMetric("thread_cache_size")}
                    tooltip="How many threads the server caches for reuse"
                />

                <MetricCard
                    icon={<FiServer className="text-blue-400" />}
                    title="Threads Created"
                    value={formatNumber(getMetric("Threads_created"))}
                    tooltip="Total threads created since startup"
                />

                <MetricCard
                    icon={<FiZap className="text-blue-400" />}
                    title="Total Queries"
                    value={formatNumber(getMetric("Queries"))}
                    tooltip="Total queries executed since startup"
                />

                <MetricCard
                    icon={<FiUser className="text-blue-400" />}
                    title="Connections"
                    value={getMetric("Threads_connected")}
                    subValue={`Active: ${getMetric("Threads_running")}`}
                    tooltip="Current connections and active threads"
                />

                <MetricCard
                    icon={<FiDatabase className="text-blue-400" />}
                    title="Bytes Sent"
                    value={formatBytes(parseInt(getMetric("Bytes_sent")))}
                    tooltip="Total bytes sent to all clients"
                />

                <MetricCard
                    icon={<FiDatabase className="text-blue-400" />}
                    title="Bytes Received"
                    value={formatBytes(parseInt(getMetric("Bytes_received")))}
                    tooltip="Total bytes received from all clients"
                />

                <MetricCard
                    icon={<FiActivity className="text-blue-400" />}
                    title="Slow Queries"
                    value={formatNumber(getMetric("Slow_queries"))}
                    tooltip="Queries that took longer than long_query_time"
                />

                <MetricCard
                    icon={<FiActivity className="text-blue-400" />}
                    title="Cache Hit Ratio"
                    value={getCacheHitRatio()}
                    tooltip="Query cache hit percentage"
                />

                <MetricCard
                    icon={<FiHardDrive className="text-blue-400" />}
                    title="InnoDB Buffer Hit"
                    value={getPercentage(
                        parseInt(
                            getMetric("Innodb_buffer_pool_read_requests"),
                        ) - parseInt(getMetric("Innodb_buffer_pool_reads")),
                        parseInt(getMetric("Innodb_buffer_pool_read_requests")),
                    )}
                    tooltip="InnoDB buffer pool hit percentage"
                />

                <MetricCard
                    icon={<FiHardDrive className="text-blue-400" />}
                    title="Key Buffer Usage"
                    value={getPercentage(
                        parseInt(getMetric("Key_blocks_used")),
                        parseInt(getMetric("Key_blocks_unused")) +
                            parseInt(getMetric("Key_blocks_used")),
                    )}
                    tooltip="Percentage of used key buffer"
                />
            </div>
        </div>
    );
};

// Component for database summary section
const DatabaseSummarySection = ({ connectionData }) => {
    return (
        <div className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 p-6 h-full transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                    <FiDatabase className="text-xl text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                </div>
                <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                    Database Summary
                </h2>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <MetricCard
                        title="Total Databases"
                        value={connectionData.databases.length}
                        tooltip="Number of databases on the server"
                    />

                    <MetricCard
                        title="Total Size"
                        value={`${connectionData.databaseSizes
                            .reduce(
                                (sum, db) => sum + parseFloat(db.sizeMB || 0),
                                0,
                            )
                            .toFixed(2)} MB`}
                        tooltip="Combined size of all databases"
                    />
                </div>

                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 group-hover:text-blue-300 transition-colors duration-300">
                        Largest Databases
                    </p>
                    <div className="space-y-3">
                        {connectionData.databaseSizes
                            .sort((a, b) => (b.sizeMB || 0) - (a.sizeMB || 0))
                            .slice(0, 5)
                            .map((db, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between bg-gray-800/30 px-4 py-3 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 group"
                                >
                                    <span className="text-white font-medium truncate group-hover:text-blue-100 transition-colors duration-300">
                                        {db.databaseName}
                                    </span>
                                    <span className="text-blue-400 font-mono text-sm group-hover:text-blue-300 transition-colors duration-300">
                                        {db?.sizeMB || "0.00"} MB
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main component
const ConnectionDetails = () => {
    const navigate = useNavigate();
    const [connectionData, setConnectionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [date, setDate] = useState(null);

    useEffect(() => {
        const fetchConnectionDetails = async () => {
            try {
                setLoading(true);
                const { data } = await getConnectionDetails();
                setConnectionData(data);
            } catch (err) {
                setError(
                    err?.data?.message || "Failed to fetch connection details",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchConnectionDetails();
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setDate(new Date());
        }, 1000);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <Loader />;
    if (error) return <Error error={error} onRetry={() => navigate(-1)} />;

    return (
        <div className="space-y-4">
            {/* Server Header */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300">
                        <FiGlobe className="text-2xl text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white hover:text-blue-100 transition-colors duration-300">
                            {connectionData.connection.host}
                        </h1>
                        <p className="text-gray-400 flex items-center gap-1 hover:text-blue-300 transition-colors duration-300">
                            <FiUser className="text-sm" />
                            <span>
                                Connected as {connectionData.connection.user}
                            </span>
                            {connectionData.connection.currentDatabase && (
                                <span className="ml-2 flex items-center gap-1">
                                    <FiDatabase className="text-sm" />
                                    {connectionData.connection.currentDatabase}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div
                    title="System Time"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-900/30 border border-blue-700/50 hover:border-blue-500/50 transition-all duration-300"
                >
                    <AnimatedClock date={date} setDate={setDate} />
                    <span className="text-white font-mono text-sm">
                        {date?.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <ServerInfoSection connectionData={connectionData} />
                <PerformanceSection connectionData={connectionData} />
                <DatabaseSummarySection connectionData={connectionData} />
            </div>
        </div>
    );
};

export default ConnectionDetails;
