import { useDataStore } from '@/store/dataStore';

/** Переключатель листов Excel (вкладок данных). */
export function SheetTabs() {
  const dataset = useDataStore((s) => s.dataset);
  const activeSheetName = useDataStore((s) => s.activeSheetName);
  const setActiveSheet = useDataStore((s) => s.setActiveSheet);

  if (!dataset || dataset.sheets.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-1 overflow-x-auto">
        {dataset.sheets.map((sheet) => {
          const isActive = sheet.name === activeSheetName;
          return (
            <button
              key={sheet.name}
              type="button"
              onClick={() => setActiveSheet(sheet.name)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {sheet.name}
              <span className="ml-2 text-xs text-gray-400">
                ({sheet.rows.length})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
