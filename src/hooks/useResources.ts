import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResourceWithLocation, ApiResponse } from '@/types';

interface ResourcesResponse {
  resources: ResourceWithLocation[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface UseResourcesParams {
  search?: string;
  limit?: number;
  offset?: number;
}

export function useResources({ search = '', limit = 20, offset = 0 }: UseResourcesParams = {}) {
  return useQuery({
    queryKey: ['resources', { search, limit, offset }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/resources?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data: ApiResponse<ResourcesResponse> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        serialNumber?: string | null;
        locationId?: string;
        tagIds?: string[];
      };
    }) => {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update resource');
      }

      const data: ApiResponse<ResourceWithLocation> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
}
