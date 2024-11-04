import { Request, Response } from "express";
import * as segmentsService from "../db/services/segmentsService";

export const createSegment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {

    const { dappId, segmentId, segmentName, filters } = req.body;
    const createdSegment = await segmentsService.createSegment(
      dappId,
      segmentId,
      segmentName,
      filters
    );

    return res.status(201).json({
      data: createdSegment,
      message: "Segment created successfully",
    });
  } catch (error) {
    console.error("Error creating the segment:", error);
    return res.status(500).json({
      message: "Error occurred while creating the segment",
    });
  }
};
