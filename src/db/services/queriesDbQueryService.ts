import knex from "knex";
import Queries from "../models/public/Queries";
import { Parameters } from "../../types/queries";
import internalKnexConfig from "../../../knexfile";

export const saveQuery = async (
  query: string,
  database: string,
  parameters: Parameters
): Promise<Pick<Queries, "id">> => {
  const [result] = await knex(internalKnexConfig)("queries")
    .insert({
      query,
      database,
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
