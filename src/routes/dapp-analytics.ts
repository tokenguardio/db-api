import { Router } from "express";
import * as dappController from "../controllers/dapp-analytics";
import { validate } from "../middleware/joiValidate";
import {
  saveDappValidation,
  getDappByIdValidation,
  updateDappValidation,
  dappDataMetricsValidation,
  getDappIndexingStatusValidation,
} from "../validation/dapp-analytics-validations";

const router = Router();

/**
 * @swagger
 * /dapp-analytics/dapp:
 *   post:
 *     summary: Save a new dapp
 *     tags: [Dapp Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Dapp"
 *               logo:
 *                 type: string
 *                 example: "http://example.com/logo.png"
 *               blockchain:
 *                 type: string
 *                 example: "Ethereum"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "http://example.com"
 *               fromBlock:
 *                 type: integer
 *                 example: 123456
 *               addedBy:
 *                 type: string
 *                 example: "admin"
 *               abis:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Contract Name"
 *                     address:
 *                       type: string
 *                       example: "5F3sa2TJAWMqDhXG6jhV4N8ko9wD8GqX9gY7M2L3UnQwZ8h7"
 *                     abi:
 *                       type: object
 *     responses:
 *       200:
 *         description: Dapp saved successfully
 */
router.post(
  "/dapp-analytics/dapp/",
  validate(saveDappValidation),
  dappController.saveDapp
);

/**
 * @swagger
 * /dapp-analytics/dapp/all:
 *   get:
 *     summary: Get all dapps
 *     tags: [Dapp Analytics]
 *     responses:
 *       200:
 *         description: List of all dapps
 */
router.get("/dapp-analytics/dapp/all", dappController.getAllDapps);

/**
 * @swagger
 * /dapp-analytics/{id}:
 *   get:
 *     summary: Get a dapp by ID
 *     tags: [Dapp Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The dapp ID
 *     responses:
 *       200:
 *         description: Dapp retrieved successfully
 */
router.get(
  "/dapp-analytics/dapp/:id",
  validate(getDappByIdValidation),
  dappController.getDapp
);

/**
 * @swagger
 * /dapp-analytics/{id}/status:
 *   get:
 *     summary: Get dApp indexing status
 *     tags: [Dapp Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The dapp ID
 *     responses:
 *       200:
 *         description: dApp status retrieved successfully
 */
router.get(
  "/dapp-analytics/dapp/:id/status",
  validate(getDappIndexingStatusValidation),
  dappController.getDappIndexerStatus
);

/**
 * @swagger
 * /dapp-analytics/dapp/{id}:
 *   patch:
 *     summary: Update a dapp by ID
 *     tags: [Dapp Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The dapp ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Dapp"
 *               logo:
 *                 type: string
 *                 example: "http://example.com/logo.png"
 *               blockchain:
 *                 type: string
 *                 example: "Ethereum"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "http://example.com"
 *               fromBlock:
 *                 type: integer
 *                 example: 123456
 *               addedBy:
 *                 type: string
 *                 example: "admin"
 *               abis:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Contract Name"
 *                     address:
 *                       type: string
 *                       example: "5F3sa2TJAWMqDhXG6jhV4N8ko9wD8GqX9gY7M2L3UnQwZ8h7"
 *                     abi:
 *                       type: object
 *     responses:
 *       200:
 *         description: Dapp updated successfully
 */
router.patch(
  "/dapp-analytics/dapp/:id",
  validate(updateDappValidation),
  dappController.updateDapp
);

/**
 * @swagger
 * /dapp-analytics/data/{id}/{metric}:
 *   post:
 *     summary: Retrieve dApp data metrics
 *     tags: [Dapp Analytics]
 *     parameters:
 *       - name: id
 *         in: path
 *         description: dApp ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: metric
 *         in: path
 *         description: Metric to retrieve (e.g., 'wallets', 'transferredTokens', 'interactions')
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakdown:
 *                 type: boolean
 *                 default: false
 *               filters:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [call, event]
 *                     args:
 *                       type: object
 *                       additionalProperties:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [integer, string, boolean]
 *                           conditions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 operator:
 *                                   type: string
 *                                   enum: [">", "<", ">=", "<=", "=", "!="]
 *                                 value:
 *                                   type: [number, string, boolean]
 *                           value:
 *                             type: [string, boolean]
 *     responses:
 *       200:
 *         description: Successfully retrieved dApp data metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   day:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-17T00:00:00.000Z"
 *                   walletCount:
 *                     type: integer
 *                     example: 1
 *                   wallets:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         address:
 *                           type: string
 *                           example: "5CowKUxKYMBnTD4boJLFCxxd42w7NURahd4pYd9dygBFdQV5"
 *                   contract:
 *                     type: string
 *                     example: "5DG2wPtGcUJgBAWnym8t4swYvmwg2XJuY1ZEhv1EDwJPCj1W"
 */
router.post(
  "/dapp-analytics/data/:id/:metric",
  validate(dappDataMetricsValidation),
  dappController.getDappDataMetrics
);

export default router;
