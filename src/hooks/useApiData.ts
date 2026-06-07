import { useState, useCallback } from 'react';
import { ApiDataSource } from '@/services/dataSource';
import { useDataStore } from '@/store/dataStore';
import type { TopicDto } from '@/services/api';

interface UseApiDataResult {
  loading: boolean;
  error: string | null;
  loadFromApi: (topic: TopicDto) => Promise<void>;
}

export function useApiData(): UseApiDataResult {
  const setDataset = useDataStore((s) => s.setDataset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFromApi = useCallback(
    async (topic: TopicDto) => {
      setLoading(true);
      setError(null);
      try {
        const source = new ApiDataSource(topic.id, topic.name);
        const dataset = await source.load();
        setDataset(dataset);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось загрузить из API');
      } finally {
        setLoading(false);
      }
    },
    [setDataset]
  );

  return { loading, error, loadFromApi };
}
