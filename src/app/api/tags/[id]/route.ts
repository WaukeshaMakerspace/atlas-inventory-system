import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags, tagCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse, Tag, TagCategory } from '@/types';

// PATCH - Update tag
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
        message: 'You must be logged in to update tags',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, categoryId, description, color } = body;

    // Fetch existing tag
    const existing = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);

    if (existing.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Not found',
        message: 'Tag not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const tag = existing[0];

    // Validate category if provided
    if (categoryId) {
      const categoryResults = await db
        .select()
        .from(tagCategories)
        .where(eq(tagCategories.id, categoryId))
        .limit(1);

      if (categoryResults.length === 0) {
        const response: ApiResponse<never> = {
          success: false,
          error: 'Validation error',
          message: 'Invalid category',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Update tag
    await db
      .update(tags)
      .set({
        name: name || tag.name,
        categoryId: categoryId || tag.categoryId,
        description: description !== undefined ? description : tag.description,
        color: color !== undefined ? color : tag.color,
      })
      .where(eq(tags.id, id));

    // Fetch updated tag with category
    const updatedResults = await db
      .select({
        tag: tags,
        category: tagCategories,
      })
      .from(tags)
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
      .where(eq(tags.id, id))
      .limit(1);

    const updatedTag = {
      ...updatedResults[0].tag,
      category: updatedResults[0].category!,
    };

    const response: ApiResponse<Tag & { category: TagCategory }> = {
      success: true,
      data: updatedTag as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tags PATCH error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to update tag',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
