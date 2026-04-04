import { NextResponse } from 'next/server';

/**
 * Standard JSON error response.
 */
export function errorResponse(message: string, status: number = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard JSON success response.
 */
export function successResponse(data: Record<string, unknown> = {}): NextResponse {
  return NextResponse.json({ success: true, ...data });
}
