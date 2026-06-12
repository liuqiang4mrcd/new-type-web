import { createRequest } from '@new-type/request';
import { API_BASE_URL } from './constants';

export const request = createRequest({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export function getCampaignInfo() {
  return request.get('/campaign/info');
}

export function submitForm(data: Record<string, unknown>) {
  return request.post('/campaign/submit', data);
}
