import { Router } from "express";
import * as apiController from "../controllers/growth-index";

const router = Router();

/**
 * @openapi
 * /custom-data:
 *   get:
 *     summary: Retrieve Aggregated Data
 *     description: Retrieves aggregated data based on the specified parameters. This endpoint is useful for fetching data with various aggregations and intervals, such as daily or monthly summaries.
 *     parameters:
 *       - in: query
 *         name: tableName
 *         required: true
 *         description: Name of the database table to query.
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateColumn
 *         required: true
 *         description: Name of the column to treat as date for aggregation.
 *         schema:
 *           type: string
 *       - in: query
 *         name: interval
 *         required: true
 *         description: The interval for date aggregation (e.g., day, week, month).
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *       - in: query
 *         name: aggregateColumn
 *         required: true
 *         description: The column to aggregate.
 *         schema:
 *           type: string
 *       - in: query
 *         name: aggregateFunction
 *         required: false
 *         description: Aggregate function to apply (e.g., COUNT, SUM, AVG, MAX, MIN). Defaults to COUNT.
 *         schema:
 *           type: string
 *           enum: [COUNT, SUM, AVG, MAX, MIN]
 *       - in: query
 *         name: daysAgo
 *         required: true
 *         description: The number of days ago from the current date to start aggregating data.
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully retrieved aggregated data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interval:
 *                   type: string
 *                 aggregate:
 *                   type: number
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Server error.
 */
router.get("/custom-data", apiController.getGrowthIndex);

/**
 * @openapi
 * /growth-index/historical:
 *   get:
 *     summary: Retrieve Custom Data
 *     description: Retrieves custom data based on the specified table, date column, list of columns, optional chain(s), and time interval. Multiple chains can be specified as a comma-separated list.
 *     parameters:
 *       - in: query
 *         name: tableName
 *         required: true
 *         description: Name of the database table to query.
 *         schema:
 *           type: string
 *           example: "weekly_growth_index"
 *       - in: query
 *         name: dateColumn
 *         required: true
 *         description: Name of the column to treat as the date for filtering.
 *         schema:
 *           type: string
 *           example: "week_of_record"
 *       - in: query
 *         name: columns
 *         required: true
 *         description: Comma-separated list of column names to retrieve.
 *         schema:
 *           type: string
 *           example: "weekly_txns,tvl"
 *       - in: query
 *         name: daysAgo
 *         required: true
 *         description: The number of days from the current date to include in the data retrieval. For example, specify 90 to get the last 90 days of data.
 *         schema:
 *           type: integer
 *           example: 90
 *       - in: query
 *         name: chain
 *         required: false
 *         description: Optional comma-separated list of chain names to filter the data by.
 *         schema:
 *           type: string
 *           example: "aleph-zero,ethereum"
 *     responses:
 *       200:
 *         description: Successfully retrieved the latest data points for each chain.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         weekly_txns:
 *                           type: number
 *                           description: The number of transactions for the data point.
 *                           example: 7704084
 *                         tvl:
 *                           type: number
 *                           format: double
 *                           description: The total value locked for the data point.
 *                           example: 28174031523.133488
 *                         week_of_record:
 *                           type: string
 *                           format: date-time
 *                           description: The record date for the data point.
 *                           example: "2023-12-10T23:00:00.000Z"
 *             example:
 *               data:
 *                 chain1:
 *                   - weekly_txns: 7704084
 *                     tvl: 28174031523.133488
 *                     week_of_record: "2023-12-10T23:00:00.000Z"
 *                   - weekly_txns: 8074424
 *                     tvl: 29457097050.36072
 *                     week_of_record: "2023-12-03T23:00:00.000Z"
 *                 chain2:
 *                   - weekly_txns: 45196
 *                     tvl: 69666.20393294304
 *                     week_of_record: "2023-12-10T23:00:00.000Z"
 *                   - weekly_txns: 8074424
 *                     tvl: 29457097050.36072
 *                     week_of_record: "2023-12-03T23:00:00.000Z"
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Server error.
 */
router.get("/growth-index/historical", apiController.getGrowthIndexHistorical);

/**
 * @openapi
 * /growth-index/latest:
 *   get:
 *     summary: Retrieve Latest Data Point
 *     description: Retrieves the latest data point for each specified chain from a given table. This endpoint is useful for getting the most recent snapshot of data.
 *     parameters:
 *       - in: query
 *         name: tableName
 *         required: true
 *         description: Name of the database table to query.
 *         schema:
 *           type: string
 *           example: "weekly_growth_index"
 *       - in: query
 *         name: dateColumn
 *         required: true
 *         description: Name of the column to treat as the date for identifying the latest record.
 *         schema:
 *           type: string
 *           example: "week_of_record"
 *       - in: query
 *         name: columns
 *         required: true
 *         description: Comma-separated list of column names to retrieve.
 *         schema:
 *           type: string
 *           example: "weekly_txns,tvl"
 *       - in: query
 *         name: chain
 *         required: true
 *         description: Comma-separated list of chain names for which to retrieve the latest data.
 *         schema:
 *           type: string
 *           example: "aleph-zero,ethereum"
 *     responses:
 *       200:
 *         description: Successfully retrieved the latest data point for each chain.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       weekly_txns:
 *                         type: number
 *                         description: The number of transactions for the latest data point.
 *                         example: 7704084
 *                       tvl:
 *                         type: number
 *                         format: double
 *                         description: The total value locked for the latest data point.
 *                         example: 28174031523.133488
 *                       week_of_record:
 *                         type: string
 *                         format: date-time
 *                         description: The record date for the latest data point.
 *                         example: "2023-12-10T23:00:00.000Z"
 *             example:
 *               data:
 *                 ethereum:
 *                   weekly_txns: 7704084
 *                   tvl: 28174031523.133488
 *                   week_of_record: "2023-12-10T23:00:00.000Z"
 *                 aleph-zero:
 *                   weekly_txns: 45196
 *                   tvl: 69666.20393294304
 *                   week_of_record: "2023-12-10T23:00:00.000Z"
 *       400:
 *         description: Invalid query parameters.
 *       500:
 *         description: Server error.
 */
router.get("/growth-index/latest", apiController.getLatestGrowthIndexData);

export default router;
