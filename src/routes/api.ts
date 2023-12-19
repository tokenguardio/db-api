import { Router } from "express";
import * as apiController from "../controllers/api";

const router = Router();

/**
 * @openapi
 * /api:
 *   get:
 *     summary: Test endpoint to return a greeting message
 *     description: This endpoint is for testing purposes and it returns a simple greeting message, "Hello World".
 *     responses:
 *       200:
 *         description: A JSON object containing a greeting message.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hello World"
 */
router.get("/api", apiController.getApi);

export default router;
