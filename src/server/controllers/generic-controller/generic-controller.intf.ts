import INextApiRouterController from "@/server/core/next-api-router-controller.intf";

export default interface IGenericController extends INextApiRouterController{

    index: () => void;
    findOne: () => void;
    create: () => void;
    update: () => void;
    delete: () => void;
}