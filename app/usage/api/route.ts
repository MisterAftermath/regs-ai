import { auth } from '@/app/(auth)/auth';
import { getAllUsersUsageStats, getUsageStatsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import { isAdminUser } from '@/lib/utils';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:auth').toResponse();
  }

  // Only allow admin users to view usage stats
  if (!isAdminUser(session.user.email)) {
    return new ChatSDKError('forbidden:auth').toResponse();
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    if (userId) {
      // Get stats for specific user
      const stats = await getUsageStatsByUserId({ userId });
      return Response.json(stats, { status: 200 });
    } else {
      // Get stats for all users
      const stats = await getAllUsersUsageStats();
      return Response.json(stats, { status: 200 });
    }
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    return new ChatSDKError(
      'bad_request:api',
      'Failed to fetch usage statistics',
    ).toResponse();
  }
}
