import Joi from "joi";

export const createSegment = {
  body: Joi.object({
    dappId: Joi.string().required(),
    segmentId: Joi.string().required(),
    segmentName: Joi.string().required(),
    filters: Joi.object({
      isAirdropRecipient: Joi.boolean().optional(),
      airdropTokenAddress: Joi.string().optional(),
      airdropValueMin: Joi.number().optional(),
      airdropValueMax: Joi.number().optional(),
      firstAirdropTimestampMin: Joi.date().allow(null).optional(),
      firstAirdropTimestampMax: Joi.date().allow(null).optional(),
      otherDappsUsed: Joi.array().items(Joi.string()).optional(),
      firstInteractionMin: Joi.date().allow(null).optional(),
      firstInteractionMax: Joi.date().allow(null).optional(),
      usedFunctions: Joi.array().items(Joi.string()).optional(),
      lastObservationMin: Joi.date().allow(null).optional(),
      lastObservationMax: Joi.date().allow(null).optional(),
    }).optional(),
  }),
};
