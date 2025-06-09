import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_ACTUAL_BACKEND_URL,
    // withCredentials: "true",
});

const connectToDatabase = (dbConfig) => {
    return api.post("/db/connect-db", { ...dbConfig });
};

const getConnectionDetails = () => {
    return api.get("/db/connection-details");
};

const getAllDatabases = () => {
    return api.get("/db/databases");
};

const createDatabase = (dbName) => {
    return api.post("/db/create-database", { name: dbName });
};

const dropDatabase = (dbName) => {
    return api.delete("/db/drop-database", { data: { name: dbName } });
};

const getTables = (dbName) => {
    return api.get(`/db/tables/${encodeURIComponent(dbName)}`);
};

const createTable = (dbName, tableName, columns) => {
    return api.post(
        `db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/create`,
        { columns },
    );
};

const dropColumns = (dbName, tableName, columns) => {
    return api.patch(
        `db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/delete-columns`,
        { columns },
    );
};

const dropTable = (dbName, tableName) => {
    return api.delete(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/drop`,
    );
};
const renameTable = (dbName, tableName, newTableName) => {
    return api.put(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/rename`,
        {
            newTableName,
        },
    );
};

const getDatabaseDetails = (dbName) => {
    return api.get(`/db/overview/${encodeURIComponent(dbName)}`);
};

const getTableDetails = (dbName, tableName) => {
    return api.get(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/details`,
    );
};

const getTableData = (dbName, tableName, limit) => {
    return api.get(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/data`,
        {
            params: { limit },
        },
    );
};

const truncateTable = (dbName, tableName) => {
    return api.delete(
        `db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/truncate`,
    );
};

const exportTable = (dbName, tableName, rowLimit) => {
    return api.get(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/export`,
        {
            params: { limit: rowLimit },
        },
    );
};

const getConstraints = (dbName, tableName) => {
    return api.get(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/constraints`,
    );
};

const getDatabaseCode = (dbName) => {
    return api.get(`/db/code/${encodeURIComponent(dbName)}`);
};

const getTableCode = (dbName, tableName) => {
    return api.get(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/code`,
    );
};

const insertRow = (dbName, tableName, data) => {
    return api.post(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/data-manipulate`,
        { data },
    );
};

const updateRow = (dbName, tableName, data, conditions) => {
    return api.patch(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/data-manipulate`,
        { conditions, data },
    );
};

const deleteRow = (dbName, tableName, data) => {
    return api.delete(
        `/db/table/${encodeURIComponent(dbName)}/${encodeURIComponent(
            tableName,
        )}/data-manipulate`,
        {
            data: {
                conditions: data,
            },
        },
    );
};

const getUsers = () => {
    return api.get("/users/");
};

const getPrivileges = (user, host) => {
    return api.get(`/users/privileges`, {
        params: {
            user,
            host,
        },
    });
};

export {
    connectToDatabase,
    createDatabase,
    createTable,
    deleteRow,
    dropColumns,
    dropDatabase,
    dropTable,
    exportTable,
    getAllDatabases,
    getConnectionDetails,
    getConstraints,
    getDatabaseCode,
    getDatabaseDetails,
    getPrivileges,
    getTableCode,
    getTableData,
    getTableDetails,
    getTables,
    getUsers,
    insertRow,
    renameTable,
    truncateTable,
    updateRow,
};
