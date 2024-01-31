import { Request, Response } from "express";
import * as queriesDbQueryService from "../db/services/queriesDbQueryService";
import * as dataDbQueryService from "../db/services/dataDbQueryService";
import externalKnexConfigs from "../../knexfile-external";
import {
  SaveQueryRequestBody,
  ExecuteQueryRequestBody,
  BindConfig,
  StoredParameters,
  SingleValue,
  ValueArray,
} from "../types/queries";

export const saveQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const requestBody = req.body as SaveQueryRequestBody;
  const { query, database, label, parameters } = requestBody;

  const values = parameters?.values ?? [];

  // Check if the specified database exists in pgInstances
  if (!externalKnexConfigs[database]) {
    return res.status(400).json({
      message: "Specified database is not available",
    });
  }

  const decodedQuery = Buffer.from(query, "base64").toString("utf8");

  // Matches :var but not :var:
  const valuePattern = /(?<!:):\b\w+\b(?!\:)/g;
  const extractedValueNames = extractQueryParameters(
    decodedQuery,
    valuePattern
  );

  if (extractedValueNames.length !== values.length) {
    return res
      .status(400)
      .send({ message: "Incorrect number of value parameters provided" });
  }

  for (const valueName of extractedValueNames) {
    if (!parameters.values.some((param) => param.name === valueName)) {
      return res
        .status(400)
        .send({ message: `Value parameter '${valueName}' is missing` });
    }
  }

  // Matches :var:
  const identifierPattern = /(?<!:):\b\w+\b(?=:)/g;
  const extractedIdentifiers = extractQueryParameters(
    decodedQuery,
    identifierPattern
  );

  let parametersToStore: StoredParameters | null = null;

  if (extractedIdentifiers.length > 0 || (parameters && values.length > 0)) {
    parametersToStore = {
      identifiers: extractedIdentifiers,
      values: values,
    };
  }

  const serializedParameters = parametersToStore
    ? JSON.stringify(parametersToStore)
    : null;

  try {
    const queryId = await queriesDbQueryService.saveQuery(
      decodedQuery,
      database,
      label,
      serializedParameters as any
    );

    return res
      .status(201)
      .json({ data: queryId, message: "Query saved successfully" });
  } catch (error) {
    console.error("Error saving the query:", error);
    return res.status(500).json({
      message: "Error occurred while saving the query",
    });
  }
};

export const executeQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const requestBody = req.body as ExecuteQueryRequestBody;
  const { id, parameters = { values: [], identifiers: [] } } = requestBody;

  let sqlQuery: string;
  const bindConfig: BindConfig = {};

  try {
    const savedQuery = await queriesDbQueryService.getSavedQuery(id);

    if (!savedQuery) {
      return res.status(404).send({ message: "Query not found" });
    }

    const { values: savedValues = [], identifiers: savedIdentifiers = [] } =
      savedQuery?.parameters ?? {};

    const {
      values: providedValues = [],
      identifiers: providedIdentifiers = [],
    } = parameters;

    // Validate the count of values and identifiers
    if (savedValues.length !== providedValues.length) {
      return res
        .status(400)
        .send({ message: "Incorrect number of value parameters provided" });
    }

    // Validate the count of values and identifiers
    if (savedIdentifiers.length !== providedIdentifiers.length) {
      return res
        .status(400)
        .send({ message: "Incorrect number of identifiers provided" });
    }

    // Validate names and types of provided value parameters
    for (const savedValue of savedValues) {
      const providedValue = providedValues.find(
        (v) => v.name === savedValue.name
      );
      if (!providedValue) {
        return res
          .status(400)
          .send({ message: `Value parameter '${savedValue.name}' is missing` });
      }
      if (
        !providedValue ||
        !isValueOfType(providedValue.value, savedValue.type)
      ) {
        return res.status(400).send({
          message: `Invalid or missing value parameter '${savedValue.name}'`,
        });
      }
    }

    // Validate names of provided identifiers
    for (const savedIdentifier of savedIdentifiers) {
      const providedIdentifier = providedIdentifiers.find(
        (i) => i.name === savedIdentifier
      );
      if (!providedIdentifier) {
        return res
          .status(400)
          .send({ message: `Identifier '${savedIdentifier}' is missing` });
      }
    }

    sqlQuery = savedQuery.query;

    const uniqueArraySuffix = "_arr_";
    providedValues.forEach((item) => {
      if (Array.isArray(item.value)) {
        item.value.forEach((val, index) => {
          bindConfig[`${item.name}${uniqueArraySuffix}${index}`] = val;
        });
        sqlQuery = sqlQuery.replace(
          new RegExp(`:${item.name}`, "g"),
          item.value
            .map((_, index) => `:${item.name}${uniqueArraySuffix}${index}`)
            .join(", ")
        );
      } else {
        bindConfig[item.name] = item.value;
      }
    });

    providedIdentifiers.forEach((item) => {
      bindConfig[item.name] = item.value;
    });

    const result = await dataDbQueryService.executeQuery(
      savedQuery.database,
      sqlQuery,
      bindConfig
    );

    return res.status(200).json({ data: result, message: "Query executed" });
  } catch (error) {
    console.error("Error executing the query:", error);
    // Include the SQL query and values in the error response
    return res.status(500).send({
      message: "Error executing the query",
      sqlQuery: sqlQuery,
      bindConfig: bindConfig,
      error: error.message,
    });
  }
};

const isValueOfType = (
  value: SingleValue | ValueArray,
  type: string
): boolean => {
  switch (type) {
    case "number":
      return typeof value === "number" && !isNaN(value);
    case "string":
      return typeof value === "string";
    case "date":
      return typeof value === "string" && !isNaN(Date.parse(value));
    case "number[]":
      return (
        Array.isArray(value) &&
        value.every((item) => typeof item === "number" && !isNaN(item))
      );
    case "string[]":
      return (
        Array.isArray(value) && value.every((item) => typeof item === "string")
      );
    case "date[]":
      return (
        Array.isArray(value) &&
        value.every(
          (item) => typeof item === "string" && !isNaN(Date.parse(item))
        )
      );
    default:
      return false;
  }
};

function extractQueryParameters(
  decodedQuery: string,
  pattern: RegExp
): string[] {
  const matches = decodedQuery.matchAll(pattern);
  return Array.from(
    new Set([...matches].map((match) => match[0].replace(/:/g, "")))
  );
}
