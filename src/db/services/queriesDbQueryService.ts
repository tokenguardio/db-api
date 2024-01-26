import knex from "knex";
import Queries from "../models/public/Queries";
import internalKnexConfig from "../../../knexfile";
import { StoredParameters } from "queries";

export const saveQuery = async (
  query: string,
  database: string,
  label: string,
  parameters: StoredParameters
): Promise<Pick<Queries, "id">> => {
  const [result] = await knex(internalKnexConfig)("queries")
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
  const savedQuery = await knex(internalKnexConfig)("queries")
    .where("id", id)
    .first();

  return savedQuery;
};
