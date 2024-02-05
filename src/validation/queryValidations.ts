import Joi, { CustomHelpers } from "joi";

export const SQLDataTypes: string[] = [
  "number",
  "date",
  "string",
  "number[]",
  "date[]",
  "string[]",
];

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
    label: Joi.string().optional(),
    parameters: Joi.object({
      values: Joi.array()
        .items(queryParameterSchema)
        .unique((a, b) => a.name === b.name) // Ensure unique names in parameters
        .optional()
        .messages({
          "array.unique": "Duplicate parameter names are not allowed",
        }),
    }).optional(), // parameters object itself is optional
  }),
};

const executeQueryParamSchema = Joi.object({
  name: Joi.string().required(),
  value: Joi.alternatives()
    .try(
      Joi.string(),
      Joi.number(),
      Joi.date(),
      Joi.array().items(Joi.string(), Joi.number(), Joi.date())
    )
    .required(),
});

const identifiersSchema = Joi.array().items(
  Joi.object({
    name: Joi.string().required(),
    value: Joi.string().required(),
  })
);

const parametersSchema = Joi.object({
  values: Joi.array().items(executeQueryParamSchema).optional(),
  identifiers: identifiersSchema.optional(),
});

export const executeQueryValidation = {
  body: Joi.object({
    id: Joi.number().required(),
    parameters: parametersSchema.optional(),
  }),
};

// Validation schema for the path parameter 'id'
const pathParamSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "ID must be a number",
    "number.integer": "ID must be an integer",
    "any.required": "ID is required",
  }),
});

export const getQueryByIdValidation = {
  params: pathParamSchema,
};
