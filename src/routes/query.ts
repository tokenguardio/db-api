import { Router } from "express";
import * as apiController from "../controllers/query";
import { validate } from "../middleware/joiValidate";
import {
  saveQueryValidation,
  executeQueryValidation,
  getQueryByIdValidation,
} from "../validation/queryValidations";

const router = Router();

/**
 * @openapi
 * /save-query:
 *   post:
 *     summary: Save a SQL query
 *     description: |
 *                   Saves a SQL query along with its parameters for later execution. This endpoint is useful for storing queries that can be dynamically executed with different parameters. The query must be a base64 encoded string. For example, the following SQL query:
 *                   ```
 *                   WITH onchain_developers AS (select *, 'WASM' as contract_type from stg.wasm_contracts_creations
 *                   union all
 *                   select *, 'EVM' as contract_type from stg.evm_contracts_creations) SELECT (DATE( date_trunc('week', onchain_developers."date_of_record")::date)) AS "onchain_developers.dynamic_timeframe",
 *                   COUNT(DISTINCT onchain_developers."deployer")  AS "onchain_developers.unique_developers"
 *                   FROM onchain_developers
 *                   WHERE (onchain_developers."contract_type" ) IN (?, ?) AND ((( onchain_developers."date_of_record"  ) >= ((SELECT (DATE_TRUNC('day', CURRENT_TIMESTAMP) + (-89 || ' day')::INTERVAL))) AND ( onchain_developers."date_of_record"  ) < ((SELECT ((DATE_TRUNC('day', CURRENT_TIMESTAMP) + (-89 || ' day')::INTERVAL) + (90 || ' day')::INTERVAL)))))
 *                   GROUP BY 1
 *                   ORDER BY 1
 *                   FETCH NEXT 500 ROWS ONLY
 *                   ```
 *                   is encoded as the base64 string provided in the example. You can see two '?' parameters that can be filled later.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, databases, label, parameters]
 *             properties:
 *               query:
 *                 type: string
 *                 description: The base64 encoded SQL query string to be saved.
 *                 example: "Encoded SQL query string"
 *               databases:
 *                 oneOf:
 *                   - type: string
 *                     description: The name of a single database where the query will be executed.
 *                     example: "crosschain"
 *                   - type: array
 *                     description: An array of database names where the query can be executed.
 *                     items:
 *                       type: string
 *                     example: ["crosschain", "mainchain"]
 *               label:
 *                 type: string
 *                 description: A label to identify the query.
 *                 example: "crm"
 *               parameters:
 *                 type: object
 *                 description: An object containing the parameters for the query.
 *                 properties:
 *                   values:
 *                     type: array
 *                     description: An array of value parameters associated with the query.
 *                     items:
 *                       type: object
 *                       required: [name, type]
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: The name of the parameter.
 *                           example: "chain"
 *                         type:
 *                           type: string
 *                           description: The data type of the parameter.
 *                           example: "string"
 *               description:
 *                 type: string
 *                 description: Optional descriptive text for the query.
 *                 example: "This query retrieves user interaction data filtered by chain and dapp name."
 *             example:
 *               query: "CiAgICBTRUxFQ1QgCiAgICAgICAgZHVhLmRhcHBfbmFtZSwKICAgICAgICBkdWEudXNlciwKICAgICAgICBkdWEuZmlyc3RfaW50ZXJhY3Rpb25fZGF0ZSBBUyBkYXRlX2pvaW5lZCwKICAgICAgICBkdWEubGFzdF9pbnRlcmFjdGlvbl9kYXRlLAogICAgICAgIGR1YS50cmFuc2ZlcnJlZF90b2tlbnMgQVMgZGVwb3NpdHMsCiAgICAgICAgZHVhLm90aGVyX2RhcHBzX3VzZWQKICAgIEZST00gZ3Jvd3RoX2luZGV4LmNybV9kYXBwX3VzZXJzX2FjdGl2aXR5IGR1YQogICAgV0hFUkUgQ09BTEVTQ0UoZHVhLmNoYWluLCAnJykgPSA6Y2hhaW4KICAgICAgICBBTkQgQ09BTEVTQ0UoZHVhLmRhcHBfbmFtZSwgJycpID0gOmRhcHBfbmFtZQo="
 *               databases: ["crosschain", "mainchain"]
 *               label: "crm"
 *               parameters:
 *                 values:
 *                   - name: "chain"
 *                     type: "string"
 *                   - name: "dapp_name"
 *                     type: "string"
 *               description: "This query retrieves user interaction data filtered by chain and dapp name."
 *     responses:
 *       201:
 *         description: Query saved successfully. Returns the ID of the saved query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                 message:
 *                   type: string
 *                   example: "Query saved successfully"
 *       400:
 *         description: Invalid request body. This can occur if the query string or parameters are not properly provided, or the database name(s) are not available.
 *       500:
 *         description: Server error or error executing the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error occurred while saving the query"
 */
router.post(
  "/save-query",
  validate(saveQueryValidation),
  apiController.saveQuery
);

