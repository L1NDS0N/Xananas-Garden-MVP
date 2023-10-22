import { NextApiRouter } from "@/server/core/NextApiRouter";
import { BadRequestError, InternalError, NotFoundError } from "@/server/helpers/api-error";
import { GENERIC_MESSAGES, TGenericMessage, TGenericMessageParams } from "@/server/references/generic-error";
import { IGenericRepository } from "@/server/repositories/interfaces/generic-repository-intf";
import IGenericController from "./generic-controller.intf";

export default class TGenericController<T> implements IGenericController {
    private $router: NextApiRouter;
    private $repository: IGenericRepository<T>;
    private $messages: TGenericMessage;

    constructor(router: NextApiRouter, repository: IGenericRepository<T>, messagesParams: TGenericMessageParams) {
        this.$router = router;
        this.$repository = repository;
        this.$messages = GENERIC_MESSAGES(messagesParams);
    }

    handler() {
        return this.$router.handle();
    }

    index() {
        this.$router.get(async (req, res) => {
            const data = await this.$repository.index();
            if (!data) throw new NotFoundError(this.$messages, { cases: 'not_found', contexts: 'repository' });
            res.send(data)
        });
    }
    show() {
        this.$router.get(async (req, res) => {
            const { id } = req.query;
            if (!id) throw new BadRequestError(this.$messages, { cases: 'required_field', contexts: 'repository', field: 'identificador' });
            const data = await this.$repository.findOne(id as string);
            if (!data) throw new NotFoundError(this.$messages, { cases: 'not_found', contexts: 'repository' });
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
            const data = req.body;
            const { id } = req.query;
            if (!id) throw new BadRequestError(this.$messages, { cases: 'required_field', contexts: 'repository', field: 'identificador' });
            const updated = await this.$repository.updateOne({ id, ...data });
            if (!updated) throw new InternalError(this.$messages, { cases: 'cannot_delete', contexts: 'repository', field: 'atualização' });
            res.send(updated);
        });
    }
    remove() {
        this.$router.delete(async (req, res) => {
            const { id } = req.query;
            if (!id) throw new BadRequestError(this.$messages, { cases: 'required_field', contexts: 'repository', field: 'identificador' });
            const succeded = await this.$repository.deleteOne(id as string);
            if (succeded) {
                res.status(200).end();
            } else {
                if (!id) throw new BadRequestError(this.$messages, { cases: 'cannot_delete', contexts: 'repository' });
            }
        })
    }
}