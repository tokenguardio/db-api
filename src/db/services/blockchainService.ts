import Blockchain, { BlockchainInitializer } from "../models/public/Blockchain";
import { externalKnexInstances } from "../knex-instances";
import { v4 as uuidv4 } from "uuid";

export const createBlockchain = async (
  blockchainData: BlockchainInitializer
): Promise<Blockchain> => {
  const id = blockchainData.id || uuidv4();
  const [newBlockchain] = await externalKnexInstances["crosschain"](
    "blockchains_dict"
  )
    .insert({ ...blockchainData, id })
    .returning("*");
  return newBlockchain;
};

export const upsertBlockchain = async (
  blockchainData: BlockchainInitializer
): Promise<Blockchain> => {
  const existing = await externalKnexInstances["crosschain"]("blockchains_dict")
    .where({ name: blockchainData.name, network: blockchainData.network })
    .first();

  if (existing) {
    const [updatedBlockchain] = await externalKnexInstances["crosschain"](
      "blockchains_dict"
    )
      .where({ name: blockchainData.name, network: blockchainData.network })
      .update(blockchainData)
      .returning("*");
    return updatedBlockchain;
  } else {
    return await createBlockchain(blockchainData);
  }
};

export const getAllWithGrowthIndex = async (): Promise<Blockchain[]> => {
  return await externalKnexInstances["crosschain"]("blockchains_dict").where({
    growthindex: true,
    active: true,
  });
};

export const getBlockchainById = async (
  id: string
): Promise<Blockchain | null> => {
  const blockchain = await externalKnexInstances["crosschain"](
    "blockchains_dict"
  )
    .where({ id })
    .first();
  return blockchain;
};

export const getAllBlockchains = async (
  queryFilters: any
): Promise<Blockchain[]> => {
  return await externalKnexInstances["crosschain"]("blockchains_dict").where(
    queryFilters
  );
};

export const getBlockchainByNameAndNetwork = async (
  name: string,
  network: string
): Promise<Blockchain | null> => {
  return await externalKnexInstances["crosschain"]("blockchains_dict")
    .where({ name, network })
    .first();
};

export const getBlockchainBySlug = async (
  slug: string
): Promise<Blockchain | null> => {
  const blockchain = await externalKnexInstances["crosschain"](
    "blockchains_dict"
  )
    .where({ slug })
    .first();

  return blockchain;
};

export const updateBlockchain = async (
  id: string,
  data: Partial<Blockchain>
): Promise<Blockchain> => {
  const [updatedBlockchain] = await externalKnexInstances["crosschain"](
    "blockchains_dict"
  )
    .where({ id })
    .update(data)
    .returning("*");
  return updatedBlockchain;
};

export const deleteBlockchain = async (id: string): Promise<void> => {
  await externalKnexInstances["crosschain"]("blockchains_dict")
    .where({ id })
    .del();
};
