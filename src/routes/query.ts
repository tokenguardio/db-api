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
 *             properties:
 *               query:
 *                 type: string
 *                 description: |
 *                   The SQL query string to be saved. The query must be a base64 encoded string. For example, the following SQL query:
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
 *                   is encoded as the base64 string provided in the example.
 *                 example: "V0lUSCBvbmNoYWluX2RldmVsb3BlcnMgQVMgKHNlbGVjdCAqLCAnV0FTTScgYXMgY29udHJhY3RfdHlwZSBmcm9tIHN0Zy53YXNtX2NvbnRyYWN0c19jcmVhdGlvbnMKdW5pb24gYWxsCnNlbGVjdCAqLCAnRVZNJyBhcyBjb250cmFjdF90eXBlIGZyb20gc3RnLmV2bV9jb250cmFjdHNfY3JlYXRpb25zCikKU0VMRUNUCihEQVRFKCBkYXRlX3RydW5jKCd3ZWVrJywgb25jaGFpbl9kZXZlbG9wZXJzLiJkYXRlX29mX3JlY29yZCIpOjpkYXRlCgopKSBBUyAib25jaGFpbl9kZXZlbG9wZXJzLmR5bmFtaWNfdGltZWZyYW1lIiwKQ09VTlQoRElTVElOQ1Qgb25jaGFpbl9kZXZlbG9wZXJzLiJkZXBsb3llciIpICBBUyAib25jaGFpbl9kZXZlbG9wZXJzLnVuaXF1ZV9kZXZlbG9wZXJzIgpGUk9NIG9uY2hhaW5fZGV2ZWxvcGVycwpXSEVSRSAob25jaGFpbl9kZXZlbG9wZXJzLiJjb250cmFjdF90eXBlIiApIElOICg/LCA/KSBBTkQgKCgoIG9uY2hhaW5fZGV2ZWxvcGVycy4iZGF0ZV9vZl9yZWNvcmQiICApID49ICgoU0VMRUNUIChEQVRFX1RSVU5DKCdkYXknLCBDVVJSRU5UX1RJTUVTVEFNUCkgKyAoLTg5IHx8ICcgZGF5Jyk6OklOVEVSVkFMKSkpIEFORCAoIG9uY2hhaW5fZGV2ZWxvcGVycy4iZGF0ZV9vZl9yZWNvcmQiICApIDwgKChTRUxFQ1QgKChEQVRFX1RSVU5DKCdkYXknLCBDVVJSRU5UX1RJTUVTVEFNUCkgKyAoLTg5IHx8ICcgZGF5Jyk6OklOVEVSVkFMKSArICg5MCB8fCAnIGRheScpOjpJTlRFUlZBTCkpKSkpCkdST1VQIEJZCjEKT1JERVIgQlkKMQpGRVRDSCBORVhUIDUwMCBST1dTIE9OTFk="
 *               database:
 *                 type: string
 *                 description: The name of the database where the query will be executed.
 *                 example: "astar_mainnet_squid"
 *               parameters:
 *                 type: array
 *                 description: An array of parameters associated with the query.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "contractType1"
 *                     type:
 *                       type: string
 *                       example: "string"
 *             example:
 *               query: "V0lUSCBvbmNoYWluX2RldmVsb3BlcnMgQVMgKHNlbGVjdCAqLCAnV0FTTScgYXMgY29udHJhY3RfdHlwZSBmcm9tIHN0Zy53YXNtX2NvbnRyYWN0c19jcmVhdGlvbnMKdW5pb24gYWxsCnNlbGVjdCAqLCAnRVZNJyBhcyBjb250cmFjdF90eXBlIGZyb20gc3RnLmV2bV9jb250cmFjdHNfY3JlYXRpb25zCikKU0VMRUNUCihEQVRFKCBkYXRlX3RydW5jKCd3ZWVrJywgb25jaGFpbl9kZXZlbG9wZXJzLiJkYXRlX29mX3JlY29yZCIpOjpkYXRlCgopKSBBUyAib25jaGFpbl9kZXZlbG9wZXJzLmR5bmFtaWNfdGltZWZyYW1lIiwKQ09VTlQoRElTVElOQ1Qgb25jaGFpbl9kZXZlbG9wZXJzLiJkZXBsb3llciIpICBBUyAib25jaGFpbl9kZXZlbG9wZXJzLnVuaXF1ZV9kZXZlbG9wZXJzIgpGUk9NIG9uY2hhaW5fZGV2ZWxvcGVycwpXSEVSRSAob25jaGFpbl9kZXZlbG9wZXJzLiJjb250cmFjdF90eXBlIiApIElOICg/LCA/KSBBTkQgKCgoIG9uY2hhaW5fZGV2ZWxvcGVycy4iZGF0ZV9vZl9yZWNvcmQiICApID49ICgoU0VMRUNUIChEQVRFX1RSVU5DKCdkYXknLCBDVVJSRU5UX1RJTUVTVEFNUCkgKyAoLTg5IHx8ICcgZGF5Jyk6OklOVEVSVkFMKSkpIEFORCAoIG9uY2hhaW5fZGV2ZWxvcGVycy4iZGF0ZV9vZl9yZWNvcmQiICApIDwgKChTRUxFQ1QgKChEQVRFX1RSVU5DKCdkYXknLCBDVVJSRU5UX1RJTUVTVEFNUCkgKyAoLTg5IHx8ICcgZGF5Jyk6OklOVEVSVkFMKSArICg5MCB8fCAnIGRheScpOjpJTlRFUlZBTCkpKSkpCkdST1VQIEJZCjEKT1JERVIgQlkKMQpGRVRDSCBORVhUIDUwMCBST1dTIE9OTFk="
 *               database: "astar_mainnet_squid"
 *               parameters:
 *                 - name: "contractType1"
 *                   type: "string"
 *                 - name: "contractType2"
 *                   type: "string"
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
 *         description: Invalid request body. This can occur if the query string or parameters are not properly provided.
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
 *     description: Executes a previously saved SQL query with the provided parameters. This endpoint is useful for running dynamic queries with different parameters on demand.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: The unique identifier of the saved query to execute.
 *                 example: 2
 *               parameters:
 *                 type: array
 *                 description: An array of parameters to execute the saved query with.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "contractType1"
 *                     value:
 *                       type: string
 *                       example: "EVM"
 *             example:
 *               id: 1
 *               parameters:
 *                 - name: "contractType1"
 *                   value: "EVM"
 *                 - name: "contractType2"
 *                   value: "WASM"
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
 *         description: Invalid request body or query parameters. This can occur if the ID, query string, or parameters are not properly provided.
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

export default router;
