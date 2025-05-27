/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import {
    FiCheck,
    FiDatabase,
    FiEye,
    FiKey,
    FiLock,
    FiShield,
    FiTrash2,
    FiUnlock,
    FiUserCheck,
    FiUserPlus,
    FiX,
} from "react-icons/fi";
import Error from "../ui/Error";
import Loader from "../ui/Loader";
import PremiumFeatureModal from "../ui/PremiumFeatureCard";
import { getPrivileges, getUsers } from "../utils/api/axios";
import RefreshButton from "./common/RefreshButton";

const UserPrivileges = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [selectedUser, setSelectedUser] = useState(null);
    const [userGrants, setUserGrants] = useState([]);
    const [privileges, setPrivileges] = useState({
        dbName: "*",
        tableName: "*",
        selectedPrivileges: [],
    });

    const [showGrantsModal, setShowGrantsModal] = useState(false);
    const [showPrivilegesModal, setShowPrivilegesModal] = useState(false);
    const [actionType, setActionType] = useState("grant");
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const [deleteModal, setDeleteModal] = useState({
        visible: false,
        loading: false,
        user: null,
        host: null,
    });

    const privilegeOptions = [
        "SELECT",
        "INSERT",
        "UPDATE",
        "DELETE",
        "CREATE",
        "ALTER",
        "DROP",
        "INDEX",
        "REFERENCES",
        "CREATE TEMPORARY TABLES",
        "LOCK TABLES",
        "EXECUTE",
        "CREATE VIEW",
        "SHOW VIEW",
        "CREATE ROUTINE",
        "ALTER ROUTINE",
        "EVENT",
        "TRIGGER",
        "ALL PRIVILEGES",
    ];

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await getUsers();
            setUsers(data.users || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserGrants = async (user, host) => {
        try {
            const { data } = await getPrivileges(user, host);
            setUserGrants(data.grants || []);

            const currentPrivileges = extractPrivilegesFromGrants(
                data.grants || [],
            );
            setPrivileges((prev) => ({
                ...prev,
                selectedPrivileges: currentPrivileges,
            }));
        } catch (err) {
            setError(err.message);
        }
    };

    const extractPrivilegesFromGrants = (grants) => {
        const privileges = new Set();

        grants.forEach((grant) => {
            if (!grant.includes("GRANT") || grant.includes("USAGE")) return;

            const privilegesPart = grant
                .split("GRANT")[1]
                .split("ON")[0]
                .trim();

            if (privilegesPart.includes("ALL PRIVILEGES")) {
                privilegeOptions.forEach((opt) => {
                    if (opt !== "ALL PRIVILEGES") {
                        privileges.add(opt);
                    }
                });
                return;
            }

            privilegesPart.split(",").forEach((p) => {
                const cleanPriv = p.trim().replace(/`/g, "");
                if (privilegeOptions.includes(cleanPriv)) {
                    privileges.add(cleanPriv);
                }
            });
        });

        return Array.from(privileges);
    };

    const handlePrivilegeChange = (privilege) => {
        setPrivileges((prev) => {
            if (prev.selectedPrivileges.includes(privilege)) {
                return {
                    ...prev,
                    selectedPrivileges: prev.selectedPrivileges.filter(
                        (p) => p !== privilege,
                    ),
                };
            } else {
                return {
                    ...prev,
                    selectedPrivileges: [...prev.selectedPrivileges, privilege],
                };
            }
        });
    };

    const handlePrivilegeAction = async () => {
        if (!selectedUser) return;
        setShowPremiumModal(true);
    };

    const parseGrantStatement = (grant) => {
        if (!grant.includes("GRANT")) return grant;

        try {
            const parts = grant.split("GRANT")[1].split("ON");
            const privilegesPart = parts[0].trim();
            const rest = parts[1].trim();

            const scopeParts = rest.split("TO")[0].trim().split(".");
            const db = scopeParts[0].replace(/`/g, "");
            const table =
                scopeParts.length > 1 ? scopeParts[1].replace(/`/g, "") : "*";

            return {
                privileges: privilegesPart,
                database: db,
                table: table,
                raw: grant,
            };
        } catch (e) {
            return {
                raw: grant,
            };
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300">
                        <FiUserCheck className="text-2xl text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white hover:text-blue-100 transition-colors duration-300">
                            User Management
                        </h1>
                        <p className="text-gray-400 flex items-center gap-1 hover:text-blue-300 transition-colors duration-300">
                            Manage database users and privileges
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <RefreshButton
                        loading={loading}
                        action={fetchUsers}
                        title={"Refresh Users"}
                    />
                    <button
                        title="Refresh MySQL user permissions"
                        onClick={() => setShowPremiumModal(true)}
                        className="flex mt-2 items-center h-12 justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-medium rounded-md transition-all duration-300 shadow-md hover:scale-[1.02]"
                    >
                        <FiLock />
                        Flush Privileges
                    </button>
                    <button
                        title={loading ? "Loading..." : "Add New User"}
                        onClick={() => setShowPremiumModal(true)}
                        className="flex mt-2 items-center h-12 justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white text-sm font-medium rounded-md transition-all duration-300 shadow-md hover:scale-[1.02]"
                    >
                        <FiUserPlus />
                        Create User
                    </button>
                </div>
            </div>

            {error && <Error error={error} />}

            {loading && <Loader />}

            {!loading && (
                <div className="group bg-gradient-to-br from-gray-800/40 to-gray-800/20 rounded-xl border border-gray-700/50 p-6 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors duration-300">
                            <FiDatabase className="text-xl text-blue-400 group-hover:text-blue-300 transition-colors duration-300" />
                        </div>
                        <h2 className="text-xl font-semibold text-white group-hover:text-blue-100 transition-colors duration-300">
                            Database Users
                        </h2>
                    </div>

                    <div className="overflow-x-auto text-center">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-300">
                                    {["Username", "Host", "Actions"].map(
                                        (title, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider"
                                            >
                                                {title}
                                            </th>
                                        ),
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {users.length > 0 ? (
                                    users.map((user, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-800/30 transition-colors duration-200"
                                        >
                                            {[user.user, user.host].map(
                                                (el, idx) => (
                                                    <td
                                                        key={idx}
                                                        className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white"
                                                    >
                                                        {el}
                                                    </td>
                                                ),
                                            )}
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400 flex justify-center items-center">
                                                <div className="flex gap-10">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(
                                                                user,
                                                            );
                                                            fetchUserGrants(
                                                                user.user,
                                                                user.host,
                                                            );
                                                            setShowGrantsModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="p-2 rounded-md bg-blue-900/20 border border-blue-700/50 text-blue-400 hover:bg-blue-900/30 hover:border-blue-500/50 hover:text-blue-300 transition-all duration-200"
                                                        title="View Grants"
                                                    >
                                                        <FiEye />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(
                                                                user,
                                                            );
                                                            setActionType(
                                                                "grant",
                                                            );
                                                            setShowPrivilegesModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="p-2 rounded-md bg-purple-900/20 border border-purple-700/50 text-purple-400 hover:bg-purple-900/30 hover:border-purple-500/50 hover:text-purple-300 transition-all duration-200"
                                                        title="Grant Privileges"
                                                    >
                                                        <FiLock />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedUser(
                                                                user,
                                                            );
                                                            setActionType(
                                                                "revoke",
                                                            );
                                                            setShowPrivilegesModal(
                                                                true,
                                                            );
                                                        }}
                                                        className="p-2 rounded-md bg-yellow-900/20 border border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/30 hover:border-yellow-500/50 hover:text-yellow-300 transition-all duration-200"
                                                        title="Revoke Privileges"
                                                    >
                                                        <FiUnlock />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteModal({
                                                                visible: true,
                                                                loading: false,
                                                                user: user.user,
                                                                host: user.host,
                                                            });
                                                        }}
                                                        className="p-2 rounded-lg bg-red-900/20 border border-red-700/50 text-red-400 hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-300 transition-all duration-200"
                                                        title="Delete User"
                                                    >
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-4 py-8 text-center text-gray-400"
                                        >
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {deleteModal.visible && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm backdrop-brightness-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 shadow-2xl animate-scaleIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <FaExclamationTriangle className="text-red-400" />
                                Confirm User Deletion
                            </h3>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/50 p-4 rounded-lg mb-4">
                                <FaExclamationTriangle className="text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-gray-300">
                                        You are about to permanently delete user
                                        : {"  "}
                                        <b>{deleteModal.user}</b>
                                    </p>
                                    <p className="text-red-400 text-sm">
                                        This action cannot be undone and will
                                        revoke all privileges.
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Type{" "}
                                <span className="font-mono bg-gray-900/50 px-2 py-1 rounded text-red-300">
                                    delete user {deleteModal.user}
                                </span>{" "}
                                to confirm
                            </p>
                            <input
                                type="text"
                                className="w-full mt-3 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-white placeholder-gray-400 font-mono text-sm"
                                placeholder={`Type "delete user ${deleteModal.user}"`}
                                autoFocus
                                onChange={(e) =>
                                    setDeleteModal((prev) => ({
                                        ...prev,
                                        confirmationText: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() =>
                                    setDeleteModal({
                                        visible: false,
                                        loading: false,
                                        user: null,
                                        host: null,
                                    })
                                }
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                                disabled={deleteModal.loading}
                            >
                                <FiX />
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowPremiumModal(true)}
                                disabled={
                                    deleteModal.loading ||
                                    deleteModal.confirmationText !==
                                        `delete user ${deleteModal.user}`
                                }
                                className={`px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-70 shadow-md hover:scale-[1.02] hover:shadow-lg`}
                            >
                                {deleteModal.loading ? (
                                    <Loader size="small" />
                                ) : (
                                    <>
                                        <FiTrash2 className="transition-transform group-hover:scale-110" />
                                        Delete User
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grants Modal */}
            {showGrantsModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm backdrop-brightness-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/70 shadow-2xl w-full max-w-4xl overflow-hidden animate-slideUp">
                        <div className="bg-gray-800/80 border-b border-gray-700/50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                                        <FiShield className="text-xl text-purple-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        Privileges for {selectedUser.user}@
                                        {selectedUser.host}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowGrantsModal(false)}
                                    className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700/50"
                                >
                                    <FiX className="text-lg" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-700/30 rounded-xl border border-gray-600/50 max-h-[60vh] overflow-y-auto">
                                {userGrants.length > 0 ? (
                                    <table className="w-full">
                                        <thead className="sticky top-0 bg-gray-800 z-10">
                                            <tr className="border-b border-gray-700/50">
                                                {[
                                                    "Privileges",
                                                    "Database",
                                                    "Table",
                                                ].map((title, idx) => (
                                                    <th
                                                        key={idx}
                                                        className="px-5 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                                                    >
                                                        {title}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {userGrants.map((grant, index) => {
                                                const parsed =
                                                    parseGrantStatement(grant);
                                                return (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-gray-700/50 transition-colors duration-150"
                                                    >
                                                        {[
                                                            parsed.privileges ||
                                                                "USAGE",
                                                            parsed.database ||
                                                                "*",
                                                            parsed.table || "*",
                                                        ].map((el, idx) => (
                                                            <td
                                                                key={idx}
                                                                className="px-5 py-4 whitespace-normal text-sm font-medium text-blue-300"
                                                            >
                                                                {el}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-gray-400">
                                        <FiDatabase className="mx-auto text-3xl mb-3 opacity-50" />
                                        No privileges granted to this user
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Privileges Modal */}
            {showPrivilegesModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm backdrop-brightness-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700/70 shadow-2xl w-full max-w-3xl overflow-hidden animate-slideUp">
                        <div className="bg-gray-800/80 border-b border-gray-700/50 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`p-2 rounded-lg ${
                                            actionType === "grant"
                                                ? "bg-blue-500/20 border-blue-500/30"
                                                : "bg-red-500/20 border-red-500/30"
                                        } border`}
                                    >
                                        <FiKey
                                            className={`text-xl ${
                                                actionType === "grant"
                                                    ? "text-blue-400"
                                                    : "text-red-400"
                                            }`}
                                        />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        {actionType === "grant"
                                            ? "Grant"
                                            : "Revoke"}{" "}
                                        Privileges
                                    </h2>
                                </div>
                                <button
                                    onClick={() =>
                                        setShowPrivilegesModal(false)
                                    }
                                    className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-gray-700/50"
                                >
                                    <FiX className="text-lg" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Database Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white transition-all duration-200"
                                        value={privileges.dbName}
                                        onChange={(e) =>
                                            setPrivileges({
                                                ...privileges,
                                                dbName: e.target.value,
                                            })
                                        }
                                        placeholder="* for all databases"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-300 mb-1">
                                        Table Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white transition-all duration-200"
                                        value={privileges.tableName}
                                        onChange={(e) =>
                                            setPrivileges({
                                                ...privileges,
                                                tableName: e.target.value,
                                            })
                                        }
                                        placeholder="* for all tables"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Select Privileges
                                    </label>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-700/50 text-gray-300">
                                        {privileges.selectedPrivileges.length}{" "}
                                        selected
                                    </span>
                                </div>
                                <div className="bg-gray-700/30 p-4 rounded-xl border border-gray-600/50 max-h-64 overflow-y-auto">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {privilegeOptions.map((priv) => {
                                            const isSelected =
                                                privileges.selectedPrivileges.includes(
                                                    priv,
                                                );
                                            return (
                                                <div
                                                    key={priv}
                                                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 flex items-center gap-3 ${
                                                        isSelected
                                                            ? actionType ===
                                                              "grant"
                                                                ? "bg-blue-900/20 border-blue-700/50 text-blue-100 shadow-blue-500/10"
                                                                : "bg-red-900/20 border-red-700/50 text-red-100 shadow-red-500/10"
                                                            : "bg-gray-700/10 border-gray-600/50 text-gray-300 hover:bg-gray-700/30 hover:border-gray-500/50"
                                                    }`}
                                                    onClick={() =>
                                                        handlePrivilegeChange(
                                                            priv,
                                                        )
                                                    }
                                                >
                                                    <div
                                                        className={`p-1 rounded ${
                                                            isSelected
                                                                ? actionType ===
                                                                  "grant"
                                                                    ? "bg-blue-800/50 text-blue-300"
                                                                    : "bg-red-800/50 text-red-300"
                                                                : "bg-gray-700/50"
                                                        }`}
                                                    >
                                                        {isSelected ? (
                                                            <FiCheck />
                                                        ) : (
                                                            <div className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm">
                                                        {priv}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 border-t border-gray-700/50 p-6">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-400">
                                    Current scope:{" "}
                                    <span className="font-mono text-gray-300">
                                        {privileges.dbName}.
                                        {privileges.tableName}
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() =>
                                            setShowPrivilegesModal(false)
                                        }
                                        className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePrivilegeAction}
                                        className={`px-5 py-2.5 rounded-xl text-white transition-all duration-200 flex items-center gap-2 ${
                                            actionType === "grant"
                                                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                                                : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/20"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <FiKey />
                                        {actionType === "grant"
                                            ? "Grant Privileges"
                                            : "Revoke Privileges"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PremiumFeatureModal
                title="Create, delete and manage all users privileges"
                isOpen={showPremiumModal}
                onClose={() => setShowPremiumModal(false)}
            />
        </div>
    );
};

export default UserPrivileges;
