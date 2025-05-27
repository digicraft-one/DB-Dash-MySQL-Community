import { useEffect, useState } from "react";
import { FaColumns, FaLink, FaDatabase, FaTable } from "react-icons/fa";
import { useParams } from "react-router-dom";
import Error from "../../ui/Error";
import Loader from "../../ui/Loader";
import { getConstraints, getTableDetails } from "../../utils/api/axios";
import AddColumnsTab from "./AddColumnsTab";
import ConstraintsTab from "./ConstraintsTab";
import PremiumFeatureModal from "../../ui/PremiumFeatureCard";

const TableEdit = () => {
    const { dbName, tableName } = useParams();
    const [activeTab, setActiveTab] = useState("columns");
    const [tableDetails, setTableDetails] = useState(null);
    const [constraints, setConstraints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [detailsRes, constraintsRes] = await Promise.all([
                    getTableDetails(dbName, tableName),
                    getConstraints(dbName, tableName),
                ]);
                setTableDetails(detailsRes.data);
                setConstraints(constraintsRes.data.constraints);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dbName, tableName]);

    if (loading) return <Loader className="min-h-[400px]" />;
    if (error) return <Error message={error} className="mt-8" />;

    return (
        <>
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-scroll">
                {/* Header and tabs */}
                <div className="sticky top-0 z-20 p-6 border-b border-gray-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-900/90 backdrop-blur-lg gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-blue-900/30 border border-blue-700/50">
                            <FaTable className="text-blue-400 text-xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {tableName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{dbName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
                        <button
                            className={`px-4 py-2 font-medium flex items-center gap-2 rounded-md transition-all ${
                                activeTab === "columns"
                                    ? "bg-gray-700/50 text-blue-400 shadow-inner"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/30"
                            }`}
                            onClick={() => setActiveTab("columns")}
                        >
                            <FaColumns className="text-sm" />
                            <span>Columns</span>
                        </button>
                        <button
                            className={`px-4 py-2 font-medium flex items-center gap-2 rounded-md transition-all ${
                                activeTab === "constraints"
                                    ? "bg-gray-700/50 text-purple-400 shadow-inner"
                                    : "text-gray-400 hover:text-white hover:bg-gray-700/30"
                            }`}
                            onClick={() => setActiveTab("constraints")}
                        >
                            <FaLink className="text-sm" />
                            <span>Constraints</span>
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {activeTab === "columns" ? (
                        <AddColumnsTab
                            dbName={dbName}
                            tableName={tableName}
                            columns={tableDetails.columns}
                            setShowPremiumModal={setShowPremiumModal}
                        />
                    ) : (
                        <ConstraintsTab
                            dbName={dbName}
                            tableName={tableName}
                            columns={tableDetails.columns}
                            constraints={constraints}
                            setConstraints={setConstraints}
                            setShowPremiumModal={setShowPremiumModal}
                        />
                    )}
                </div>
            </div>
            <PremiumFeatureModal
                title="Add and delete columns and constraints for the given table"
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />
        </>
    );
};

export default TableEdit;
