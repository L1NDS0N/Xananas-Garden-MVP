import createNextApiRouter from "./NextApiRouter";
import INextApiRouterController from "./next-api-router-controller.intf";

export class TResourcesRunner<T extends INextApiRouterController> {
    private controllerResources: (keyof T)[];
    private controllerInstance: T;

    constructor(controller: new (...args: any[]) => T, ...resources: (keyof T)[]) {
        this.controllerInstance = new controller(createNextApiRouter());
        this.controllerResources = resources;        
    }

    private run() {
        this.controllerResources.forEach(resourceKey => (this.controllerInstance as any)[resourceKey]());
    }

    public handler() {
        this.run();
        return this.controllerInstance.handler();
    }
}