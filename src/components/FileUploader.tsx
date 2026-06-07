import { useRef } from 'react';
import { useExcelData } from '@/hooks/useExcelData';
import { useDataStore } from '@/store/dataStore';

export function FileUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error, loadFile } = useExcelData();
  const dataset = useDataStore((s) => s.dataset);

  const handleClick = () => inputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await loadFile(file);
    // Сбросить input, чтобы можно было загрузить тот же файл повторно
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Загрузка...' : 'Загрузить Excel'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
        />
        {dataset && (
          <span className="text-sm text-gray-600">
            Файл: <span className="font-medium">{dataset.sourceName}</span>
            {' · '}
            листов: {dataset.sheets.length}
          </span>
        )}
      </div>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
