import { NextApiRequest, NextApiResponse } from "next";

export default interface INextApiRouterController {
    /**
     * Deve retornar o handle do NextApiRouter
     */
    handler(): (req: NextApiRequest, res: NextApiResponse) => void;
}