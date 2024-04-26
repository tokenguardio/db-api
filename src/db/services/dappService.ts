import Dapp, { DappInitializer } from "../models/public/Dapp";
import { externalKnexInstances } from "../knex-instances";
import { v4 as uuidv4 } from "uuid";
import * as BlockchainService from "./blockchainService";

export const createDapp = async (dappData: DappInitializer): Promise<Dapp> => {
  const id = dappData.id || uuidv4();
  const [createdDapp] = await externalKnexInstances["crosschain"]("dapps_dict")
    .insert({ ...dappData, id })
    .returning("*");
  return createdDapp;
};

export const createDappWithBlockchains = async (
  dappData: DappInitializer
): Promise<Dapp> => {
  const { blockchains, ...dataForDb } = dappData;
  console.log("log dataForDb", dataForDb);

  const dapp = await createDapp(dataForDb);

  if (blockchains && blockchains.length > 0) {
    const blockchainIds = await Promise.all(
      blockchains.map(async (slug) => {
        const blockchain = await BlockchainService.getBlockchainBySlug(slug);
        if (!blockchain)
          throw new Error(`Blockchain not found for slug: ${slug}`);
        return blockchain.id;
      })
    );

    await Promise.all(
      blockchainIds.map((blockchainId) =>
        addDappToBlockchain(dapp.id, blockchainId)
      )
    );
  }

  return dapp;
};

export const upsertDapp = async (data: DappInitializer): Promise<string> => {
  const id = data.id || uuidv4();
  const upsertData = {
    ...data,
    id,
    updated_at: new Date(),
  };

  const [result] = await externalKnexInstances["crosschain"]<Dapp>("dapps_dict")
    .insert(upsertData)
    .onConflict("name")
    .merge()
    .returning("id");

  return result.id;
};

export const getById = async (id: string): Promise<Dapp | undefined> => {
  try {
    const dapp = await externalKnexInstances["crosschain"]("dapps_dict")
      .where("id", id)
      .first();

    if (!dapp) {
      return undefined;
    }

    const blockchains = await externalKnexInstances["crosschain"](
      "blockchains_dict"
    )
      .join(
        "dapps_blockchains",
        "blockchains_dict.id",
        "=",
        "dapps_blockchains.blockchain_id"
      )
      .where("dapps_blockchains.dapp_id", dapp.id)
      .select(
        "blockchains_dict.name",
        "blockchains_dict.network",
        "blockchains_dict.slug",
        "blockchains_dict.logo"
      );

    return { ...dapp, blockchains };
  } catch (error) {
    console.error("Error fetching dapp by ID:", error);
    throw error;
  }
};

export const getAll = async (queryFilters: any): Promise<Dapp[]> => {
  try {
    const dapps = await externalKnexInstances["crosschain"]("dapps_dict")
      .where(queryFilters)
      .distinct();

    const results = await Promise.all(
      dapps.map(async (dapp) => {
        const blockchains = await externalKnexInstances["crosschain"](
          "blockchains_dict"
        )
          .join(
            "dapps_blockchains",
            "blockchains_dict.id",
            "=",
            "dapps_blockchains.blockchain_id"
          )
          .where("dapps_blockchains.dapp_id", dapp.id)
          .select(
            "blockchains_dict.name",
            "blockchains_dict.network",
            "blockchains_dict.slug",
            "blockchains_dict.logo"
          );

        return { ...dapp, blockchains };
      })
    );

    return results;
  } catch (error) {
    console.error("Error fetching all dapps:", error);
    throw error;
  }
};

export const getBySlug = async (slug: string): Promise<Dapp | undefined> => {
  try {
    const dapp = await externalKnexInstances["crosschain"]("dapps_dict")
      .where("slug", slug)
      .first();

    if (!dapp) {
      return undefined;
    }

    const blockchains = await externalKnexInstances["crosschain"](
      "blockchains_dict"
    )
      .join(
        "dapps_blockchains",
        "blockchains_dict.id",
        "=",
        "dapps_blockchains.blockchain_id"
      )
      .where("dapps_blockchains.dapp_id", dapp.id)
      .select(
        "blockchains_dict.name",
        "blockchains_dict.network",
        "blockchains_dict.slug",
        "blockchains_dict.logo"
      );

    return {
      ...dapp,
      blockchains,
    };
  } catch (error) {
    console.error("Error fetching dapp by slug:", error);
    throw error;
  }
};

export const getByName = async (name: string): Promise<Dapp | undefined> => {
  try {
    const dapp = await externalKnexInstances["crosschain"]("dapps_dict")
      .where("name", name)
      .first();

    if (!dapp) {
      return undefined;
    }

    const blockchains = await externalKnexInstances["crosschain"](
      "blockchains_dict"
    )
      .join(
        "dapps_blockchains",
        "blockchains_dict.id",
        "=",
        "dapps_blockchains.blockchain_id"
      )
      .where("dapps_blockchains.dapp_id", dapp.id)
      .select(
        "blockchains_dict.name",
        "blockchains_dict.network",
        "blockchains_dict.slug",
        "blockchains_dict.logo"
      );

    return { ...dapp, blockchains };
  } catch (error) {
    console.error("Error fetching dapp by name:", error);
    throw error;
  }
};

export const update = async (
  id: string,
  data: Partial<DappInitializer>
): Promise<Dapp | null> => {
  const [result] = await externalKnexInstances["crosschain"]("dapps_dict")
    .where("id", id)
    .update(data)
    .returning("*");

  if (!result) {
    console.error("No Dapp found with ID:", id);
    return null;
  }

  return result;
};

export const deleteDapp = async (id: string): Promise<void> => {
  try {
    const deletedRows = await externalKnexInstances["crosschain"]("dapps_dict")
      .where("id", id)
      .del();
    if (deletedRows === 0) {
      console.error("No Dapp found or deleted with ID:", id);
    }
  } catch (error) {
    console.error("Error deleting Dapp:", error);
    throw error;
  }
};

export const addDappToBlockchain = async (
  dapp_id: string,
  blockchain_id: string
): Promise<void> => {
  await externalKnexInstances["crosschain"]("dapps_blockchains").insert({
    dapp_id,
    blockchain_id,
  });
};

export const removeDappFromBlockchain = async (
  dapp_id: string,
  blockchain_id: string
): Promise<void> => {
  await externalKnexInstances["crosschain"]("dapps_blockchains")
    .where({ dapp_id, blockchain_id })
    .del();
};
