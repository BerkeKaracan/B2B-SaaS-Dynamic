import { fetchAPI } from '@/services/api';

export const logActivity = async (
  tenantId: string,
  userName: string = 'Unknown User',
  action: string,
  details: string
) => {
  try {
    await fetchAPI(`/api/records/`, {
      method: 'POST',
      body: JSON.stringify({
        tenant_id: tenantId,
        module_name: 'activity_logs',
        record_data: {
          user: userName,
          action,
          details,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error('Failed to log activity', error);
  }
};
