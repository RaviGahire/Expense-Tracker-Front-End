import { apiRequest } from './apiClient';
import type {
  DashboardSummaryResponse,
  MonthlyTrendPoint,
} from '../types/dashboard.types';

export const dashboardService = {
  getSummary(params?: { startDate?: string; endDate?: string }) {
    const search = new URLSearchParams();
    if (params?.startDate) search.set('startDate', params.startDate);
    if (params?.endDate) search.set('endDate', params.endDate);
    const qs = search.toString();

    return apiRequest<DashboardSummaryResponse>(
      `/analytics/summary${qs ? `?${qs}` : ''}`
    );
  },

  getMonthlyTrends(months = 6) {
    return apiRequest<{ trends: MonthlyTrendPoint[] }>(
      `/analytics/trends?months=${months}`
    );
  },
};