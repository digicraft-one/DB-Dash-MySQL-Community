import { useState } from "react";
import {
    FiArrowRight,
    FiCheck,
    FiDatabase,
    FiHash,
    FiLock,
    FiServer,
    FiUser,
    FiX,
    FiLoader,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { connectToDatabase } from "../utils/api/axios.js";

const DBConnectForm = () => {
    const navigate = useNavigate();
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);

    const [dbConfig, setdbConfig] = useState({
        type: "mysql",
        host: "localhost",
        port: "3306",
        user: "root",
        password: "",
        database: "",
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setdbConfig((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsConnecting(true);
        setConnectionStatus(null);

        try {
            const { data } = await connectToDatabase(dbConfig);
            const successMessage =
                data.message || "Connection established successfully";
            setConnectionStatus({ success: true, message: successMessage });

            if (data?.connection?.type === "mysql") {
                navigate("/home", {
                    replace: true,
                    state: { connection: data.connection },
                });
            }
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Connection failed. Please verify your credentials and try again.";
            setConnectionStatus({
                success: false,
                message: errorMessage,
                details: error.response?.data?.details,
            });
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-gray-850/90 rounded-2xl shadow-2xl p-8 space-y-6 border border-gray-700/30 backdrop-blur-sm"
            >
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-900/20 rounded-full mb-3 border border-blue-700/30">
                        <FiDatabase className="text-blue-400" size={24} />
                    </div>
                    <h2 className="text-3xl font-bold text-white bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
                        MySQL Connection
                    </h2>
                    <p className="text-gray-400/90 text-sm">
                        Secure connection to your database server
                    </p>
                </div>

                <div className="space-y-4">
                    {[
                        {
                            icon: <FiServer className="w-5 h-5" />,
                            name: "host",
                            value: dbConfig.host,
                            placeholder: "Server host (e.g., 127.0.0.1)",
                            type: "text",
                        },
                        {
                            icon: <FiHash className="w-5 h-5" />,
                            name: "port",
                            value: dbConfig.port,
                            placeholder: "Port (default: 3306)",
                            type: "number",
                        },
                        {
                            icon: <FiUser className="w-5 h-5" />,
                            name: "user",
                            value: dbConfig.user,
                            placeholder: "Username",
                            type: "text",
                        },
                        {
                            icon: <FiLock className="w-5 h-5" />,
                            name: "password",
                            value: dbConfig.password,
                            placeholder: "Password",
                            type: "password",
                        },
                    ].map((field) => (
                        <div key={field.name} className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                                {field.icon}
                            </div>
                            <input
                                type={field.type}
                                name={field.name}
                                value={field.value}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition text-white placeholder-gray-500/70 text-sm"
                                placeholder={field.placeholder}
                                required={field.name !== "database"}
                            />
                        </div>
                    ))}
                </div>

                {connectionStatus && (
                    <div
                        className={`p-3 rounded-lg border ${
                            connectionStatus.success
                                ? "bg-emerald-900/20 text-emerald-300 border-emerald-800/30"
                                : "bg-rose-900/20 text-rose-300 border-rose-800/30"
                        }`}
                    >
                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                {connectionStatus.success ? (
                                    <FiCheck className="w-4 h-4 text-emerald-400" />
                                ) : (
                                    <FiX className="w-4 h-4 text-rose-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium">
                                    {connectionStatus.message}
                                </p>
                                {!connectionStatus.success &&
                                    connectionStatus.details && (
                                        <p className="text-xs mt-1 opacity-80">
                                            {connectionStatus.details}
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isConnecting}
                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-850 group ${
                        isConnecting
                            ? "opacity-90 cursor-progress"
                            : "hover:shadow-lg hover:shadow-blue-500/20"
                    }`}
                >
                    {isConnecting ? (
                        <>
                            <FiLoader className="animate-spin w-5 h-5" />
                            Establishing Connection...
                        </>
                    ) : (
                        <>
                            Connect to Database
                            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default DBConnectForm;
