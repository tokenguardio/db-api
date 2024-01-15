import Joi from "joi";
import { Validation } from "./validationInterface";

export const SQLDataTypes: string[] = ["number", "date", "string"];

// Define the Joi schema for a QueryParameter
const queryParameterSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string()
    .valid(...SQLDataTypes)
    .required(),
});

// Define the Validation object for the saveQuery request body
export const saveQueryValidation: Validation = {
  body: Joi.object({
    query: Joi.string().required(),
    database: Joi.string().required(),
    parameters: Joi.array().items(queryParameterSchema).optional(),
  }),
};

// Define the Joi schema for a QueryParam used in executeQuery
const executeQueryParamSchema = Joi.object({
  name: Joi.string().required(),
  value: Joi.alternatives()
    .try(Joi.string(), Joi.number(), Joi.date()) // Adjust based on the types of values you expect
    .required(),
});

// Define the Validation object for the executeQuery request body
export const executeQueryValidation: Validation = {
  body: Joi.object({
    id: Joi.number().required(),
    queryParams: Joi.array().items(executeQueryParamSchema).optional(),
  }),
};
