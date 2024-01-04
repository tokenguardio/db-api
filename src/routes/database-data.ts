import { Router } from "express";
import * as apiController from "../controllers/database-data";

const router = Router();

router.get("/databases", apiController.getAllDatabases);

router.get("/schemas", apiController.getAllSchemas);

router.get("/tables", apiController.getAllTables);

router.get("/tables/:tableName/columns", apiController.getTableColumns);

export default router;
