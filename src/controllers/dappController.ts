import { Request, Response } from "express";
import { DappInitializer } from "../db/models/public/Dapp";
import * as dappService from "../db/services/dappService";

export const createDappController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const dappData: DappInitializer = req.body;
    const result = await dappService.createDapp(dappData);
    return res.status(201).json({
      message: "Dapp created successfully",
      id: result.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const upsertDappController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const dappData: DappInitializer = req.body;
    const id = await dappService.upsertDapp(dappData);
    return res.status(200).json({
      message: "Dapp upserted successfully",
      id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createDappWithBlockchains = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const dappData = req.body;
    const dapp = await dappService.createDappWithBlockchains(dappData);
    return res.status(201).json({
      message: "Dapp created successfully",
      dapp: dapp,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", details: error.message });
  }
};

export const getDappById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const dapp = await dappService.getById(id);
    if (!dapp) {
      return res.status(404).json({ message: "Dapp not found" });
    }
    return res.status(200).json(dapp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllDapps = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const queryFilters = req.query;
    const dapps = await dappService.getAll(queryFilters);
    return res.status(200).json(dapps);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDappBySlug = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { slug } = req.params;
    const dapp = await dappService.getBySlug(slug);
    if (!dapp) {
      return res.status(404).json({ message: "Dapp not found" });
    }
    return res.status(200).json(dapp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDappByName = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name } = req.params;
    const dapp = await dappService.getByName(name);
    if (!dapp) {
      return res.status(404).json({ message: "Dapp not found" });
    }
    return res.status(200).json(dapp);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateDapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedDapp = await dappService.update(id, updateData);
    if (!updatedDapp) {
      return res.status(404).json({ message: "Dapp not found" });
    }
    return res.status(200).json({
      message: "Dapp updated successfully",
      dapp: updatedDapp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { id } = req.params;
    await dappService.deleteDapp(id);
    return res.status(204).json({ message: "Dapp deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addDappToBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { dapp_id, blockchain_id } = req.body;
    await dappService.addDappToBlockchain(dapp_id, blockchain_id);
    return res
      .status(201)
      .json({ message: "Dapp added to blockchain successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeDappFromBlockchain = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { dapp_id, blockchain_id } = req.body;
    await dappService.removeDappFromBlockchain(dapp_id, blockchain_id);
    return res
      .status(200)
      .json({ message: "Dapp removed from blockchain successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
