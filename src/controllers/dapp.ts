import { Request, Response } from "express";
import { createDapp, upsertDapp } from "../db/services/dappsService";
import { DappInitializer } from "../db/models/public/Dapps";

export const createDappController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const dappData: DappInitializer = req.body;
    const result = await createDapp(dappData);
    return res.status(201).json({
      message: "Dapp created successfully",
      id: result.id,
    });
  } catch (error) {
    // You'll want to log the error and potentially transform it into a user-friendly message
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
    const id = await upsertDapp(dappData);
    return res.status(200).json({
      message: "Dapp upserted successfully",
      id,
    });
  } catch (error) {
    // You'll want to log the error and potentially transform it into a user-friendly message
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
