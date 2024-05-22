import Joi from "joi";

const abiSchema = Joi.object().pattern(Joi.string(), Joi.object());

export const saveDappValidation = {
  body: Joi.object({
    name: Joi.string().required(),
    logo: Joi.string().allow(null, ""),
    blockchain: Joi.string().required(),
    website: Joi.string().uri().allow(null, ""),
    fromBlock: Joi.number().integer().allow(null),
    addedBy: Joi.string().allow(null),
    abis: abiSchema.required(),
  }),
};

export const getDappByIdValidation = {
  params: Joi.object({
    id: Joi.string()
      .guid({
        version: ["uuidv4"],
      })
      .required(),
  }),
};

export const updateDappValidation = {
  getDappByIdValidation,
  body: Joi.object({
    name: Joi.string().optional(),
    logo: Joi.string().allow(null, ""),
    blockchain: Joi.string().optional(),
    website: Joi.string().uri().allow(null, ""),
    fromBlock: Joi.number().integer().allow(null),
    addedBy: Joi.string().allow(null),
    abis: abiSchema,
  }),
};
