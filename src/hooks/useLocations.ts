import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location, ApiResponse, NewLocation } from '@/types';

// Fetch all locations
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await fetch('/api/locations');

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data: ApiResponse<Location[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
  });
}

// Create location
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newLocation: Partial<NewLocation>) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) {
        const data: ApiResponse<never> = await response.json();
        throw new Error(data.message || data.error);
      }

      const data: ApiResponse<Location> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}

// Update location
export function useUpdateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Location> }) => {
      const response = await fetch(`/api/locations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data: ApiResponse<never> = await response.json();
        throw new Error(data.message || data.error);
      }

      const data: ApiResponse<Location> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
