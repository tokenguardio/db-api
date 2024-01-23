import Joi, { CustomHelpers } from "joi";
import { Validation } from "./validationInterface";

export const SQLDataTypes: string[] = ["number", "date", "string"];

// Custom Base64 validation function
const base64Validator = (value: string, helpers: CustomHelpers) => {
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    const reencoded = Buffer.from(decoded).toString("base64");

    if (value !== reencoded) {
      throw new Error("Invalid base64 string");
    }
  } catch (error) {
    return helpers.error("string.base64");
  }

  return value; // Return the value if validation is successful
};

// Define the Joi schema for a QueryParameter
const queryParameterSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string()
    .valid(...SQLDataTypes)
    .required()
    .messages({
      "any.only": `"type" must be one of [${SQLDataTypes.join(", ")}]`,
    }),
});

// Define the Validation object for the saveQuery request body
export const saveQueryValidation = {
  body: Joi.object({
    query: Joi.string().custom(base64Validator, "base64 validation").required(),
    database: Joi.string().required(),
    parameters: Joi.array()
      .items(queryParameterSchema)
      .unique((a, b) => a.name === b.name) // Ensure unique names in parameters
      .optional()
      .messages({
        "array.unique": "Duplicate parameter names are not allowed",
      }),
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
    parameters: Joi.array().items(executeQueryParamSchema).optional(),
  }),
};
