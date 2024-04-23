// DappsRoute.ts

import { Router } from "express";
import {
  createDappController,
  upsertDappController,
} from "../controllers/dapp";
import { validate } from "../middleware/joiValidate";
// import {
//   dappCreateValidation,
//   dappUpsertValidation,
// } from "../validation/dappValidations";

const router = Router();

/**
 * @openapi
 * /dapp/create-dapp:
 *   post:
 *     summary: Create a new dapp
 *     description: Creates a new dapp record in the database.
 *     tags:
 *       - Dapps
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'slug', 'active', 'dapp_growth_index', 'defi_growth_index']
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Example Dapp"
 *               slug:
 *                 type: string
 *                 example: "example-dapp"
 *               icon:
 *                 type: string
 *                 nullable: true
 *                 example: "http://example.com/icon.png"
 *               active:
 *                 type: boolean
 *                 example: true
 *               dapp_growth_index:
 *                 type: boolean
 *                 example: false
 *               defi_growth_index:
 *                 type: boolean
 *                 example: false
 *               blockchains:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["ethereum", "polygon"]
 *     responses:
 *       201:
 *         description: Dapp created successfully. Returns the ID of the created dapp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dapp created successfully"
 *                 id:
 *                   type: number
 *                   example: 1
 *       400:
 *         description: Invalid request body. This can occur if the required dapp details are not properly provided.
 *       500:
 *         description: Server error or error while inserting the dapp into the database.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post(
  "/dapp/create-dapp",
  // validate(dappCreateValidation), // Uncomment and implement the validation middleware.
  createDappController
);

/**
 * @openapi
 * /upsert-dapp:
 *   post:
 *     summary: Upsert a dapp
 *     description: Inserts a new dapp record or updates it if it already exists in the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DappInitializer'
 *     responses:
 *       200:
 *         description: Dapp upserted successfully. Returns the ID of the upserted dapp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dapp upserted successfully"
 *                 id:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Invalid request body or unable to upsert the dapp.
 *       500:
 *         description: Server error or error upserting the dapp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error occurred while upserting the dapp"
 */
router.post(
  "/upsert-dapp",
  //   validate(dappUpsertValidation),
  upsertDappController
);

export default router;
