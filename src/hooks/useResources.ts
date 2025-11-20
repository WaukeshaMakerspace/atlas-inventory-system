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
      console.log('Fetching resources with params:', { search, limit, offset });

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      const url = `/api/resources?${params}`;
      console.log('Fetching URL:', url);

      const response = await fetch(url);

      console.log('Response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch resources: ${response.status} ${errorText}`);
      }

      const data: ApiResponse<ResourcesResponse> = await response.json();

      console.log('Response data:', data);

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      console.log('Successfully fetched resources:', data.data.resources.length);
      return data.data;
    },
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      modelId: string;
      locationId: string;
      serialNumber?: string | null;
      tagIds?: string[];
    }) => {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create resource');
      }

      const result: ApiResponse<ResourceWithLocation> = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
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
