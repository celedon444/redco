import axios from 'axios';

import type { MapOverview } from '@/types/map';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export async function getMapOverview(): Promise<MapOverview> {
  const { data } = await api.get<MapOverview>('/map/overview');
  return data;
}

export default api;