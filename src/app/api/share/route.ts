// src/app/api/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createShareSchema } from '@/validators/share.validator';
import { shareService } from '@/services/share-service';
import { withErrorHandling, ErrorCode, throwError } from '@/lib/error-handler';
import { createSuccessResponse } from '@/dto/common.dto';

/**
 * POST /api/share
 * Creates a shareable report
 */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throwError(ErrorCode.UNAUTHORIZED, 'Not authenticated');
  }

  const userId = session.user.id;
  const body = await req.json();

  // Validate input
  const validated = createShareSchema.parse(body);
  const { title, description, dateRange } = validated;

  // Create shareable report using service
  const result = await shareService.createShareReport(
    userId,
    session.user.name,
    session.user.email,
    title,
    description || undefined,
    dateRange
  );

  return NextResponse.json(createSuccessResponse(result));
}, 'POST /api/share');

/**
 * GET /api/share/:shareId
 * Gets a shareable report by share ID
 */
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const shareId = searchParams.get('id');

  if (!shareId) {
    throwError(ErrorCode.BAD_REQUEST, 'Share ID required');
  }

  // Fetch public report using service
  const result = await shareService.getPublicShareReport(shareId);

  return NextResponse.json(createSuccessResponse(result));
}, 'GET /api/share');
