import {
    createTable,
    deleteDataFromTable,
    dropColumnsFromTable,
    dropTable,
    exportTable,
    getTableCode,
    getTableConstraints,
    getTableDetails,
    insertDataIntoTable,
    renameTable,
    truncateTable,
    updateDataInTable,
    viewTableData,
} from "../services/tableOperations.service.js";
import asyncHandler from "../utils/asyncHandler.js";

const handleGetTableDetails = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const result = await getTableDetails(dbName, tableName);
    return res.status(200).json(result);
});

const handleCreateTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { columns } = req.body;
    const results = await createTable(dbName, tableName, columns);
    return res.status(201).json(results);
});

const handleViewTableData = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const result = await viewTableData(dbName, tableName, limit);
    return res.status(200).json(result);
});

const handleDeleteColumns = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { columns } = req.body;
    const result = await dropColumnsFromTable(dbName, tableName, columns);
    return res.status(201).json(result);
});

const handleDropTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const result = await dropTable(dbName, tableName);
    return res.status(200).json(result);
});

const handleExportTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const result = await exportTable(dbName, tableName, limit);
    return res.status(200).json(result);
});

const handleTruncateTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const result = await truncateTable(dbName, tableName);
    return res.status(200).json(result);
});

const handleGetConstraints = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const result = await getTableConstraints(dbName, tableName);
    return res.status(200).json(result);
});

const handleGetTableCode = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const result = await getTableCode(dbName, tableName);
    return res.status(200).json(result);
});

const handleInsertDataIntoTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { data } = req.body;
    const result = await insertDataIntoTable(dbName, tableName, data);
    return res.status(201).json(result);
});

const handleUpdateDataInTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { data, conditions } = req.body;
    const result = await updateDataInTable(dbName, tableName, data, conditions);
    return res.status(200).json(result);
});

const handleDeleteDataFromTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { conditions } = req.body;
    const result = await deleteDataFromTable(dbName, tableName, conditions);
    return res.status(200).json(result);
});

const handleRenameTable = asyncHandler(async (req, res) => {
    const { dbName, tableName } = req.params;
    const { newTableName } = req.body;
    const result = await renameTable(dbName, tableName, newTableName);
    return res.status(200).json(result);
});

export {
    handleCreateTable,
    handleDeleteColumns,
    handleDeleteDataFromTable,
    handleDropTable,
    handleExportTable,
    handleGetConstraints,
    handleGetTableCode,
    handleGetTableDetails,
    handleInsertDataIntoTable,
    handleRenameTable,
    handleTruncateTable,
    handleUpdateDataInTable,
    handleViewTableData,
};
