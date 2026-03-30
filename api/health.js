import { getProviderHealth } from '../lib/ai-runtime.mjs';

export default async function handler(request, response) {
  response.status(200).json({
    ok: true,
    providers: getProviderHealth(),
  });
}
