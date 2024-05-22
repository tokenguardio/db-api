import { Request, Response } from "express";
import * as dappService from "../db/services/dappAnalyticsService";

export const saveDapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { name, logo, blockchain, website, fromBlock, addedBy, abis } =
      req.body;
    const createdDapp = await dappService.saveDapp({
      name,
      logo,
      blockchain,
      website,
      from_block: fromBlock,
      added_by: addedBy,
      abis,
    });

    return res.status(201).json({
      data: createdDapp.id,
      message: "dApp saved successfully",
    });
  } catch (error) {
    console.error("Error saving the dApp:", error);
    return res.status(500).json({
      message: "Error occurred while saving the dApp",
    });
  }
};

export const getDapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  try {
    const dapp = await dappService.getDapp(id);
    if (!dapp) {
      return res.status(404).json({
        message: "dApp not found",
      });
    }
    return res.status(200).json(dapp);
  } catch (error) {
    console.error("Error retrieving the dApp:", error);
    return res.status(500).json({
      message: "Error occurred while retrieving the dApp",
    });
  }
};

export const getAllDapps = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const dapps = await dappService.getAllDapps();
    return res.status(200).json(dapps);
  } catch (error) {
    console.error("Error retrieving all dApps:", error);
    return res.status(500).json({
      message: "Error occurred while retrieving all dApps",
    });
  }
};

export const updateDapp = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id } = req.params;
  const { name, logo, blockchain, website, fromBlock, addedBy, abis } =
    req.body;
  try {
    const updated = await dappService.updateDapp(id, {
      name,
      logo,
      blockchain,
      website,
      from_block: fromBlock,
      added_by: addedBy,
      abis: abis ? JSON.stringify(abis) : undefined,
    });
    if (!updated) {
      return res.status(404).json({
        message: "No dApp found with given ID or no update needed",
      });
    }
    return res.status(200).json({
      message: "dApp updated successfully",
    });
  } catch (error) {
    console.error("Error updating the dApp:", error);
    return res.status(500).json({
      message: "Error occurred while updating the dApp",
    });
  }
};
