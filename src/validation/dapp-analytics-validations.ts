import Joi from "joi";
import { Abi as SubsquidInkAbi } from "@subsquid/ink-abi";
import { Interface as SubsquidEvmAbi, isAddress as isEvmAddress } from "ethers";
import { decodeAddress as decodeSubstrateAddress } from "@polkadot/keyring";

// Validator for Substrate addresses
const substrateAddressValidator = Joi.extend((joi) => ({
  type: "substrateAddress",
  base: joi.string(),
  messages: {
    "substrateAddress.base": "{{#label}} must be a valid Substrate address",
  },
  validate(value, helpers) {
    try {
      decodeSubstrateAddress(value);
      return { value };
    } catch (error) {
      return { errors: helpers.error("substrateAddress.base") };
    }
  },
}));

// Validator for EVM addresses
const evmAddressValidator = Joi.extend((joi) => ({
  type: "evmAddress",
  base: joi.string(),
  messages: {
    "evmAddress.base": "{{#label}} must be a valid EVM address",
  },
  validate(value, helpers) {
    try {
      if (isEvmAddress(value)) {
        return { value };
      } else {
        return { errors: helpers.error("evmAddress.base") };
      }
    } catch (error) {
      return { errors: helpers.error("evmAddress.base") };
    }
  },
}));

// Validator for Subsquid Ink ABI (object)
const subsquidInkAbiValidator = Joi.extend((joi) => ({
  type: "subsquidInkAbi",
  base: joi.object(),
  messages: {
    "subsquidInkAbi.validate":
      "{{#label}} does not conform to Subsquid Ink ABI format",
  },
  validate(value, helpers) {
    try {
      new SubsquidInkAbi(value);
      return { value };
    } catch (error) {
      return { errors: helpers.error("subsquidInkAbi.validate") };
    }
  },
}));

// Validator for EVM ABI (array)
const subsquidEvmAbiValidator = Joi.extend((joi) => ({
  type: "subsquidEvmAbi",
  base: joi.array(),
  messages: {
    "subsquidEvmAbi.validate":
      "{{#label}} does not conform to Subsquid EVM ABI format",
  },
  validate(value, helpers) {
    try {
      new SubsquidEvmAbi(value); // This line checks the validity of the ABI
      return { value };
    } catch (error) {
      return { errors: helpers.error("subsquidEvmAbi.validate") };
    }
  },
}));

// Combined ABI Validator
const abiSchema = Joi.array().items(
  Joi.object({
    name: Joi.string(),
    address: Joi.alternatives()
      .try(
        substrateAddressValidator.substrateAddress(),
        evmAddressValidator.evmAddress()
      )
      .required(),
    abi: Joi.alternatives()
      .try(
        subsquidInkAbiValidator.subsquidInkAbi(),
        subsquidEvmAbiValidator.subsquidEvmAbi()
      )
      .required(),
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
