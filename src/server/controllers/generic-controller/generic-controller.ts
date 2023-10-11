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
            const data = await this.$repository.index();
            res.send(data)
        });
    }
    show() {
        this.$router.get(async (req, res) => {
            const { id } = req.query;
            const data = await this.$repository.findOne(id as string);
            res.send(data)
        })
    }
    store() {
        this.$router.post(async (req, res) => {
            const data = req.body;
            const created = await this.$repository.create(data);
            if (created) {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        })
    }
    patch() {
        this.$router.put(async (req, res) => {
            const data = JSON.parse(req.body);
            const { id } = req.query;
            const updated = await this.$repository.updateOne({ id, ...data })
            res.send(updated);
        });
    }
    remove() {
        this.$router.delete(async (req, res) => {
            const { id } = req.query;
            const succeded = await this.$repository.deleteOne(id as string);
            if (succeded) {
                res.status(200).end();
            } else {
                res.status(400).end();
            }
        })
    }
}