import Joi from "joi";

export interface Validation {
  body?: Joi.Schema;
  params?: Joi.Schema;
  query?: Joi.Schema;
}
