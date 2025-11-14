import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resourceInstances, resourceInstanceTags, tags } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse } from '@/types';

// PATCH - Update resource instance
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
        message: 'You must be logged in to update resources',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { serialNumber, locationId, tagIds } = body;

    // Fetch existing resource
    const existing = await db
      .select()
      .from(resourceInstances)
      .where(eq(resourceInstances.id, id))
      .limit(1);

    if (existing.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not found',
        message: 'Resource not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const resource = existing[0];

    // Update resource instance
    await db
      .update(resourceInstances)
      .set({
        serialNumber: serialNumber !== undefined ? serialNumber : resource.serialNumber,
        locationId: locationId !== undefined ? locationId : resource.locationId,
        updatedAt: new Date(),
      })
      .where(eq(resourceInstances.id, id));

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await db
        .delete(resourceInstanceTags)
        .where(eq(resourceInstanceTags.instanceId, id));

      // Add new tags
      if (tagIds.length > 0) {
        await db.insert(resourceInstanceTags).values(
          tagIds.map((tagId: string) => ({
            instanceId: id,
            tagId,
          }))
        );
      }
    }

    // Fetch updated resource with tags
    const tagsData = await db
      .select({
        tag: tags,
      })
      .from(resourceInstanceTags)
      .leftJoin(tags, eq(resourceInstanceTags.tagId, tags.id))
      .where(eq(resourceInstanceTags.instanceId, id));

    const updatedResource = {
      ...resource,
      serialNumber: serialNumber !== undefined ? serialNumber : resource.serialNumber,
      locationId: locationId !== undefined ? locationId : resource.locationId,
      updatedAt: new Date(),
      tags: tagsData.map((t) => t.tag!),
    };

    const response: ApiResponse<typeof updatedResource> = {
      success: true,
      data: updatedResource as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resources PATCH error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update resource',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
