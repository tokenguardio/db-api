import Joi from "joi";
import { Abi as SubsquidAbi } from "@subsquid/ink-abi";
import { decodeAddress } from "@polkadot/keyring";

const substrateAddressValidator = Joi.extend((joi) => ({
  type: "substrateAddress",
  base: joi.string(),
  messages: {
    "substrateAddress.base": "{{#label}} must be a valid Substrate address",
  },
  validate(value, helpers) {
    try {
      decodeAddress(value);
      return { value };
    } catch (error) {
      return { errors: helpers.error("substrateAddress.base") };
    }
  },
}));

const subsquidAbiValidator = Joi.extend((joi) => ({
  type: "subsquidAbi",
  base: joi.object(),
  messages: {
    "subsquidAbi.validate":
      "{{#label}} does not conform to Subsquid ABI format",
  },
  validate(value, helpers) {
    try {
      new SubsquidAbi(value);
      return { value };
    } catch (error) {
      return { errors: helpers.error("subsquidAbi.validate") };
    }
  },
}));

const abiSchema = Joi.array().items(
  Joi.object({
    name: Joi.string(),
    address: substrateAddressValidator.substrateAddress().required(),
    abi: subsquidAbiValidator.subsquidAbi().required(),
  })
);

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
    id: Joi.string().uuid().required(),
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

export const dappDataMetricsValidation = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
    metric: Joi.string().valid("wallets", "transferredTokens", "interactions"),
  }),
  body: Joi.object({
    breakdown: Joi.boolean().default(false),
    filters: Joi.array().items(
      Joi.object({
        name: Joi.string(),
        type: Joi.string().valid("call", "event"),
        args: Joi.object().pattern(
          Joi.string(),
          Joi.object({
            type: Joi.string().valid("integer", "string", "boolean").required(),
            conditions: Joi.array().items(
              Joi.object({
                operator: Joi.string()
                  .valid(">", "<", ">=", "<=", "=", "!=")
                  .required(),
                value: Joi.alternatives().try(
                  Joi.boolean(),
                  Joi.number(),
                  Joi.string().allow("")
                ),
              })
            ),
            value: Joi.alternatives().try(
              Joi.boolean(),
              Joi.number(),
              Joi.string().allow("")
            ),
          })
        ),
      })
    ),
  }),
};

export const getDappIndexingStatusValidation = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};
