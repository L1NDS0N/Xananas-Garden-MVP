import { NextApiRouter } from "@/server/core/NextApiRouter";
import { IGenericRepository } from "@/server/repositories/interfaces/generic-repository-intf";
import IGenericController from "./generic-controller.intf";


export default class TGenericController<T> implements IGenericController {
    private $router: NextApiRouter;
    private $repository: IGenericRepository<T>;

    constructor(router: NextApiRouter, repository: IGenericRepository<T>) {
        this.$router = router;
        this.$repository = repository;
    }

    handler() {
        return this.$router.handle();
    }

    index() {
        this.$router.get(async (req, res) => {
            const dados = await this.$repository.index();
            res.send(dados)
        });
    }
    findOne() {
        console.log('aqui tb')
        this.$router.get(async (req, res) => {
            const { id } = req.query;
            res.send({ id })
        })
    }
    create() {

    }
    update() {

    }
    delete() {

    }

}