import { Router } from "express";
import {
    handleConnectMySQL,
    handleCreateDatabase,
    handleDropDatabase,
    handleGetConnectionDetails,
    handleGetDatabaseCode,
    handleGetDatabaseOverview,
    handleGetDatabaseSchema,
    handleListDatabases,
} from "../controller/db.controller.js";
import tableRouter from "./table.routes.js";

const router = Router();

// router.route("/connect-db").post(handleDBConnection);
router.route("/connect-db").post(handleConnectMySQL);
router.route("/connection-details").get(handleGetConnectionDetails);

router.route("/databases").get(handleListDatabases);
router.post("/create-database", handleCreateDatabase);
router.delete("/drop-database", handleDropDatabase);
router.get("/overview/:dbName", handleGetDatabaseOverview);
router.get("/tables/:dbName", handleGetDatabaseSchema);
router.get("/code/:dbName", handleGetDatabaseCode);
router.use("/table/:dbName/:tableName", tableRouter);

export default router;
