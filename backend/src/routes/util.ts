import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Forward rejected promises to Express's error handler (Express 4 does not do this itself). */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };
}

/** A query parameter as a plain string; arrays and objects (?a[]=1) are rejected so they never reach MongoDB queries. */
export function queryString(req: Request, name: string): string {
  const value = req.query[name];
  return typeof value === "string" ? value : "";
}
