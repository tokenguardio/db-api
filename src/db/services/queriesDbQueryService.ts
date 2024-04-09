import Queries from "../models/public/Queries";
import { internalKnexInstance } from "../knex-instances";
import { StoredParameters } from "queries";

export const saveQuery = async (
  query: string,
  database: string,
  label: string,
  parameters: StoredParameters
): Promise<Pick<Queries, "id">> => {
  const [result] = await internalKnexInstance("queries")
    .insert({
      query,
      database,
      label,
      parameters,
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
  database?: string,
  label?: string,
  parameters?: StoredParameters
): Promise<boolean> => {
  try {
    // Fetch the current state of the query for version history
    const currentQuery = await internalKnexInstance("queries")
      .where("id", id)
      .first();

    if (!currentQuery) {
      console.log("Query not found");
      return false; // Query not found, indicate failure
    }

    // Prepare the current state as a new version history entry
    const newVersion = {
      query: currentQuery.query,
      database: currentQuery.database,
      label: currentQuery.label,
      parameters: currentQuery.parameters,
      updatedAt: currentQuery.updated_at,
    };

    // Parse existing version history and add the new version
    const versionHistory = currentQuery.version_history
      ? [...currentQuery.version_history, newVersion]
      : [newVersion];

    // Construct the updates, including the new version history
    const updates = {
      ...(query !== undefined && { query }),
      ...(database !== undefined && { database }),
      ...(label !== undefined && { label }),
      ...(parameters !== undefined && { parameters }), // Assuming direct assignment works with your DB setup
      version_history: versionHistory, // Include the updated version history
      updated_at: new Date(),
    };

    // Execute the update operation
    await internalKnexInstance("queries").where("id", id).update(updates);

    return true; // Indicate success
  } catch (error) {
    console.error("Error updating the query:", error);
    return false; // Indicate failure due to an error
  }
};
