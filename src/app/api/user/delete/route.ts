// src/app/api/user/delete/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/user/delete
 *
 * GDPR-compliant data deletion endpoint
 * Permanently deletes user account and all associated data
 *
 * Cascade deletes:
 * - All PlayEvents (listening history)
 * - All ShareableReports
 * - User profile and authentication data
 *
 * Audit logged for compliance
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch user data before deletion for audit log
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spotifyId: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            playEvents: true,
            reports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Log deletion for audit trail (before deletion)
    console.log('[GDPR Data Deletion]', {
      timestamp: new Date().toISOString(),
      userId: user.id,
      spotifyId: user.spotifyId,
      email: user.email,
      accountAge: Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      ),
      playEventsCount: user._count.playEvents,
      reportsCount: user._count.reports,
      requestedBy: 'user',
      reason: 'GDPR right to deletion',
    });

    // Delete user (cascade deletes playEvents and reports)
    await prisma.user.delete({
      where: { id: userId },
    });

    // TODO: Send deletion confirmation email
    // if (user.email) {
    //   await sendEmail({
    //     to: user.email,
    //     subject: 'Your Spotify Time Machine account has been deleted',
    //     body: `
    //       Your account and all associated data have been permanently deleted.
    //
    //       Data deleted:
    //       - ${user._count.playEvents} listening history records
    //       - ${user._count.reports} shared reports
    //       - Profile and authentication data
    //
    //       This action cannot be undone. If you created a new account, it will be treated as a new user.
    //
    //       Thank you for using Spotify Time Machine.
    //     `,
    //   });
    // }

    return NextResponse.json(
      {
        success: true,
        message: 'Account and all associated data have been permanently deleted',
        deletedData: {
          playEvents: user._count.playEvents,
          shareableReports: user._count.reports,
        },
        deletedAt: new Date().toISOString(),
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[User Delete API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Audit log for failed deletion attempts
    console.error('[GDPR Data Deletion Failed]', {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        error: 'Failed to delete account',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/delete
 * Returns deletion confirmation page with warning
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Get user data summary
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          playEvents: true,
          reports: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    warning: 'This action is irreversible',
    accountInfo: {
      name: user.name,
      email: user.email,
      memberSince: user.createdAt,
      dataToBeDeleted: {
        listeningHistory: user._count.playEvents,
        sharedReports: user._count.reports,
      },
    },
    instructions: 'Send a DELETE request to this endpoint to confirm deletion',
  });
}
