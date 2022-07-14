import axios from 'axios';

export const api = axios.create({
  //testar sem endereço
  baseURL: '/api/v1',
});
