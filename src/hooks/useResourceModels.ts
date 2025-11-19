import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResourceModel, ApiResponse } from '@/types';

interface UseResourceModelsParams {
  search?: string;
}

export function useResourceModels({ search = '' }: UseResourceModelsParams = {}) {
  return useQuery({
    queryKey: ['resource-models', { search }],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/resource-models?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch resource models');
      }

      const data: ApiResponse<ResourceModel[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
  });
}

export function useCreateResourceModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      manufacturer?: string;
      description?: string;
      modelNumber?: string;
    }) => {
      const response = await fetch('/api/resource-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create resource model');
      }

      const result: ApiResponse<ResourceModel> = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-models'] });
    },
  });
}
