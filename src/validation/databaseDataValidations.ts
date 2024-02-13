import Joi from "joi";
import { Validation } from "./validationInterface";

export const getTableColumnsValidation: Validation = {
  params: Joi.object({
    schema: Joi.string().required(),
    table: Joi.string().required(),
  }),
};
