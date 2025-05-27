import axios from "axios";
import { useEffect, useState } from "react";
import {
    FiDatabase,
    FiLink,
    FiLoader,
    FiServer,
    FiWifi,
    FiWifiOff,
    FiChevronRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const configBackendUrl = import.meta.env.VITE_CONFIG_BACKEND_URL;
const actualBackendUrl = import.meta.env.VITE_ACTUAL_BACKEND_URL;

const STATUS_CONFIG = {
    connecting: {
        label: "CONNECTING TO BACKEND",
        color: "text-amber-400",
        icon: <FiLoader className="animate-spin" />,
        bg: "bg-amber-900/20",
        border: "border-amber-700/50",
    },
    connected: {
        label: "BACKEND CONNECTED",
        color: "text-emerald-400",
        icon: <FiWifi className="text-emerald-400" />,
        bg: "bg-emerald-900/20",
        border: "border-emerald-700/50",
    },
    error: {
        label: "CONNECTION FAILED",
        color: "text-rose-400",
        icon: <FiWifiOff className="text-rose-400" />,
        bg: "bg-rose-900/20",
        border: "border-rose-700/50",
    },
};

const useBackendStatus = () => {
    const [status, setStatus] = useState("connecting");
    const [message, setMessage] = useState("Establishing connection...");
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const checkStatus = async () => {
            if (!isMounted) return;
            setStatus("connecting");
            setError(null);
            try {
                const res = await axios.get("/api/status", { timeout: 4000 });
                if (isMounted) {
                    setStatus("connected");
                    setMessage(
                        res.data.status || "Backend services are online",
                    );
                }
            } catch (err) {
                if (isMounted) {
                    setStatus("error");
                    const errMsg =
                        err.code === "ECONNABORTED"
                            ? "Request timeout - backend unresponsive"
                            : err.response
                            ? `Proxy error: ${err.response.status}`
                            : err.request
                            ? "Network error - backend unreachable"
                            : `Connection error: ${err.message}`;
                    setMessage(errMsg);
                    setError(err.message);
                }
            }
        };

        checkStatus();
        const intervalId = setInterval(checkStatus, 7000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    return { status, message, error };
};

const InfoRow = ({ label, value, valueClass = "" }) => (
    <div className="flex justify-between py-2 border-b border-gray-700/50 last:border-0">
        <span className="text-gray-400/90 text-sm">{label}</span>
        <span className={`font-medium ${valueClass} text-sm`}>{value}</span>
    </div>
);

const UrlDisplay = ({ label, url }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400/80 text-xs">{label}</span>
        <code className="break-all text-xs text-gray-300 bg-gray-800/40 p-2 rounded-lg">
            {url}
        </code>
    </div>
);

const BackendStatusCard = ({ status, message, error }) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <div
            className={`p-5 rounded-xl ${cfg.bg} border ${cfg.border} shadow-sm`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className={`text-2xl ${cfg.color}`}>{cfg.icon}</div>
                <h2 className="text-lg font-semibold">Backend Services</h2>
            </div>
            <div className="space-y-2">
                <InfoRow
                    label="Connection Status"
                    value={cfg.label}
                    valueClass={cfg.color}
                />
                <InfoRow
                    label="System Message"
                    value={message}
                    valueClass="text-gray-300"
                />
            </div>
            {error && (
                <div className="mt-4 p-3 bg-gray-800/40 rounded-lg text-xs text-rose-300 border border-rose-900/30">
                    <div className="font-medium mb-1">Technical Details:</div>
                    <code className="break-all">{error}</code>
                </div>
            )}
        </div>
    );
};

const ConnectionUrls = () => (
    <div className="p-5 bg-gray-800/40 rounded-xl border border-gray-700/50 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <FiServer className="text-blue-400" />
            <h3 className="text-lg font-semibold">Service Endpoints</h3>
        </div>
        <div className="space-y-4">
            <UrlDisplay label="Configuration Service" url={configBackendUrl} />
            <UrlDisplay label="Database Gateway" url={actualBackendUrl} />
        </div>
    </div>
);

const GetStartedSection = () => (
    <div className="flex flex-col justify-center h-full p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 shadow-sm">
        <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/30 rounded-full mb-4 border border-blue-700/30">
                <FiDatabase className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-100">
                Database Manager
            </h2>
            <p className="text-gray-400/90 mb-6 max-w-md mx-auto text-sm leading-relaxed">
                Securely connect to your MySQL databases and manage your data
                through an intuitive graphical interface
            </p>
            <Link
                to="/db-connection"
                replace={true}
                className="inline-flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-850 group"
            >
                <span>Let's Go</span>
                <FiChevronRight className="group-hover:translate-x-1 transition-transform group-hover:animate-ping" />
            </Link>
        </div>
        <span className="text-sm text-center mt-6 text-purple-500 font-sans">Note : Press <b>F11</b> for best experience</span>
    </div>
);

const SetupConnection = () => {
    const { status, message, error } = useBackendStatus();

    return (
        <div className="min-h-screen w-full bg-gray-900 flex place-items-center text-gray-100">
            <div className="container mx-auto px-4 py-12">
                <header className="text-center mb-12 flex flex-col justify-center items-center">
                    <img src="/logo_noBg.png" alt="logo" className="size-40" />
                    <div>
                        <h1 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-500">
                            MySQL Connection Manager
                        </h1>
                        <p className="text-gray-400/80 max-w-lg mx-auto text-sm">
                            Unified interface for managing your database
                            services
                        </p>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto bg-gray-850/80 rounded-xl shadow-lg p-6 border border-gray-700/30 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <BackendStatusCard
                                status={status}
                                message={message}
                                error={error}
                            />
                            <ConnectionUrls />
                        </div>
                        <GetStartedSection />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupConnection;
