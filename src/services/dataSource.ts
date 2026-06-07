import * as XLSX from 'xlsx';
import type { Dataset, DataRow, SheetData } from '@/types';
import { api, type DataRowDto } from './api';

/**
 * Абстракция источника данных.
 * Сейчас реализован только парсинг Excel в браузере.
 * В будущем здесь же будут реализованы:
 *   - fetchFromApi(url): Promise<Dataset>
 *   - fetchFromDatabase(...): Promise<Dataset>
 * Интерфейс DataSource даёт UI единый контракт независимо от источника.
 */

export interface DataSource {
  load(): Promise<Dataset>;
}

/** Парсит лист Excel в SheetData. Числовые значения остаются числами. */
function parseSheet(workbook: XLSX.WorkBook, sheetName: string): SheetData {
  const worksheet = workbook.Sheets[sheetName];
  // raw: true сохраняет числа как числа, defval: null для пустых ячеек
  const rows = XLSX.utils.sheet_to_json<DataRow>(worksheet, {
    raw: true,
    defval: null,
  });

  // Колонки берём из первой строки + объединяем со всеми ключами
  // (на случай если в разных строках разный набор полей)
  const columnSet = new Set<string>();
  rows.forEach((row) => Object.keys(row).forEach((k) => columnSet.add(k)));
  const columns = Array.from(columnSet);

  return {
    name: sheetName,
    columns,
    rows,
  };
}

/** Источник данных из Excel-файла, выбранного пользователем. */
export class ExcelDataSource implements DataSource {
  constructor(private readonly file: File) {}

  async load(): Promise<Dataset> {
    const buffer = await this.file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheets = workbook.SheetNames.map((name) =>
      parseSheet(workbook, name)
    );
    return {
      sourceName: this.file.name,
      sheets,
    };
  }
}

/**
 * Источник данных из бэкенда (PHP + MySQL).
 *
 * При вызове load(topicId) грузит факты для указанной темы и строит набор листов,
 * адаптированных под доступные размерности темы (city/age_group могут отсутствовать).
 */
export class ApiDataSource implements DataSource {
  constructor(private readonly topicId: number, private readonly topicName: string) {}

  async load(): Promise<Dataset> {
    const { rows } = await api.getData({ topicId: this.topicId });
    const sheets = buildSheetsFromApiRows(rows, this.topicName);
    return {
      sourceName: `БД · ${this.topicName}`,
      sheets,
    };
  }
}

function uniq<T, K extends string | number>(items: T[], keyFn: (x: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const x of items) {
    const k = keyFn(x);
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out;
}

function buildSheetsFromApiRows(rows: DataRowDto[], topicName: string): SheetData[] {
  if (rows.length === 0) {
    return [{
      name: 'Нет данных',
      columns: ['Сообщение'],
      rows: [{ Сообщение: `Для темы «${topicName}» нет записей в БД` }],
    }];
  }

  const periodObjs   = uniq(rows, r => r.period);
  const categoryObjs = uniq(rows, r => r.category);
  const cityObjs     = uniq(rows.filter(r => r.city !== null), r => r.city!);
  const ageObjs      = uniq(rows.filter(r => r.age_group !== null), r => r.age_group!);

  // Сортируем периоды по year_num + тип (полные года в конце своего года)
  const periodLabels = periodObjs.map(r => r.period).sort((a, b) => {
    const ra = periodObjs.find(r => r.period === a)!;
    const rb = periodObjs.find(r => r.period === b)!;
    const sa = ra.year_num * 100 + (/^\d{4}$/.test(a) ? 99 : 5);
    const sb = rb.year_num * 100 + (/^\d{4}$/.test(b) ? 99 : 5);
    return sa - sb || a.localeCompare(b);
  });

  const categories = categoryObjs.map(c => c.category);
  const cities     = cityObjs.map(c => c.city!);
  const ages       = ageObjs.map(a => a.age_group!);

  const hasCity = cities.length > 0;
  const hasAge  = ages.length > 0;
  const regionTotal = cities.find(c => c === 'ВКО (всего)' || c.toLowerCase().includes('вко'));

  // Индекс: period|category|city|age → value
  const idx = new Map<string, number>();
  for (const r of rows) {
    idx.set(`${r.period}|${r.category}|${r.city ?? ''}|${r.age_group ?? ''}`, r.value);
  }

  const sheets: SheetData[] = [];

  // === Сценарий 1: тема с возрастными группами (заболеваемость) ===
  // Лист на каждый возраст: год × категория для ВКО (всего)
  if (hasAge && regionTotal) {
    for (const age of ages) {
      const sheetRows: DataRow[] = periodLabels.map(p => {
        const row: DataRow = { 'Период': p };
        for (const c of categories) {
          row[c] = idx.get(`${p}|${c}|${regionTotal}|${age}`) ?? null;
        }
        return row;
      });
      sheets.push({
        name: `Динамика — ${age}`.slice(0, 31),
        columns: ['Период', ...categories],
        rows: sheetRows,
      });
    }
    // Лист «Возрастные группы»: год × возраст для первой категории
    const firstCat = categories[0];
    const sheetRows: DataRow[] = periodLabels.map(p => {
      const row: DataRow = { 'Период': p };
      for (const age of ages) {
        row[age] = idx.get(`${p}|${firstCat}|${regionTotal}|${age}`) ?? null;
      }
      return row;
    });
    sheets.push({
      name: 'Возрастные группы',
      columns: ['Период', ...ages],
      rows: sheetRows,
    });
  }

  // === Сценарий 2: тема с городами но без возраста (атмосфера, радиация, кач-во воздуха) ===
  if (hasCity && !hasAge) {
    // Лист на категорию: город × период
    for (const cat of categories.slice(0, 20)) {  // ограничиваем во избежание тысяч листов
      const sheetRows: DataRow[] = cities.map(c => {
        const row: DataRow = { 'Город': c };
        for (const p of periodLabels) {
          row[p] = idx.get(`${p}|${cat}|${c}|`) ?? null;
        }
        return row;
      });
      sheets.push({
        name: cat.slice(0, 31),
        columns: ['Город', ...periodLabels],
        rows: sheetRows,
      });
    }
  }

  // === Сценарий 3: тема без городов и возрастов (питьевая вода) ===
  if (!hasCity && !hasAge) {
    // Один сводный лист: год × категория
    const sheetRows: DataRow[] = periodLabels.map(p => {
      const row: DataRow = { 'Период': p };
      for (const c of categories) {
        row[c] = idx.get(`${p}|${c}||`) ?? null;
      }
      return row;
    });
    sheets.push({
      name: 'Сводная',
      columns: ['Период', ...categories],
      rows: sheetRows,
    });
  }

  // === Лист «Полные данные» (long format) — всегда ===
  const cols = ['Период', 'Категория'];
  if (hasCity) cols.push('Город');
  if (hasAge)  cols.push('Возраст');
  cols.push('Значение');
  if (rows.some(r => r.value_extra !== null)) cols.push('Доп. значение');

  sheets.push({
    name: 'Полные данные',
    columns: cols,
    rows: rows.map(r => {
      const row: DataRow = { 'Период': r.period, 'Категория': r.category };
      if (hasCity) row['Город'] = r.city;
      if (hasAge)  row['Возраст'] = r.age_group;
      row['Значение'] = r.value;
      if (cols.includes('Доп. значение')) row['Доп. значение'] = r.value_extra;
      return row;
    }),
  });

  return sheets;
}
