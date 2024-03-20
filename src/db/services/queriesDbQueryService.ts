import Queries from "../models/public/Queries";
import { internalKnexInstance } from "../knex-instances";
import { StoredParameters } from "queries";

export const saveQuery = async (
  query: string,
  database: string,
  label: string,
  parameters: StoredParameters,
  description?: string
): Promise<Pick<Queries, "id">> => {
  const [result] = await internalKnexInstance("queries")
    .insert({
      query,
      database,
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
