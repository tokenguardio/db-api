import Joi from "joi";
import { Validation } from "./validationInterface";

export const groupByOperationValidation: Validation = {
  params: Joi.object({
    dbname: Joi.string().required(),
    schema: Joi.string().required(),
    table: Joi.string().required(),
  }),
  body: Joi.object({
    groupByColumns: Joi.array().items(
      Joi.object({
        columnName: Joi.string().required(),
      })
    ),
    aggregateColumns: Joi.array().items(
      Joi.object({
        columnName: Joi.string().required(),
        operator: Joi.string().required(),
      })
    ),
    filters: Joi.array().items(
      Joi.object({
        columnName: Joi.string().required(),
        filterValue: Joi.alternatives()
          .try(
            Joi.string(),
            Joi.object({
              start: Joi.string().required(),
              end: Joi.string().required(),
            })
          )
          .required(),
      })
    ),
  }).required(),
};
