import axios from 'axios';

import { useRouter } from '@/routes/routes.constants';

const { url, port, path } =  useRouter().$b();
export const apiV1 = axios.create({ baseURL: url + port + path });
