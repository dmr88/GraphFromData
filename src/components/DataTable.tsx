import { useDataStore } from '@/store/dataStore';
import { useT } from '@/i18n/useTranslation';

/**
 * Панель таблицы данных активного листа.
 * Всегда развёрнута, скроллится внутри своего контейнера.
 * Числовые значения выравниваются по правому краю и форматируются.
 */
export function DataTable() {
  const t = useT();
  const activeSheet = useDataStore((s) => s.getActiveSheet());
  const dataset = useDataStore((s) => s.dataset);

  if (!activeSheet) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm p-8">
        {t('table.noData')}
      </div>
    );
  }

  const { columns, rows, name } = activeSheet;

  // Числовые колонки (для выравнивания и форматирования)
  const numericCols = new Set<string>();
  for (const col of columns) {
    let numCount = 0;
    let total = 0;
    for (const r of rows) {
      if (r[col] === null || r[col] === undefined) continue;
      total++;
      if (typeof r[col] === 'number') numCount++;
    }
    if (total > 0 && numCount / total > 0.5) numericCols.add(col);
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide truncate">
            {dataset?.sourceName ?? t('table.title')}
          </h3>
          <p className="text-xs text-gray-500 truncate">
            {t('table.sheet')}: <span className="font-medium">{name}</span> ·
            {' '}{t('table.rows')}: {rows.length} · {t('table.cols')}: {columns.length}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className={`px-3 py-2 font-medium text-gray-700 border-b border-r border-gray-200 whitespace-nowrap ${
                    numericCols.has(col) ? 'text-right' : 'text-left'
                  }`}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50/40 even:bg-gray-50/50">
                {columns.map((col) => {
                  const v = row[col];
                  const isNum = numericCols.has(col);
                  return (
                    <td
                      key={col}
                      className={`px-3 py-1.5 border-b border-r border-gray-100 ${
                        isNum
                          ? 'text-right tabular-nums text-gray-700'
                          : 'text-left text-gray-800'
                      }`}
                    >
                      {formatCell(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-gray-400 py-6 italic"
                >
                  {t('table.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') {
    // Целое — без точки, дробное — до 4 знаков с группировкой тысяч
    if (Number.isInteger(v)) return v.toLocaleString('ru-RU');
    return v.toLocaleString('ru-RU', { maximumFractionDigits: 4 });
  }
  return String(v);
}
