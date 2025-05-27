import { Router } from "express";
import {
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
    handleViewTableData
} from "../controller/table.controller.js";

const router = Router({ mergeParams: true });

router.get("/details", handleGetTableDetails);
router.post("/create", handleCreateTable);
router.get("/data", handleViewTableData);

router.get("/code", handleGetTableCode);
router.patch("/delete-columns", handleDeleteColumns);
router
    .route("/constraints")
    .get(handleGetConstraints)

router.delete("/drop", handleDropTable);
router.put("/rename", handleRenameTable);
router.get("/export", handleExportTable);
router.delete("/truncate", handleTruncateTable);

router
    .route("/data-manipulate")
    .post(handleInsertDataIntoTable)
    .patch(handleUpdateDataInTable)
    .delete(handleDeleteDataFromTable);


export default router;
