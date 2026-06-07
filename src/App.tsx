import { useState } from 'react';
import { Header, type Page } from '@/components/Header';
import { DataSourcePanel } from '@/components/DataSourcePanel';
import { SheetTabs } from '@/components/SheetTabs';
import { ChartTypeSelector } from '@/components/ChartTypeSelector';
import { AxisSelector } from '@/components/AxisSelector';
import { DataTable } from '@/components/DataTable';
import { ChartRenderer } from '@/components/charts/ChartRenderer';
import { RegionMap } from '@/components/RegionMap';
import { TeamPage } from '@/components/TeamPage';
import { useDataStore } from '@/store/dataStore';
import { useT } from '@/i18n/useTranslation';

export default function App() {
  const t = useT();
  const [page, setPage] = useState<Page>('main');
  const dataset = useDataStore((s) => s.dataset);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header page={page} onNavigate={setPage} />

      {page === 'team' ? (
        <TeamPage />
      ) : (
        <>
          {/* Панель выбора темы данных */}
          <section className="bg-white border-b border-gray-200">
            <div className="max-w-[1400px] mx-auto px-4 py-3">
              <DataSourcePanel />
            </div>
          </section>

          {/* Панель настроек графика — видна только когда есть данные */}
          {dataset && (
            <section className="bg-slate-50 border-b border-gray-200">
              <div className="max-w-[1400px] mx-auto px-4 py-2">
                <SheetTabs />
                <div className="flex flex-wrap items-end gap-6 mt-3">
                  <ChartTypeSelector />
                  <AxisSelector />
                </div>
              </div>
            </section>
          )}

          {/* Основная рабочая зона: таблица | (график + карта) */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto p-4">
            <div className="grid lg:grid-cols-[3fr,2fr] gap-4 h-[calc(100vh_-_280px)] min-h-[600px]">
              {/* Левая колонка — таблица */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <DataTable />
              </section>

              {/* Правая колонка — график сверху, карта снизу */}
              <aside className="flex flex-col gap-4 min-h-0">
                <section className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {t('chart.title')}
                    </h3>
                  </div>
                  <div className="flex-1 p-3 min-h-0">
                    <ChartRenderer />
                  </div>
                </section>

                <section className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 min-h-0 overflow-hidden">
                  <RegionMap />
                </section>
              </aside>
            </div>
          </main>
        </>
      )}

      <footer className="bg-slate-900 text-slate-400 text-xs py-2 text-center">
        {t('footer.copyright')} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
