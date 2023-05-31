import { AuthAdminController } from '@/server/controllers/admin/auth-admin-controller';
import createNextApiRouter from '@/server/core/NextApiRouter';

const authController = new AuthAdminController(createNextApiRouter());
authController.login();
export default authController.handler();
