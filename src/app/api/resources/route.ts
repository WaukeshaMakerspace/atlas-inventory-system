import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resourceInstances, resourceModels, locations, tags, tagCategories, resourceInstanceTags } from '@/db/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import type { ApiResponse, ResourceWithLocation, Tag, TagCategory } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate pagination parameters
    if (limit < 1 || limit > 100) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid limit parameter',
        message: 'Limit must be between 1 and 100',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (offset < 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Invalid offset parameter',
        message: 'Offset must be 0 or greater',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Build search conditions
    const searchCondition = search
      ? or(
          like(resourceModels.name, `%${search}%`),
          like(resourceModels.description, `%${search}%`),
          like(resourceModels.manufacturer, `%${search}%`),
          like(locations.name, `%${search}%`),
          like(locations.path, `%${search}%`)
        )
      : undefined;

    // Execute query with pagination
    const results = await db
      .select({
        instance: resourceInstances,
        model: resourceModels,
        location: locations,
      })
      .from(resourceInstances)
      .leftJoin(resourceModels, eq(resourceInstances.modelId, resourceModels.id))
      .leftJoin(locations, eq(resourceInstances.locationId, locations.id))
      .where(searchCondition)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination metadata
    const countResults = await db
      .select({ count: sql<number>`count(*)` })
      .from(resourceInstances)
      .leftJoin(resourceModels, eq(resourceInstances.modelId, resourceModels.id))
      .leftJoin(locations, eq(resourceInstances.locationId, locations.id))
      .where(searchCondition);

    const total = Number(countResults[0]?.count || 0);

    // Transform results and fetch tags
    const resources: ResourceWithLocation[] = results.map(({ instance, model, location }) => ({
      ...instance,
      model: model!,
      location: location!,
    }));

    // Fetch tags for all instances
    const instanceIds = resources.map(r => r.id);

    if (instanceIds.length > 0) {
      const tagsData = await db
        .select({
          instanceId: resourceInstanceTags.instanceId,
          tag: tags,
          category: tagCategories,
        })
        .from(resourceInstanceTags)
        .leftJoin(tags, eq(resourceInstanceTags.tagId, tags.id))
        .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
        .where(
          sql`${resourceInstanceTags.instanceId} IN (${sql.join(instanceIds.map(id => sql`${id}`), sql`, `)})`
        );

      // Group tags by instance
      const tagsByInstance = tagsData.reduce((acc, { instanceId, tag, category }) => {
        if (!acc[instanceId]) {
          acc[instanceId] = [];
        }
        if (tag && category) {
          acc[instanceId].push({
            ...tag,
            category,
          });
        }
        return acc;
      }, {} as Record<string, (Tag & { category: TagCategory })[]>);

      // Attach tags to resources
      resources.forEach(resource => {
        (resource as any).tags = tagsByInstance[resource.id] || [];
      });
    } else {
      // No resources, add empty tags array
      resources.forEach(resource => {
        (resource as any).tags = [];
      });
    }

    const response: ApiResponse<{
      resources: (ResourceWithLocation & { tags: (Tag & { category: TagCategory })[] })[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }> = {
      success: true,
      data: {
        resources: resources as any,
        total,
        limit,
        offset,
        hasMore: offset + resources.length < total,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resources API error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch resources',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
