import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { locations, tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse, Location, Tag } from '@/types';

// PATCH - Update location
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to update locations',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, locationTypeTagId, description } = body;

    // Fetch existing location
    const existing = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id))
      .limit(1);

    if (existing.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not found',
        message: 'Location not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const location = existing[0];

    // Validation - verify tag exists if provided
    if (locationTypeTagId) {
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
    }

    // If name is being updated, we need to update path for this location and all children
    const nameChanged = name && name !== location.name;

    if (nameChanged) {
      // Get parent to rebuild path
      let newPath = `/${name}`;
      if (location.parentId) {
        const parent = await db
          .select()
          .from(locations)
          .where(eq(locations.id, location.parentId))
          .limit(1);

        if (parent.length > 0) {
          newPath = `${parent[0].path}/${name}`;
        }
      }

      // Update this location
      await db
        .update(locations)
        .set({
          name: name || location.name,
          locationTypeTagId: locationTypeTagId || location.locationTypeTagId,
          description: description !== undefined ? description : location.description,
          path: newPath,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, id));

      // Update all children's paths
      const children = await db
        .select()
        .from(locations)
        .where(eq(locations.parentId, id));

      for (const child of children) {
        const childName = child.path.split('/').pop() || '';
        const newChildPath = `${newPath}/${childName}`;

        await db
          .update(locations)
          .set({
            path: newChildPath,
            updatedAt: new Date(),
          })
          .where(eq(locations.id, child.id));
      }
    } else {
      // Simple update without path changes
      await db
        .update(locations)
        .set({
          name: name || location.name,
          locationTypeTagId: locationTypeTagId || location.locationTypeTagId,
          description: description !== undefined ? description : location.description,
          updatedAt: new Date(),
        })
        .where(eq(locations.id, id));
    }

    // Fetch updated location with tag
    const updatedResults = await db
      .select({
        location: locations,
        locationTypeTag: tags,
      })
      .from(locations)
      .leftJoin(tags, eq(locations.locationTypeTagId, tags.id))
      .where(eq(locations.id, id))
      .limit(1);

    const updatedLocation = {
      ...updatedResults[0].location,
      locationTypeTag: updatedResults[0].locationTypeTag || undefined,
    };

    const response: ApiResponse<Location & { locationTypeTag?: Tag }> = {
      success: true,
      data: updatedLocation as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Locations PATCH error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update location',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
