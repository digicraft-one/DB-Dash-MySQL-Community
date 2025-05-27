import { connectMySQL } from "../services/dbConnection.service.js";
import {
    createDatabase,
    dropDatabase,
    getConnectionDetails,
    getDatabaseCode,
    getDatabaseOverview,
    getDatabaseSchema,
    listMySQLDatabases,
} from "../services/dbOperations.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const handleConnectMySQL = asyncHandler(async (req, res) => {
    const { host, port, user, password } = req.body;
    const result = await connectMySQL(host, port, user, password);
    return res.status(200).json(result);
});

const handleGetConnectionDetails = asyncHandler(async (req, res) => {
    const details = await getConnectionDetails();
    res.status(200).json(details);
});

const handleListDatabases = asyncHandler(async (req, res) => {
    const result = await listMySQLDatabases();
    return res.status(200).json(result);
});

const handleCreateDatabase = asyncHandler(async (req, res) => {
    const { name } = req.body;

    const result = await createDatabase(name);
    res.status(201).json(result);
});

const handleDropDatabase = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const result = await dropDatabase(name);
    res.status(201).json(result);
});

const handleGetDatabaseOverview = asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const overview = await getDatabaseOverview(dbName);
    res.status(200).json(overview);
});

const handleGetDatabaseSchema = asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const schema = await getDatabaseSchema(dbName);
    res.status(200).json(schema);
});

const handleGetDatabaseCode = asyncHandler(async (req, res) => {
    const { dbName } = req.params;
    const codes = await getDatabaseCode(dbName);
    res.status(200).json(codes);
});

export {
    handleConnectMySQL,
    handleCreateDatabase,
    handleDropDatabase,
    handleGetConnectionDetails,
    handleGetDatabaseCode,
    handleGetDatabaseOverview,
    handleGetDatabaseSchema,
    handleListDatabases,
};
