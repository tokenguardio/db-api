import Joi from "joi";
import { Validation } from "./validationInterface";

export const getAllSchemasValidation: Validation = {
  params: Joi.object({
    dbname: Joi.string().required(),
  }),
};

export const getAllTablesValidation: Validation = {
  params: Joi.object({
    dbname: Joi.string().required(),
  }),
};

export const getTableColumnsValidation: Validation = {
  params: Joi.object({
    dbname: Joi.string().required(),
    schema: Joi.string().required(),
    table: Joi.string().required(),
  }),
};

