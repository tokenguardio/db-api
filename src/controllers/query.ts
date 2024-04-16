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
import { extractQueryParameters } from "../utils/queryUpdater";
import {
  constructSQLQuery,
  selectDatabaseForQuery,
} from "../db/helper/queryExecutor";

export const saveQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const requestBody = req.body as SaveQueryRequestBody;
  const { query, databases, label, parameters, description } = requestBody;

  const values = parameters?.values ?? [];

  // Handle databases being either a string or an array of strings
  const databasesList = Array.isArray(databases) ? databases : [databases];

  // Check if the specified databases exist in pgInstances
  const allDatabasesExist = databasesList.every(
    (db) => externalKnexConfigs[db]
  );
  if (!allDatabasesExist) {
    return res.status(400).json({
      message: "One or more specified databases are not available",
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

  const serializedDatabases =
    databasesList.length === 1
      ? databasesList[0]
      : JSON.stringify(databasesList);

  try {
    const queryId = await queriesDbQueryService.saveQuery(
      decodedQuery,
      serializedDatabases,
      label,
      serializedParameters as any,
      description || null
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
  const {
    id,
    parameters = { values: [], identifiers: [] },
    database,
  } = requestBody;

  let sqlQuery: string;
  const bindConfig: BindConfig = {};

  try {
    const savedQuery = await queriesDbQueryService.getSavedQuery(id);

    if (!savedQuery) {
      return res.status(404).send({ message: "Query not found" });
    }

    const { values: savedValues = [], identifiers: savedIdentifiers = [] } =
      savedQuery?.parameters ?? {};

    console.log("log savedQuery", savedQuery);

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

    sqlQuery = constructSQLQuery(savedQuery, providedValues, bindConfig);

    providedIdentifiers.forEach((item) => {
      bindConfig[item.name] = item.value;
    });

    const { selectedDatabase, error } = selectDatabaseForQuery(
      savedQuery,
      database
    );
    if (error) {
      return res.status(400).json({ message: error });
    }

    const result = await dataDbQueryService.executeQuery(
      selectedDatabase,
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

export const getQueryById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const id = Number(req.params.id);

  try {
    const savedQuery = await queriesDbQueryService.getSavedQuery(id);

    if (!savedQuery) {
      return res.status(404).json({ message: "Query not found" });
    }

    return res
      .status(200)
      .json({ data: savedQuery, message: "Query retrieved successfully" });
  } catch (error) {
    console.error("Error retrieving the query:", error);
    return res.status(500).json({
      message: "Error occurred while retrieving the query",
    });
  }
};

export const updateQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Number(req.params.id);
    console.log(`[Controller] Updating query for ID: ${id}`);

    const { query: base64Query, databases, label, parameters } = req.body;
    console.log("[Controller] Received update request with:", {
      base64Query,
      databases,
      label,
      parameters,
    });

    // Additional check for base64 encoding
    if (
      base64Query &&
      !Buffer.from(base64Query, "base64").toString("base64") === base64Query
    ) {
      console.error("[Controller] Base64 query encoding is invalid");
      return res.status(400).json({ message: "Invalid base64 query encoding" });
    }

    const decodedQuery = base64Query
      ? Buffer.from(base64Query, "base64").toString("utf8")
      : undefined;
    console.log(`[Controller] Decoded query: ${decodedQuery}`);

    const updateResult = await queriesDbQueryService.updateQuery(
      id,
      decodedQuery,
      databases,
      label,
      parameters
    );
    console.log(`[Controller] Update result for ID ${id}:`, updateResult);

    if (updateResult) {
      return res
        .status(200)
        .json({ id, message: "Query updated successfully" });
    } else {
      console.log(
        "[Controller] Update failed, possibly due to the query not being found."
      );
      return res.status(404).json({ message: "Query not found" });
    }
  } catch (error) {
    console.error("[Controller] Error processing the update:", error);
    return res.status(500).json({
      message: error.message || "Error occurred while updating the query",
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
