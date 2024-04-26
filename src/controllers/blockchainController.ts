import { Request, Response } from "express";
import * as blockchainService from "../db/services/blockchainService";

export const createBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const blockchainData = req.body;
    const blockchain = await blockchainService.createBlockchain(blockchainData);
    return res.status(201).json({
      message: "Blockchain created successfully",
      blockchain,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const upsertBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const blockchainData = req.body;
    const blockchain = await blockchainService.upsertBlockchain(blockchainData);
    return res.status(200).json({
      message: "Blockchain upserted successfully",
      blockchain,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockchainsWithGrowthIndex = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const blockchains = await blockchainService.getAllWithGrowthIndex();
    return res.status(200).json(blockchains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockchainById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const blockchain = await blockchainService.getBlockchainById(id);
    if (!blockchain) {
      return res.status(404).json({ message: "Blockchain not found" });
    }
    return res.status(200).json(blockchain);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllBlockchains = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const queryFilters = req.query; // Ensure these are parsed and sanitized appropriately
    const blockchains = await blockchainService.getAllBlockchains(queryFilters);
    return res.status(200).json(blockchains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockchainByNameAndNetwork = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, network } = req.query;

    if (typeof name !== "string" || typeof network !== "string") {
      return res.status(400).json({ message: "Invalid request parameters" });
    }

    const blockchain = await blockchainService.getBlockchainByNameAndNetwork(
      name,
      network
    );
    if (!blockchain) {
      return res.status(404).json({ message: "Blockchain not found" });
    }
    return res.status(200).json(blockchain);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockchainBySlug = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { slug } = req.params;
    const blockchain = await blockchainService.getBlockchainBySlug(slug);
    if (!blockchain) {
      return res.status(404).json({ message: "Blockchain not found" });
    }
    return res.status(200).json(blockchain);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedBlockchain = await blockchainService.updateBlockchain(
      id,
      updateData
    );
    if (!updatedBlockchain) {
      return res.status(404).json({ message: "Blockchain not found" });
    }
    return res.status(200).json({
      message: "Blockchain updated successfully",
      blockchain: updatedBlockchain,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Blockchain
export const deleteBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    await blockchainService.deleteBlockchain(id);
    return res.status(204).json({ message: "Blockchain deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
