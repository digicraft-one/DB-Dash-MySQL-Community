import { useEffect, useState } from "react";
import { FaDatabase, FaLock } from "react-icons/fa";
import { SiMysql } from "react-icons/si";
import { useParams } from "react-router-dom";
import Error from "../../ui/Error";
import Loader from "../../ui/Loader";
import PremiumFeatureModal from "../../ui/PremiumFeatureCard";
import { getDatabaseCode, getTableCode } from "../../utils/api/axios";
import CopyButton from "./CopyButton";

// Custom Button Component
const Button = ({
    title,
    children,
    onClick,
    className = "",
    disabled = false,
    icon: Icon,
    ...props
}) => {
    return (
        <button
            title={title}
            className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                disabled
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
            } text-white ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {Icon && <Icon className="text-lg" />}
            {children}
        </button>
    );
};

const TableCode = ({ tableName, code, hidden, idx, setShowPremiumModal }) => {
    return (
        <div className="group">
            <h3 className="text-xl font-bold text-white tracking-tight mb-2 flex items-center">
                <span className="text-gray-500 mr-2">/</span>
                <span className="text-white">{tableName}</span>
            </h3>
            <div className="relative">
                {hidden && (
                    <div className="absolute bg-white/2 backdrop-blur-xs w-full h-full rounded-lg flex justify-center items-center">
                        <button
                            title="Unlock Code"
                            className="bg-white/10 h-8 w-8 rounded-lg"
                            onClick={() => setShowPremiumModal(true)}
                        >
                            <FaLock className="w-full h-full p-2 text-yellow-500" />
                        </button>
                    </div>
                )}
                <pre className="text-md font-mono bg-gray-900/60 text-gray-300 p-4 rounded-lg overflow-x-auto border border-gray-700 whitespace-pre-wrap shadow-inner">
                    <code>{highlightSQL(code)};</code>
                </pre>
                <CopyButton
                    query={
                        idx < 2
                            ? code
                            : "You can only copy the first 3 tables. Please upgrade to premium to copy the entire code."
                    }
                />
            </div>
        </div>
    );
};

const Code = () => {
    const { dbName, tableName } = useParams();
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const handleGetTableCode = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await getTableCode(dbName, tableName);
            setCode(data.tables);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to export table");
            console.error("Error exporting table:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGetDatabaseCode = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data } = await getDatabaseCode(dbName);
            setCode(data.tables);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to export table");
            console.error("Error exporting table:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleExportClick = (e) => {
        e.stopPropagation();
        setShowPremiumModal(true);
    };

    useEffect(() => {
        if (tableName) handleGetTableCode();
        else handleGetDatabaseCode();
    }, [dbName, tableName]);

    if (loading) return <Loader />;
    if (error) return <Error />;

    return (
        <div className="bg-gray-900/90 p-6 rounded-2xl shadow-lg border border-gray-700/50 flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-b-blue-900/50 pb-4">
                <div className="flex items-center gap-3">
                    <FaDatabase className="text-blue-400/80 text-xl" />
                    <span className="text-blue-300 text-xl font-semibold">
                        {dbName}
                    </span>
                    {tableName && (
                        <>
                            <span className="text-gray-500">/</span>
                            <span className="text-amber-300 text-xl font-semibold">
                                {tableName}
                            </span>
                        </>
                    )}
                </div>
                <Button
                    onClick={handleExportClick}
                    icon={SiMysql}
                    title={"Export entire database into a MySQL file"}
                >
                    Export SQL
                </Button>
            </div>

            <div className="space-y-6">
                {Object.entries(code).map(([tableName, tableCode], idx) => (
                    <TableCode
                        idx={idx}
                        key={tableName}
                        hidden={idx > 2}
                        tableName={tableName}
                        setShowPremiumModal={setShowPremiumModal}
                        code={idx <= 2 ? tableCode : Object.entries(code)[0][1]}
                    />
                ))}
            </div>

            <PremiumFeatureModal
                title="Copy or Download the SQL file containing the code for the database/table"
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />
        </div>
    );
};

export default Code;

const highlightSQL = (code) => {
    if (!code) return null;

    const keywords = new Set([
        "CREATE",
        "TABLE",
        "PRIMARY",
        "KEY",
        "NOT",
        "NULL",
        "DEFAULT",
        "AUTO_INCREMENT",
        "ENGINE",
        "CHARSET",
        "INSERT",
        "INTO",
        "VALUES",
        "DROP",
        "DATABASE",
        "USE",
        "INDEX",
        "FOREIGN",
        "REFERENCES",
        "ON",
        "UPDATE",
        "DELETE",
        "CONSTRAINT",
        "CHECK",
        "SET",
    ]);

    return code.split(/(\s+|[,();])/g).map((token, index) => {
        if (keywords.has(token.toUpperCase())) {
            return (
                <span key={index} className="text-blue-400 font-semibold">
                    {token}
                </span>
            );
        } else if (/^`.*`$/.test(token)) {
            return (
                <span key={index} className="text-pink-400">
                    {token}
                </span>
            );
        } else {
            return token;
        }
    });
};
