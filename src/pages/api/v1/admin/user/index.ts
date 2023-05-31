import { UserAdminController } from '@/server/controllers/admin/user-admin-controller';
import createNextApiRouter from '@/server/core/NextApiRouter';

const userAdminController = new UserAdminController(createNextApiRouter());
userAdminController.create();
userAdminController.update();
userAdminController.delete();
export default userAdminController.handler();
