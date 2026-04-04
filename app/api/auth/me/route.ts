import { getAuthUser } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET() {
  const auth = await getAuthUser();

  if (!auth.authenticated) {
    return errorResponse('Не авторизован', 401);
  }

  if (auth.user.isBanned) {
    return errorResponse('Аккаунт заблокирован', 403);
  }

  return successResponse({ user: auth.user });
}
