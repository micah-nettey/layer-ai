/**
 * Detects which significant fields have changed between existing and new gate configurations.
 * Returns array of field names that changed. Only tracks fields that warrant a history snapshot.
 */
export function detectSignificantChanges(
  existing: any,
  updates: any
): string[] {
  const changedFields: string[] = [];

  const normalizeArray = (val: any): string => {
    if (Array.isArray(val)) return JSON.stringify(val.sort());
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return JSON.stringify(Array.isArray(parsed) ? parsed.sort() : parsed);
      } catch {
        return val;
      }
    }
    return JSON.stringify(val || []);
  };

  const hasChanged = (
    field: string,
    existingVal: any,
    newVal: any
  ): boolean => {
    if (newVal === undefined) return false;

    if (field === 'fallbackModels') {
      return normalizeArray(existingVal) !== normalizeArray(newVal);
    }

    const normalizedExisting = existingVal ?? null;
    const normalizedNew = newVal ?? null;

    return normalizedExisting !== normalizedNew;
  };

  const significantFields = {
    name: 'name',
    description: 'description',
    model: 'model',
    fallbackModels: 'fallbackModels',
    routingStrategy: 'routingStrategy',
    temperature: 'temperature',
    maxTokens: 'maxTokens',
    topP: 'topP',
    costWeight: 'costWeight',
    latencyWeight: 'latencyWeight',
    qualityWeight: 'qualityWeight',
    analysisMethod: 'analysisMethod',
    taskType: 'taskType',
    systemPrompt: 'systemPrompt',
    reanalysisPeriod: 'reanalysisPeriod',
    autoApplyRecommendations: 'autoApplyRecommendations',
  };

  for (const [field, displayName] of Object.entries(significantFields)) {
    if (hasChanged(field, existing[field], updates[field])) {
      changedFields.push(displayName);
    }
  }

  return changedFields;
}
