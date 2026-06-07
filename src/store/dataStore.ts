import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChartType, Dataset, SheetData } from '@/types';

interface DataState {
  // Загруженные данные (не персистятся — Excel-файл нужно загружать заново)
  dataset: Dataset | null;
  activeSheetName: string | null;

  // Конфигурация графика (персистится в localStorage)
  chartType: ChartType;
  xKey: string | null;
  yKeys: string[];

  // Действия
  setDataset: (dataset: Dataset) => void;
  setActiveSheet: (name: string) => void;
  setChartType: (type: ChartType) => void;
  setXKey: (key: string | null) => void;
  setYKeys: (keys: string[]) => void;
  toggleYKey: (key: string) => void;
  reset: () => void;

  // Селекторы
  getActiveSheet: () => SheetData | null;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      dataset: null,
      activeSheetName: null,
      chartType: 'bar',
      xKey: null,
      yKeys: [],

      setDataset: (dataset) => {
        const firstSheet = dataset.sheets[0];
        const currentActive = get().activeSheetName;
        const stillExists =
          currentActive && dataset.sheets.some((s) => s.name === currentActive);

        set({
          dataset,
          activeSheetName: stillExists ? currentActive : firstSheet?.name ?? null,
        });

        // Если текущие выбранные колонки не подходят к новому листу — сбросить
        const active = stillExists
          ? dataset.sheets.find((s) => s.name === currentActive)!
          : firstSheet;
        if (active) {
          const { xKey, yKeys } = get();
          const cols = active.columns;
          if (!xKey || !cols.includes(xKey)) {
            set({ xKey: cols[0] ?? null });
          }
          const validY = yKeys.filter((k) => cols.includes(k));
          if (validY.length === 0) {
            // По умолчанию — первая числовая колонка после X
            const firstNumeric = cols.find(
              (c) =>
                c !== (get().xKey ?? cols[0]) &&
                active.rows.some((r) => typeof r[c] === 'number')
            );
            set({ yKeys: firstNumeric ? [firstNumeric] : [] });
          } else {
            set({ yKeys: validY });
          }
        }
      },

      setActiveSheet: (name) => {
        const ds = get().dataset;
        if (!ds) return;
        const sheet = ds.sheets.find((s) => s.name === name);
        if (!sheet) return;
        set({ activeSheetName: name });

        // Подгоняем оси под новый лист
        const { xKey, yKeys } = get();
        const cols = sheet.columns;
        const nextX = xKey && cols.includes(xKey) ? xKey : cols[0] ?? null;
        const nextY = yKeys.filter((k) => cols.includes(k));
        set({
          xKey: nextX,
          yKeys:
            nextY.length > 0
              ? nextY
              : (() => {
                  const firstNumeric = cols.find(
                    (c) =>
                      c !== nextX &&
                      sheet.rows.some((r) => typeof r[c] === 'number')
                  );
                  return firstNumeric ? [firstNumeric] : [];
                })(),
        });
      },

      setChartType: (chartType) => set({ chartType }),
      setXKey: (xKey) => set({ xKey }),
      setYKeys: (yKeys) => set({ yKeys }),
      toggleYKey: (key) => {
        const { yKeys } = get();
        set({
          yKeys: yKeys.includes(key)
            ? yKeys.filter((k) => k !== key)
            : [...yKeys, key],
        });
      },

      reset: () =>
        set({
          dataset: null,
          activeSheetName: null,
          xKey: null,
          yKeys: [],
        }),

      getActiveSheet: () => {
        const { dataset, activeSheetName } = get();
        if (!dataset || !activeSheetName) return null;
        return dataset.sheets.find((s) => s.name === activeSheetName) ?? null;
      },
    }),
    {
      name: 'graph-from-data:config',
      // Сохраняем только конфигурацию, не сами данные
      partialize: (state) => ({
        chartType: state.chartType,
        activeSheetName: state.activeSheetName,
        xKey: state.xKey,
        yKeys: state.yKeys,
      }),
    }
  )
);
