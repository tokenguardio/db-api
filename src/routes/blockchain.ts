import { Router } from "express";
import {
  createBlockchain,
  deleteBlockchain,
  getAllBlockchains,
  getBlockchainById,
  getBlockchainByNameAndNetwork,
  getBlockchainBySlug,
  getBlockchainsWithGrowthIndex,
  updateBlockchain,
  upsertBlockchain,
} from "../controllers/blockchainController";

const router = Router();

/**
 * @openapi
 * /blockchain/create:
 *   post:
 *     summary: Create a new blockchain
 *     description: Creates a new blockchain record in the database.
 *     tags:
 *       - Blockchains
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'network', 'slug', 'active', 'growthindex', 'dappgrowth']
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Bitcoin"
 *               network:
 *                 type: string
 *                 example: "Mainnet"
 *               slug:
 *                 type: string
 *                 example: "bitcoin"
 *               logo:
 *                 type: string
 *                 example: "http://example.com/bitcoin.png"
 *               active:
 *                 type: boolean
 *                 example: true
 *               growthindex:
 *                 type: boolean
 *                 example: false
 *               dappgrowth:
 *                 type: boolean
 *                 example: false
 *               database:
 *                 type: string
 *                 nullable: true
 *                 example: ""
 *     responses:
 *       201:
 *         description: Blockchain created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Blockchain created successfully"
 *                 blockchain:
 *                   $ref: '#/components/schemas/Blockchain'
 *       500:
 *         description: Internal server error.
 */
router.post("/blockchain/create", createBlockchain);

/**
 * @openapi
 * /blockchain/upsert:
 *   post:
 *     summary: Upsert a blockchain
 *     description: Updates an existing blockchain or creates a new one if it does not exist.
 *     tags:
 *       - Blockchains
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'network', 'slug', 'active', 'growthindex', 'dappgrowth']
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Ethereum"
 *               network:
 *                 type: string
 *                 example: "Mainnet"
 *               slug:
 *                 type: string
 *                 example: "ethereum"
 *               logo:
 *                 type: string
 *                 example: "http://example.com/ethereum.png"
 *               active:
 *                 type: boolean
 *                 example: true
 *               growthindex:
 *                 type: boolean
 *                 example: true
 *               dappgrowth:
 *                 type: boolean
 *                 example: true
 *               database:
 *                 type: string
 *                 nullable: true
 *                 example: "extraDB"
 *     responses:
 *       200:
 *         description: Blockchain upserted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Blockchain upserted successfully"
 *                 blockchain:
 *                   $ref: '#/components/schemas/Blockchain'
 *       500:
 *         description: Internal server error.
 */
router.post("/blockchain/upsert", upsertBlockchain);

/**
 * @openapi
 * /blockchain/growth-index:
 *   get:
 *     summary: Retrieve all blockchains with active growth indices
 *     description: Returns a list of all blockchains where the growth index is true and they are active.
 *     tags:
 *       - Blockchains
 *     responses:
 *       200:
 *         description: A list of blockchains.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blockchain'
 *       500:
 *         description: Internal server error.
 */
router.get("/blockchain/growth-index", getBlockchainsWithGrowthIndex);

/**
 * @openapi
 * /blockchains:
 *   get:
 *     summary: Retrieve all blockchains with optional query filters
 *     description: Returns a list of all blockchains, optionally filtered by various parameters.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by blockchain name.
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Filter by network type.
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status.
 *     responses:
 *       200:
 *         description: A list of blockchains.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blockchain'
 *       500:
 *         description: Internal server error.
 */
router.get("/blockchains", getAllBlockchains);

/**
 * @openapi
 * /blockchain/by-name-and-network:
 *   get:
 *     summary: Retrieve a blockchain by name and network
 *     description: Returns a single blockchain based on the blockchain name and network provided.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: query
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the blockchain to retrieve.
 *       - in: query
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *         description: The network of the blockchain to retrieve.
 *     responses:
 *       200:
 *         description: Blockchain found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blockchain'
 *       404:
 *         description: Blockchain not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/blockchain/by-name-and-network", getBlockchainByNameAndNetwork);

/**
 * @openapi
 * /blockchain/{id}:
 *   get:
 *     summary: Retrieve a blockchain by ID
 *     description: Returns a single blockchain based on the blockchain ID provided.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blockchain to retrieve.
 *     responses:
 *       200:
 *         description: Blockchain found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blockchain'
 *       404:
 *         description: Blockchain not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/blockchain/:id", getBlockchainById);

/**
 * @openapi
 * /blockchain/slug/{slug}:
 *   get:
 *     summary: Retrieve a blockchain by slug
 *     description: Returns a single blockchain based on the slug provided.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: The slug of the blockchain to retrieve.
 *     responses:
 *       200:
 *         description: Blockchain found and returned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blockchain'
 *       404:
 *         description: Blockchain not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/blockchain/slug/:slug", getBlockchainBySlug);

/**
 * @openapi
 * /blockchain/update/{id}:
 *   patch:
 *     summary: Update a blockchain
 *     description: Updates an existing blockchain by its ID with provided details.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blockchain to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blockchain'
 *     responses:
 *       200:
 *         description: Blockchain updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Blockchain updated successfully"
 *                 blockchain:
 *                   $ref: '#/components/schemas/Blockchain'
 *       404:
 *         description: Blockchain not found.
 *       500:
 *         description: Internal server error.
 */
router.patch("/blockchain/update/:id", updateBlockchain);

/**
 * @openapi
 * /blockchain/delete/{id}:
 *   delete:
 *     summary: Delete a blockchain
 *     description: Deletes a blockchain by its ID.
 *     tags:
 *       - Blockchains
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blockchain to delete.
 *     responses:
 *       204:
 *         description: Blockchain deleted successfully.
 *       404:
 *         description: Blockchain not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/blockchain/delete/:id", deleteBlockchain);

export default router;
