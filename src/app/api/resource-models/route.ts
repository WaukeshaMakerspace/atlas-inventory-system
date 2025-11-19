import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { resourceModels } from '@/db/schema';
import { like, or, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getServerAuthSession } from '@/lib/auth';
import type { ApiResponse, ResourceModel } from '@/types';

// GET - Fetch all resource models
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Build search conditions
    const searchCondition = search
      ? or(
          like(resourceModels.name, `%${search}%`),
          like(resourceModels.manufacturer, `%${search}%`),
          like(resourceModels.description, `%${search}%`)
        )
      : undefined;

    // Fetch all models
    const models = await db
      .select()
      .from(resourceModels)
      .where(searchCondition)
      .orderBy(resourceModels.name);

    const response: ApiResponse<ResourceModel[]> = {
      success: true,
      data: models,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resource Models API error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch resource models',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST - Create new resource model
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Unauthorized',
        message: 'You must be logged in to create resource models',
      };
      return NextResponse.json(response, { status: 401 });
    }

    const body = await request.json();
    const { name, manufacturer, description, modelNumber } = body;

    // Validate required fields
    if (!name) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Validation error',
        message: 'Name is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create new resource model
    const modelId = randomUUID();
    const newModel = {
      id: modelId,
      name,
      manufacturer: manufacturer || null,
      description: description || null,
      modelNumber: modelNumber || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: session.user.id,
    };

    await db.insert(resourceModels).values(newModel);

    // Fetch the created model
    const createdModel = await db
      .select()
      .from(resourceModels)
      .where(eq(resourceModels.id, modelId))
      .limit(1);

    if (createdModel.length === 0) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'Failed to fetch created model',
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: ApiResponse<ResourceModel> = {
      success: true,
      data: createdModel[0],
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Resource Models POST error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to create resource model',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
