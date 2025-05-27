import { useEffect } from "react";
import { FiAlertTriangle, FiArrowLeft, FiHome } from "react-icons/fi";
import { GiAlienBug } from "react-icons/gi";
import { RiBug2Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";

const Error404 = () => {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "404 | SQL Dashboard";
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-850 to-gray-800 p-4 overflow-hidden">
            {/* Main card */}
            <div className="relative bg-gray-850 w-full max-w-5xl rounded-2xl shadow-2xl p-8 border border-gray-700/50 backdrop-blur-sm z-10 transform transition-all duration-500 hover:shadow-blue-500/10">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                    {/* Left Side - 404 Animation */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-900/20 rounded-full blur-xl opacity-30 -z-10 animate-pulse" />
                            <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
                                404
                            </h1>
                        </div>
                        <div className="mt-6 relative group">
                            <GiAlienBug
                                className={`text-5xl text-green-400 transform transition-all duration-300`}
                            />
                        </div>
                    </div>

                    {/* Right Side - Error Message & Actions */}
                    <div className="flex-1 space-y-6">
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">
                            Query Failed: Page Not Found
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-1 text-red-400">
                                        <RiBug2Line className="text-xl" />
                                    </div>
                                    <div>
                                        <div className="font-mono text-sm text-yellow-300 flex items-center gap-2">
                                            <FiAlertTriangle />
                                            <span>
                                                SQLException: 404_NOT_FOUND
                                            </span>
                                        </div>
                                        <div className="mt-2 text-gray-300 text-sm">
                                            <p>No rows returned from:</p>
                                            <code className="block mt-1 px-3 py-2 bg-gray-900/50 rounded text-blue-300">
                                                SELECT * FROM pages WHERE url =
                                                '{window.location.pathname}'
                                            </code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-gray-300 text-sm">
                                    <strong>Possible causes:</strong>
                                </p>
                                <ul className="list-disc pl-5 space-y-2 text-gray-400 text-sm">
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>
                                            Missing{" "}
                                            <code className="bg-gray-800 px-1 rounded">
                                                JOIN
                                            </code>{" "}
                                            statement between your brain and
                                            reality
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>
                                            <code className="bg-gray-800 px-1 rounded">
                                                WHERE
                                            </code>{" "}
                                            clause too restrictive (try drinking
                                            coffee)
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span>•</span>
                                        <span>
                                            Database administrator was abducted{" "}
                                            <GiAlienBug className="inline text-green-400 ml-1" />
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                title="Go back to previous page"
                                onClick={() => navigate(-1)}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 border border-gray-600 hover:border-gray-500 text-sm hover:shadow-md"
                            >
                                <FiArrowLeft className="transition-transform group-hover:-translate-x-1" />
                                <span>ROLLBACK</span>
                            </button>
                            <button
                                title="Go back to home page"
                                onClick={() => navigate("/")}
                                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm group"
                            >
                                <FiHome className="transition-transform group-hover:scale-110" />
                                <span>COMMIT TO HOME</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Error404;
