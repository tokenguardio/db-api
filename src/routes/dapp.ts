// DappsRoute.ts

import { Router } from "express";
import {
  createDappController,
  createDappWithBlockchains,
  getAllDapps,
  getDappById,
  getDappByName,
  getDappBySlug,
  updateDapp,
  upsertDappController,
} from "../controllers/dappController";
// import { validate } from "../middleware/joiValidate";
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

/**
 * @openapi
 * /dapps:
 *   post:
 *     summary: Create a new dapp with blockchain associations
 *     description: Creates a new dapp record in the database and associates it with specified blockchains.
 *     tags:
 *       - Dapps
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'slug', 'active', 'dapp_growth_index', 'defi_growth_index', 'blockchains']
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
 *         description: Dapp created successfully. Returns the details of the created dapp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dapp created successfully"
 *                 dapp:
 *                   $ref: '#/components/schemas/Dapp'
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
router.post("/dapps", createDappWithBlockchains);

/**
 * @openapi
 * /dapps/{id}:
 *   get:
 *     summary: Retrieve a dapp by ID
 *     description: Returns a single dapp based on the dapp ID provided.
 *     tags:
 *       - Dapps
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the dapp to retrieve.
 *     responses:
 *       200:
 *         description: Dapp found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dapp'
 *       404:
 *         description: Dapp not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/dapps/:id", getDappById);

/**
 * @openapi
 * /dapps:
 *   get:
 *     summary: Retrieve all dapps
 *     description: Returns a list of all dapps, optionally filtered by various parameters such as name, active status, etc.
 *     tags:
 *       - Dapps
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by dapp name.
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status.
 *     responses:
 *       200:
 *         description: List of dapps returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dapp'
 *       500:
 *         description: Internal server error.
 */
router.get("/dapps", getAllDapps);

/**
 * @openapi
 * /dapps/slug/{slug}:
 *   get:
 *     summary: Retrieve a dapp by its slug
 *     description: Returns a single dapp based on the slug provided.
 *     tags:
 *       - Dapps
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the dapp to retrieve.
 *     responses:
 *       200:
 *         description: Dapp found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *               example:
 *                 name: "Example Dapp"
 *                 slug: "example-dapp"
 *       404:
 *         description: Dapp not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/dapps/slug/:slug", getDappBySlug);

/**
 * @openapi
 * /dapps/name/{name}:
 *   get:
 *     summary: Retrieve a dapp by its name
 *     description: Returns a single dapp based on the name provided.
 *     tags:
 *       - Dapps
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the dapp to retrieve.
 *     responses:
 *       200:
 *         description: Dapp found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 slug:
 *                   type: string
 *               example:
 *                 name: "Example Dapp"
 *                 slug: "example-dapp"
 *       404:
 *         description: Dapp not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/dapps/name/:name", getDappByName);

/**
 * @openapi
 * /dapps/update/{id}:
 *   patch:
 *     summary: Update a dapp
 *     description: Updates an existing dapp by its ID with provided details.
 *     tags:
 *       - Dapps
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the dapp to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Dapp Name"
 *               slug:
 *                 type: string
 *                 example: "updated-dapp"
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Dapp updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dapp updated successfully"
 *                 dapp:
 *                   $ref: '#/components/schemas/Dapp'
 *       404:
 *         description: Dapp not found.
 *       500:
 *         description: Internal server error.
 */
router.patch("/dapps/update/:id", updateDapp);

export default router;
