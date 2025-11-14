import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags, tagCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse, Tag, TagCategory } from '@/types';

// GET - Fetch all tags with categories
export async function GET() {
  try {
    const results = await db
      .select({
        tag: tags,
        category: tagCategories,
      })
      .from(tags)
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id));

    // Transform results to group tags by category
    const allTags = results.map(({ tag, category }) => ({
      ...tag,
      category: category!,
    }));

    const response: ApiResponse<(Tag & { category: TagCategory })[]> = {
      success: true,
      data: allTags as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tags GET error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch tags',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - Create new tag
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to create tags',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json();
    const { name, categoryId, description, color } = body;

    // Validation
    if (!name || !categoryId) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Validation error',
        message: 'Name and category are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify category exists
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

    // Create tag
    const newTag = {
      id: randomUUID(),
      name,
      categoryId,
      description: description || null,
      color: color || null,
      createdAt: new Date(),
      createdById: session.user.id,
    };

    await db.insert(tags).values(newTag);

    // Fetch the created tag with its category
    const createdResults = await db
      .select({
        tag: tags,
        category: tagCategories,
      })
      .from(tags)
      .leftJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
      .where(eq(tags.id, newTag.id))
      .limit(1);

    const createdTag = {
      ...createdResults[0].tag,
      category: createdResults[0].category!,
    };

    const response: ApiResponse<Tag & { category: TagCategory }> = {
      success: true,
      data: createdTag as any,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Tags POST error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create tag',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
