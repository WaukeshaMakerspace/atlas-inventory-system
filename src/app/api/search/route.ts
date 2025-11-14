import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resourceInstances, resourceModels, locations } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import type { ApiResponse, SearchResult } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const locationId = searchParams.get('locationId');

    const offset = (page - 1) * pageSize;

    // Build query conditions
    const conditions = [];

    if (query) {
      conditions.push(
        or(
          like(resourceModels.name, `%${query}%`),
          like(resourceModels.description, `%${query}%`),
          like(resourceModels.manufacturer, `%${query}%`)
        )
      );
    }

    if (locationId) {
      conditions.push(eq(resourceInstances.locationId, locationId));
    }

    // Fetch resource instances with their models and locations
    const results = await db
      .select({
        instance: resourceInstances,
        model: resourceModels,
        location: locations,
      })
      .from(resourceInstances)
      .leftJoin(resourceModels, eq(resourceInstances.modelId, resourceModels.id))
      .leftJoin(locations, eq(resourceInstances.locationId, locations.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(pageSize)
      .offset(offset);

    // Transform results
    const instances = results.map(({ instance, model, location }) => ({
      ...instance,
      model: model!,
      location: location!,
    }));

    const response: ApiResponse<SearchResult> = {
      success: true,
      data: {
        instances,
        total: instances.length, // In production, do a separate COUNT query
        page,
        pageSize,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to search resources',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
