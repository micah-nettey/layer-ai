import { LayerAdmin } from '@layer-ai/admin';
import { getActiveProfile } from './cli-config.js';

export async function getLayerClient(): Promise<LayerAdmin> {
  const profile = await getActiveProfile();

  return new LayerAdmin({
    apiKey: profile.apiKey,
    baseUrl: profile.baseUrl,
  });
}
