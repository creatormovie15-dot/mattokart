import { handleApiRequest, jsonResponse } from '../../server/apiRouter';

export default async function handler(req: Request): Promise<Response> {
  try {
    return await handleApiRequest(req);
  } catch (err: any) {
    return jsonResponse(
      {
        success: false,
        error: err?.message || 'Unexpected server error while sending OTP.',
      },
      500
    );
  }
}
