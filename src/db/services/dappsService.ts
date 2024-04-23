import Dapp, { DappInitializer } from "../models/public/Dapps";
import { internalKnexInstance } from "../knex-instances";

export const createDapp = async (
  data: DappInitializer
): Promise<Pick<Dapp, "id">> => {
  const [result] = await internalKnexInstance<Dapp>("dapps")
    .insert(data)
    .returning("id");
  return result;
};

export const upsertDapp = async (data: DappInitializer): Promise<number> => {
  const { name, ...restOfData } = data; // Assuming 'name' is unique and used for upsert
  const insertData = internalKnexInstance("dapps")
    .insert({ name, ...restOfData })
    .toString();
  const onConflictUpdate = internalKnexInstance("dapps")
    .update(restOfData)
    .toString();

  // Raw upsert query combining the insert and update operations
  const rawUpsertQuery = `${insertData} ON CONFLICT (name) DO UPDATE SET ${onConflictUpdate.substring(
    onConflictUpdate.indexOf("SET") + 4
  )} RETURNING id`;

  const [result] = await internalKnexInstance.raw(rawUpsertQuery);
  return result.id as number; // Cast result.id to number since id is a numeric type
};
