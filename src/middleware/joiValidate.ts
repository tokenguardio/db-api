import Joi from "joi";
import httpStatus from "http-status";
import { Request, Response, NextFunction } from "express";

interface ValidSchema {
  params?: any;
  query?: any;
  body?: any;
}

class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

const keyExistsInObject = (
  object: { [key: string]: any },
  key: string
): boolean => {
  return object && Object.prototype.hasOwnProperty.call(object, key);
};

const assignKeyValueToObject = (
  obj: { [key: string]: any },
  key: string,
  value: any
): { [key: string]: any } => {
  obj[key] = value;
  return obj;
};

const pickKeysFromObject = (
  object: { [key: string]: any },
  keys: string[]
): { [key: string]: any } => {
  return keys.reduce((obj: { [key: string]: any }, key: string) => {
    if (keyExistsInObject(object, key)) {
      obj = assignKeyValueToObject(obj, key, object[key]);
    }
    return obj;
  }, {});
};

const getValidSchema = (schema: ValidSchema): ValidSchema => {
  return pickKeysFromObject(schema, ["params", "query", "body"]) as ValidSchema;
};

const getObjectToValidate = (req: Request, schema: ValidSchema) => {
  return pickKeysFromObject(req, Object.keys(schema));
};

const validateSchema = (schema: ValidSchema, object: any) => {
  return Joi.compile(schema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object);
};

const formatError = (error: any) => {
  return error.details.map((details: any) => details.message).join(", ");
};

export const validate =
  (schema: ValidSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const validSchema = getValidSchema(schema);
    const object = getObjectToValidate(req, validSchema);
    const { value, error } = validateSchema(validSchema, object);

    if (error) {
      const errorMessage = formatError(error);
      return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
    }
    Object.assign(req, value);
    return next();
  };
