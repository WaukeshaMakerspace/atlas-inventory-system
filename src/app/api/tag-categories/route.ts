import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tagCategories } from '@/db/schema';
import type { ApiResponse, TagCategory } from '@/types';

// GET - Fetch all tag categories
export async function GET() {
  try {
    const results = await db.select().from(tagCategories);

    const response: ApiResponse<TagCategory[]> = {
      success: true,
      data: results as any,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tag Categories GET error:', error);

    const response: ApiResponse<never> = {
      success: false,
      error: 'Failed to fetch tag categories',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