/**
 * @openapi
 * /execute-query:
 *   post:
 *     summary: Execute a Saved SQL Query
 *     description: Executes a previously saved SQL query with the provided parameters and optional database choice. This endpoint is useful for running dynamic queries with different parameters on demand. If multiple databases are available and none is specified, an error will be returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, parameters]
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The unique identifier of the saved query to execute.
 *                 example: 2
 *               parameters:
 *                 type: object
 *                 description: An object containing arrays of value and identifier parameters to execute the saved query with.
 *                 properties:
 *                   values:
 *                     type: array
 *                     description: An array of value parameters, each with a name and value.
 *                     items:
 *                       type: object
 *                       required: [name, value]
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "contractType1"
 *                         value:
 *                           type: string
 *                           example: "EVM"
 *                   identifiers:
 *                     type: array
 *                     description: An array of identifier parameters, each with a name and value.
 *                     items:
 *                       type: object
 *                       required: [name, value]
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "dateRange"
 *                         value:
 *                           type: string
 *                           example: "2021-Q1"
 *               database:
 *                 type: string
 *                 description: Optional database selection where the query should be executed. If not specified, and multiple databases are available, an error will be returned requesting selection.
 *                 example: "main_db"
 *             example:
 *               id: 1
 *               parameters:
 *                 values:
 *                   - name: "contractType1"
 *                     value: "EVM"
 *                 identifiers:
 *                   - name: "dateRange"
 *                     value: "2021-Q1"
 *               database: "main_db"
 *     responses:
 *       200:
 *         description: Query executed successfully. Returns the results of the query execution.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *                   example: [{ "a": 1, "b": 2 }, { "a": 3, "b": 4 }]
 *                 message:
 *                   type: string
 *                   example: "Query executed"
 *       400:
 *         description: Invalid request body, parameters, or database selection. This can occur if the ID, parameters, or database are not properly provided.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid request body or incorrect parameters/database"
 *       404:
 *         description: Query not found. Occurs when there is no saved query with the provided ID.
 *       500:
 *         description: Server error or error executing the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error occurred executing the query"
 */
router.post(
  "/execute-query",
  validate(executeQueryValidation),
  apiController.executeQuery
);

/**
 * @openapi
 * /query/{id}:
 *   get:
 *     summary: Retrieve a Saved SQL Query
 *     description: Retrieves the details of a previously saved SQL query using its unique identifier.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique identifier of the saved query to retrieve.
 *     responses:
 *       200:
 *         description: Query retrieved successfully. Returns the details of the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: The unique identifier of the query.
 *                       example: 212
 *                     query:
 *                       type: string
 *                       description: The SQL query string.
 *                       example: "SELECT * FROM :tableName: WHERE :columnName: = :ticker1 OR :columnName: = :ticker2 OR :columnName: = :ticker2 OR :columnName: IN (:tickers) OR :columnName: IN (:tickers)"
 *                     parameters:
 *                       type: object
 *                       properties:
 *                         identifiers:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["tableName", "columnName"]
 *                         values:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                               type:
 *                                 type: string
 *                           example: [
 *                             { "name": "ticker1", "type": "string" },
 *                             { "name": "ticker2", "type": "string" },
 *                             { "name": "tickers", "type": "string[]" }
 *                           ]
 *                     database:
 *                       type: string
 *                       description: The name of the database where the query will be executed.
 *                       example: "crosschain"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-05T11:23:06.484Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-02-05T11:23:06.484Z"
 *                     label:
 *                       type: string
 *                       example: "growth_index"
 *                 message:
 *                   type: string
 *                   example: "Query retrieved successfully"
 *       400:
 *         description: Invalid ID provided. This can occur if the ID is not a number.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid ID provided"
 *       404:
 *         description: Query not found. Occurs when there is no saved query with the provided ID.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Query not found"
 *       500:
 *         description: Server error or error retrieving the query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error occurred retrieving the query"
 */
router.get(
  "/query/:id",
  validate(getQueryByIdValidation),
  apiController.getQueryById
);

/**
 * @openapi
 * /update-query/{id}:
 *   patch:
 *     summary: Update an existing SQL query
 *     description: >
 *       Updates an existing SQL query along with its label, the database where it will be executed,
 *       and its parameters. This endpoint allows for the modification of previously stored
 *       queries. The query in the request must be a base64 encoded string. It also validates
 *       the provided query parameters against the expected named parameters in the SQL query,
 *       ensuring that the correct number of parameters are provided and all required parameters
 *       are present.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The unique identifier of the query to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, database, label, parameters]
 *             properties:
 *               query:
 *                 type: string
 *                 description: The SQL query string to be updated, encoded in base64.
 *                 example: "base64-encoded-SQL-query"
 *               database:
 *                 type: string
 *                 description: The name of the database where the query will be executed.
 *                 example: "database_name"
 *               label:
 *                 type: string
 *                 description: A new or existing label for the query.
 *                 example: "Updated Monthly Sales Report"
 *               parameters:
 *                 type: object
 *                 required: [values]
 *                 properties:
 *                   values:
 *                     type: array
 *                     description: An array of named parameters expected in the query.
 *                     items:
 *                       type: object
 *                       required: [name]
 *                       properties:
 *                         name:
 *                           type: string
 *                           description: The name of the parameter as it appears in the query (without the leading colon).
 *                           example: "startDate"
 *                         value:
 *                           type: string
 *                           description: The value of the parameter to be used when the query is executed. This field is illustrative and not used directly in the update operation but should match the structure expected when executing the query.
 *                           example: "2021-02-01"
 *     responses:
 *       200:
 *         description: Query updated successfully. Returns the ID of the updated query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: integer
 *                   description: The unique identifier for the updated query.
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Query updated successfully"
 *       400:
 *         description: Invalid request. This can occur if the query string, database, label, or parameters are not properly provided, or if the provided ID is not valid.
 *       404:
 *         description: Query not found. Occurs when the provided ID does not match any existing query.
 *       500:
 *         description: Server error or error executing the update.
 */
router.patch(
  "/update-query/:id",
  // validate(updateQueryValidation), // Assuming you have a validation middleware
  apiController.updateQuery
);

export default router;
