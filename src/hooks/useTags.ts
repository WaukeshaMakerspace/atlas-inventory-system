import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tag, TagCategory, ApiResponse } from '@/types';

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch('/api/tags');

      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }

      const data: ApiResponse<(Tag & { category: TagCategory })[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
  });
}

export function useTagsByCategory(categoryName: string) {
  const { data: allTags, ...rest } = useTags();

  const tags = allTags?.filter(tag => tag.category.name === categoryName) || [];

  return {
    data: tags,
    ...rest,
  };
}

export function useTagCategories() {
  return useQuery({
    queryKey: ['tagCategories'],
    queryFn: async () => {
      const response = await fetch('/api/tag-categories');

      if (!response.ok) {
        throw new Error('Failed to fetch tag categories');
      }

      const data: ApiResponse<TagCategory[]> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData: {
      name: string;
      categoryId: string;
      description?: string;
      color?: string;
    }) => {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create tag');
      }

      const data: ApiResponse<Tag & { category: TagCategory }> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {
        name?: string;
        categoryId?: string;
        description?: string;
        color?: string;
      };
    }) => {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update tag');
      }

      const data: ApiResponse<Tag & { category: TagCategory }> = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
