import { Router } from "express";
import * as segmentsController from "../controllers/segments";
import { validate } from "../middleware/joiValidate";
import * as segmentsValidation from "../validation/segmentsValidation";

const router = Router();

router.post(
  "/segments",
  validate(segmentsValidation.createSegment),
  segmentsController.createSegment
);

export default router;
