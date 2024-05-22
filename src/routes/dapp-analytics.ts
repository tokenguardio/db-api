import { Router } from "express";
import * as dappController from "../controllers/dapp-analytics";
import { validate } from "../middleware/joiValidate";
import {
  saveDappValidation,
  getDappByIdValidation,
  updateDappValidation,
} from "../validation/dapp-analytics-validations";

const router = Router();

router.post(
  "/dapp-analytics/",
  validate(saveDappValidation),
  dappController.saveDapp
);

router.get(
  "/dapp-analytics/:id",
  validate(getDappByIdValidation),
  dappController.getDapp
);

router.get("/dapp-analytics", dappController.getAllDapps);

router.patch(
  "/dapp-analytics/:id",
  validate(updateDappValidation),
  dappController.updateDapp
);

export default router;
