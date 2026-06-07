import { useState, useCallback } from 'react';
import { ExcelDataSource } from '@/services/dataSource';
import { useDataStore } from '@/store/dataStore';

interface UseExcelDataResult {
  loading: boolean;
  error: string | null;
  loadFile: (file: File) => Promise<void>;
}

export function useExcelData(): UseExcelDataResult {
  const setDataset = useDataStore((s) => s.setDataset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const source = new ExcelDataSource(file);
        const dataset = await source.load();
        if (dataset.sheets.length === 0) {
          throw new Error('В файле не найдено ни одного листа');
        }
        setDataset(dataset);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Не удалось прочитать файл';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [setDataset]
  );

  return { loading, error, loadFile };
}
