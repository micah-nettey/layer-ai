import { Layer } from '@layer-ai/sdk';
import { getActiveProfile } from './cli-config.js';


export async function getLayerClient(): Promise<Layer> {
  const profile = await getActiveProfile();

  return new Layer({
    apiKey: profile.apiKey,
    baseUrl: profile.baseUrl,
    adminMode: true // CLI always uses admin mode
  });
}