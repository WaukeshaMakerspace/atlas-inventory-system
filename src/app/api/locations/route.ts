import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locations, tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse, Location, Tag } from '@/types';

// GET - Fetch all locations
export async function GET() {
  try {
    const results = await db
      .select({
        location: locations,
        locationTypeTag: tags,
      })
      .from(locations)
      .leftJoin(tags, eq(locations.locationTypeTagId, tags.id));

    // Transform results to include tag with each location
    const allLocations = results.map(({ location, locationTypeTag }) => ({
      ...location,
      locationTypeTag: locationTypeTag || undefined,
    }));

    const response: ApiResponse<(Location & { locationTypeTag?: Tag })[]> = {
      success: true,
      data: allLocations as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Locations GET error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch locations',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - Create new location
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to create locations',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json();
    const { name, locationTypeTagId, description, parentId } = body;

    // Validation
    if (!name || !locationTypeTagId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Validation error',
        message: 'Name and location type are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify tag exists
    const tagResults = await db
      .select()
      .from(tags)
      .where(eq(tags.id, locationTypeTagId))
      .limit(1);

    if (tagResults.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Validation error',
        message: 'Invalid location type tag',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // If parentId is provided, verify parent exists
    let parentLocation = null;
    if (parentId) {
      const results = await db
        .select()
        .from(locations)
        .where(eq(locations.id, parentId))
        .limit(1);

      if (results.length === 0) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Validation error',
          message: 'Parent location not found',
        };
        return NextResponse.json(response, { status: 400 });
      }

      parentLocation = results[0];
    }

    // Build path and pathIds
    const path = parentLocation ? `${parentLocation.path}/${name}` : `/${name}`;
    const newId = randomUUID();
    const pathIds = parentLocation ? `${parentLocation.pathIds}/${newId}` : `/${newId}`;

    // Create location
    const newLocation = {
      id: newId,
      name,
      type: null,
      locationTypeTagId,
      description: description || null,
      parentId: parentId || null,
      path,
      pathIds,
      sortOrder: 0,
      imageUrl: null,
      createdById: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(locations).values(newLocation);

    // Fetch the created location with its tag
    const createdResults = await db
      .select({
        location: locations,
        locationTypeTag: tags,
      })
      .from(locations)
      .leftJoin(tags, eq(locations.locationTypeTagId, tags.id))
      .where(eq(locations.id, newId))
      .limit(1);

    const createdLocation = {
      ...createdResults[0].location,
      locationTypeTag: createdResults[0].locationTypeTag || undefined,
    };

    const response: ApiResponse<Location & { locationTypeTag?: Tag }> = {
      success: true,
      data: createdLocation as any,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Locations POST error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create location',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
