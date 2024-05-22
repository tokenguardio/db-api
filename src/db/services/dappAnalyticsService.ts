import Dapps, {
  DappsInitializer,
  DappsMutator,
} from "../models/dapp_analytics/Dapps";
import { externalKnexInstances } from "../knex-instances";

export const saveDapp = async (
  dappData: DappsInitializer
): Promise<Pick<Dapps, "id">> => {
  try {
    const [result] = await externalKnexInstances["azero_mainnet_squid"]
      .insert({
        name: dappData.name,
        logo: dappData.logo,
        blockchain: dappData.blockchain,
        website: dappData.website,
        from_block: dappData.from_block,
        added_by: dappData.added_by,
        abis: JSON.stringify(dappData.abis),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .into("dapps")
      .returning("id");

    return result;
  } catch (error) {
    console.error("Error saving the dApp:", error);
    throw error;
  }
};

export const getDapp = async (id: string): Promise<Dapps | undefined> => {
  const dapp = await externalKnexInstances["azero_mainnet_squid"]
    .from("dapps")
    .where("id", id)
    .first();

  return dapp;
};

export const getAllDapps = async (): Promise<Dapps[] | undefined> => {
  try {
    const dapps = await externalKnexInstances["azero_mainnet_squid"]
      .select()
      .from("dapps");
    return dapps;
  } catch (error) {
    console.error("Failed to retrieve all dApps:", error);
    throw error;
  }
};

export const updateDapp = async (
  id: string,
  dappData: DappsMutator
): Promise<boolean> => {
  try {
    const updateCount = await externalKnexInstances["azero_mainnet_squid"]
      .from("dapps")
      .where("id", id)
      .update({
        name: dappData.name,
        logo: dappData.logo,
        blockchain: dappData.blockchain,
        website: dappData.website,
        from_block: dappData.from_block,
        added_by: dappData.added_by,
        abis: dappData.abis ? JSON.stringify(dappData.abis) : undefined,
        updated_at: new Date(),
      });

    return updateCount > 0;
  } catch (error) {
    console.error("Error updating the dApp:", error);
    return false;
  }
};
