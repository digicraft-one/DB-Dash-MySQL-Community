import { useEffect, useState } from "react";
import {
    FiArrowLeft,
    FiChevronRight,
    FiDatabase,
    FiServer,
    FiUser,
} from "react-icons/fi";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getConnectionDetails } from "../utils/api/axios";

const Header = () => {
    const { dbName } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const pathParts = location.pathname.split("/").filter(Boolean);
    const [connectionDetails, setConnectionDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);

    useEffect(() => {
        const fetchConnectionDetails = async () => {
            setIsLoading(true);
            try {
                const { data } = await getConnectionDetails();
                setConnectionDetails(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConnectionDetails();
    }, []);

    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    };

    return (
        <header className="flex justify-between items-center w-full px-4 py-2 border-b border-slate-700">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center p-2 rounded-lg text-cyan-400 hover:bg-gray-700/50 transition-all duration-200 hover:scale-105 active:scale-95 border border-gray-600 hover:border-cyan-400"
                    title="Go back"
                >
                    <FiArrowLeft className="h-5 w-5" />
                </button>
                <Link
                    to="/"
                    className={`px-2 py-1 rounded-md hover:bg-gray-700/50 transition-colors`}
                >
                    <img
                        src="/logo_noBg.png"
                        alt="logo"
                        className="size-10 ml-4"
                    />
                </Link>
                <FiChevronRight className="h-4 w-4 text-gray-500 mx-1" />

                <nav className="flex items-center">
                    <ol className="flex items-center space-x-2 text-sm font-medium text-gray-300">
                        {pathParts.map((part, index) => (
                            <li key={index} className="flex items-center">
                                <Link
                                    to={`/${pathParts
                                        .slice(0, index + 1)
                                        .join("/")}`}
                                    className={`px-2 py-1 rounded-md hover:bg-gray-700/50 transition-colors ${
                                        index === pathParts.length - 1
                                            ? "text-cyan-400 font-semibold"
                                            : "hover:text-cyan-300"
                                    }`}
                                >
                                    {part}
                                </Link>
                                {index < pathParts.length - 1 && (
                                    <FiChevronRight className="h-4 w-4 text-gray-500 mx-1" />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            <div className="relative">
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-green-900/50 hover:border-green-400 transition-all duration-200 group"
                    onMouseEnter={() => setIsTooltipVisible(true)}
                    onMouseLeave={() => setIsTooltipVisible(false)}
                    aria-label="Connection status"
                >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse group-hover:animate-none"></div>
                    <span className="text-sm font-medium text-green-400">
                        Connected
                    </span>
                </button>

                {isTooltipVisible && (
                    <div className="absolute right-0 z-50 mt-2 w-80 p-4 rounded-lg shadow-xl bg-slate-800 border border-sky-400 animate-fade-in">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                            </div>
                        ) : error ? (
                            <div className="text-red-400 flex items-center gap-2">
                                <FiServer className="h-5 w-5" />
                                <span>Error: {error}</span>
                            </div>
                        ) : connectionDetails ? (
                            <>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-cyan-400 flex items-center gap-2">
                                        <FiDatabase className="h-5 w-5" />
                                        Database Connection
                                    </h3>
                                    <div className="flex items-center bg-green-900/30 px-2 py-1 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                                        <span className="text-xs text-green-400">
                                            Active
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 text-sm">
                                    {/* Server Info */}
                                    <div className="bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-sky-400 mb-2">
                                            <FiServer className="h-4 w-4" />
                                            <span className="font-medium">
                                                Server Information
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    Host
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        connectionDetails
                                                            .connection.host
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    Version
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        connectionDetails
                                                            .serverInfo.version
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    Uptime
                                                </p>
                                                <p className="text-white">
                                                    {formatUptime(
                                                        connectionDetails
                                                            .serverInfo
                                                            .uptimeInSeconds,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    Charset
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        connectionDetails
                                                            .serverInfo
                                                            .characterSet
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Connection Info */}
                                    <div className="bg-slate-700/50 p-3 rounded-lg">
                                        <div className="flex items-center gap-2 text-sky-400 mb-2">
                                            <FiUser className="h-4 w-4" />
                                            <span className="font-medium">
                                                Connection
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    User
                                                </p>
                                                <p className="text-white">
                                                    {
                                                        connectionDetails
                                                            .connection.user
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs">
                                                    Current DB
                                                </p>
                                                <p className="text-white">
                                                    {dbName || "None"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
