import Joi from "joi";
import { Validation } from "./validationInterface";

export const getTableColumnsValidation: Validation = {
  params: Joi.object({
    schemaName: Joi.string().required(),
    tableName: Joi.string().required(),
  }),
};
