import { Request, Response } from "express";

export const getApi = (req: Request, res: Response): Response => {
  return res.status(200).send({
    message: "Hello World",
  });
};
