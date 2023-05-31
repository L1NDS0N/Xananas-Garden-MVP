import axios from 'axios';

export const apiV1 = axios.create({ baseURL: '/api/v1' });
