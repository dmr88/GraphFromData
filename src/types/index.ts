// Поддерживаемые типы графиков
export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter';

// Строка данных — произвольный объект "колонка -> значение"
export type DataRow = Record<string, string | number | null>;

// Один лист Excel (или один датасет в будущем)
export interface SheetData {
  name: string;          // имя листа / датасета
  columns: string[];     // заголовки колонок
  rows: DataRow[];       // строки данных
}

// Полный набор загруженных данных (несколько листов)
export interface Dataset {
  sourceName: string;    // имя файла или источника
  sheets: SheetData[];   // все листы
}

// Конфигурация графика
export interface ChartConfig {
  chartType: ChartType;
  xKey: string | null;       // колонка для оси X / категорий
  yKeys: string[];           // одна или несколько колонок для оси Y
}

// Сохраняемое состояние (для localStorage)
export interface PersistedState {
  chartType: ChartType;
  activeSheetName: string | null;
  xKey: string | null;
  yKeys: string[];
}
