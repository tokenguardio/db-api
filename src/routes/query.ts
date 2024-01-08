import { Router } from "express";
import * as apiController from "../controllers/query";

const router = Router();

/**
 * @openapi
 * /save-query:
 *   post:
 *     summary: Save a SQL query
 *     description: Saves a SQL query along with its parameters for later execution. This endpoint is useful for storing queries that can be dynamically executed with different parameters.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: The SQL query string to be saved.
 *                 example: "SELECT * FROM orders WHERE customer_id = ? AND order_date BETWEEN ? AND ?"
 *               parameters:
 *                 type: array
 *                 description: An array of parameters associated with the query.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "customer_id"
 *                     type:
 *                       type: string
 *                       example: "integer"
 *             example:
 *               query: "SELECT * FROM orders WHERE customer_id = ? AND order_date BETWEEN ? AND ?"
 *               parameters:
 *                 - name: "customer_id"
 *                   type: "integer"
 *                 - name: "start_date"
 *                   type: "date"
 *                 - name: "end_date"
 *                   type: "date"
 *     responses:
 *       201:
 *         description: Query saved successfully. Returns the ID of the saved query.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Query saved successfully"
 *       400:
 *         description: Invalid request body. This can occur if the query string or parameters are not properly provided.
 *       500:
 *         description: Server error or error saving the query.
 */
router.post("/save-query", apiController.saveQuery);

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
 *                 example: 1
 *               queryParams:
 *                 type: array
 *                 description: An array of parameters to execute the saved query with.
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "customer_id"
 *                     value:
 *                       type: string
 *                       example: "1001"
 *             example:
 *               id: 1
 *               queryParams:
 *                 - name: "customer_id"
 *                   value: "1001"
 *                 - name: "start_date"
 *                   value: "2022-01-01"
 *                 - name: "end_date"
 *                   value: "2022-01-07"
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
 *                   example: [{"order_id": 123, "total_price": 299.99}]
 *       400:
 *         description: Invalid request body or query parameters. This can occur if the ID, query string, or parameters are not properly provided.
 *       404:
 *         description: Query not found. Occurs when there is no saved query with the provided ID.
 *       500:
 *         description: Server error or error executing the query.
 */
router.post("/execute-query", apiController.executeQuery);

export default router;
