import { Router } from "express";
import * as apiController from "../controllers/chartData";

const router = Router();

/**
 * @openapi
 * /group-by-operation/{schema}/{table}:
 *   post:
 *     summary: Perform a Group By operation with multiple grouping and aggregate columns, with optional filters
 *     description: Performs a SELECT with a GROUP BY operation on the specified table using multiple grouping columns and aggregate columns with respective operators, and optional filters.
 *     parameters:
 *       - in: path
 *         name: schema
 *         required: true
 *         description: Name of the schema.
 *         schema:
 *           type: string
 *       - in: path
 *         name: table
 *         required: true
 *         description: Name of the table.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               groupByColumns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     columnName:
 *                       type: string
 *                 description: Array of objects with column names to group by
 *               aggregateColumns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     columnName:
 *                       type: string
 *                     operator:
 *                       type: string
 *                 description: Array of objects with column name and aggregation operator
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     columnName:
 *                       type: string
 *                     filterValue:
 *                       oneOf:
 *                         - type: string
 *                         - type: object
 *                           properties:
 *                             start:
 *                               type: string
 *                             end:
 *                               type: string
 *                 description: Optional array of filter objects, each with a column name and filter value (single value or range with start and end)
 *     responses:
 *       200:
 *         description: Successfully performed the group by operation.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *       400:
 *         description: Invalid input parameters.
 *       500:
 *         description: Server error.
 */
router.post(
  "/group-by-operation/:schema/:table",
  apiController.performGroupByOperation
);

export default router;
