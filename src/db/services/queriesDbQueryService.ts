import Queries from "../models/public/Queries";
import { internalKnexInstance } from "../knex-instances";
import { StoredParameters } from "queries";

export const saveQuery = async (
  query: string,
  databases: string,
  label: string,
  parameters: StoredParameters,
  description?: string
): Promise<Pick<Queries, "id">> => {
  const serializedDatabases = Array.isArray(databases)
    ? JSON.stringify(databases)
    : databases;

  const [result] = await internalKnexInstance("queries")
    .insert({
      query,
      databases: serializedDatabases,
      label,
      parameters,
      description,
    })
    .returning("id");

  return result;
};

export const getSavedQuery = async (id: number): Promise<Queries> => {
  const savedQuery = await internalKnexInstance("queries")
    .where("id", id)
    .first();

  return savedQuery;
};

export const updateQuery = async (
  id: number,
  query?: string,
  databases?: string,
  label?: string,
  parameters?: StoredParameters
): Promise<boolean> => {
  try {
    const currentQuery = await internalKnexInstance("queries")
      .where("id", id)
      .first();

    if (!currentQuery) {
      console.log("[Model] Query not found for ID:", id);
      return false;
    }
    console.log("[Model] Current query found:", currentQuery);

    let versionHistory;
    try {
      versionHistory =
        typeof currentQuery.version_history === "string"
          ? JSON.parse(currentQuery.version_history)
          : currentQuery.version_history || [];
      console.log(
        "[Model] Version history after checking type:",
        versionHistory
      );
    } catch (error) {
      console.error("[Model] Failed to parse version history:", error);
      return false;
    }

    const currentVersion = {
      query: currentQuery.query,
      databases: currentQuery.databases,
      label: currentQuery.label,
      parameters: currentQuery.parameters,
      updatedAt: currentQuery.updated_at,
    };
    console.log("[Model] Adding current version to history:", currentVersion);

    versionHistory.push(currentVersion);

    const newVersion = {
      query: query || currentQuery.query,
      databases: databases || currentQuery.databases,
      label: label || currentQuery.label,
      parameters: parameters || currentQuery.parameters,
      updatedAt: new Date(),
    };
    console.log("[Model] New version prepared:", newVersion);

    const updates = {
      ...(query !== undefined && { query }),
      ...(databases !== undefined && { databases }),
      ...(label !== undefined && { label }),
      ...(parameters !== undefined && { parameters }),
      version_history: JSON.stringify(versionHistory),
      updated_at: new Date(),
    };
    console.log("[Model] Updates to be applied:", updates);

    await internalKnexInstance("queries").where("id", id).update(updates);
    console.log("[Model] Update applied successfully for ID:", id);

    return true;
  } catch (error) {
    console.error("[Model] Error updating the query:", error);
    return false;
  }
};
