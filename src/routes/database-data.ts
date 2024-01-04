import { Router } from "express";
import * as apiController from "../controllers/database-data";
import { validate } from "../middleware/joiValidate";
import { getTableColumnsValidation } from "../validation/databaseDataValidations";

const router = Router();

/**
 * @openapi
 * /databases:
 *   get:
 *     summary: Retrieve all databases
 *     description: Retrieves a list of all databases in the PostgreSQL instance.
 *     responses:
 *       200:
 *         description: Successfully retrieved all databases.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 databases:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error.
 */
router.get("/databases", apiController.getAllDatabases);

/**
 * @openapi
 * /schemas:
 *   get:
 *     summary: Retrieve all schemas
 *     description: Retrieves a list of all schemas in the current database.
 *     responses:
 *       200:
 *         description: Successfully retrieved all schemas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 schemas:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error.
 */
router.get("/schemas", apiController.getAllSchemas);

/**
 * @openapi
 * /tables:
 *   get:
 *     summary: Retrieve all tables
 *     description: Retrieves a list of all tables in the current database, excluding system tables.
 *     responses:
 *       200:
 *         description: Successfully retrieved all tables.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tables:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Server error.
 */
router.get("/tables", apiController.getAllTables);

/**
 * @openapi
 * /tables/{schemaName}/{tableName}/columns:
 *   get:
 *     summary: Retrieve columns of a table in a specific schema
 *     description: Retrieves a list of all columns from the specified table within a given schema.
 *     parameters:
 *       - in: path
 *         name: schemaName
 *         required: true
 *         description: Name of the schema the table belongs to.
 *         schema:
 *           type: string
 *       - in: path
 *         name: tableName
 *         required: true
 *         description: Name of the table to retrieve columns from.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved all columns from the specified table in the given schema.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 columns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       column_name:
 *                         type: string
 *                       data_type:
 *                         type: string
 *                       is_nullable:
 *                         type: string
 *       400:
 *         description: Schema name and Table name are required.
 *       500:
 *         description: Server error.
 */
router.get(
  "/tables/:schemaName/:tableName/columns",
  validate(getTableColumnsValidation),
  apiController.getTableColumns
);

export default router;
