import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useDataStore } from '@/store/dataStore';
import { useT } from '@/i18n/useTranslation';

// Палитра для серий и сегментов pie
const COLORS = [
  '#2563eb', '#16a34a', '#ea580c', '#9333ea', '#dc2626',
  '#0891b2', '#ca8a04', '#db2777', '#65a30d', '#7c3aed',
];

// Высота графика: предпочитаем заполнить контейнер, fallback 360 если родитель
// без явной высоты (например, в режиме «как раньше», без двухколоночной сетки).
const HEIGHT = '100%';
const MIN_HEIGHT = 320;

// Обёртка для ResponsiveContainer: гарантирует ему высоту контейнера.
// Объявлена на уровне модуля, чтобы не пересоздавался тип компонента при каждом
// рендере — иначе ResponsiveContainer перемонтировался бы и график мерцал.
function Wrap({ children }: { children: React.ReactElement }) {
  return (
    <div className="w-full h-full" style={{ minHeight: MIN_HEIGHT }}>
      {children}
    </div>
  );
}

export function ChartRenderer() {
  const t = useT();
  const activeSheet = useDataStore((s) => s.getActiveSheet());
  const chartType = useDataStore((s) => s.chartType);
  const xKey = useDataStore((s) => s.xKey);
  const yKeys = useDataStore((s) => s.yKeys);

  if (!activeSheet) {
    return (
      <EmptyState message={t('chart.loadDataFirst')} />
    );
  }
  if (!xKey || yKeys.length === 0) {
    return (
      <EmptyState message={t('chart.selectAxes')} />
    );
  }

  const data = activeSheet.rows;

  // Pie использует одну Y-колонку
  if (chartType === 'pie') {
    const yKey = yKeys[0];
    const pieData = data
      .filter((row) => typeof row[yKey] === 'number')
      .map((row) => ({
        name: String(row[xKey] ?? ''),
        value: row[yKey] as number,
      }));
    return (
      <Wrap><ResponsiveContainer width="100%" height={HEIGHT}>
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={140}
            label
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer></Wrap>
    );
  }

  if (chartType === 'scatter') {
    // Для scatter каждая yKey — отдельный набор точек (x, y)
    return (
      <Wrap><ResponsiveContainer width="100%" height={HEIGHT}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} type="category" />
          <YAxis />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          {yKeys.map((yKey, i) => (
            <Scatter
              key={yKey}
              name={yKey}
              data={data.map((row) => ({
                [xKey]: row[xKey],
                [yKey]: row[yKey],
              }))}
              fill={COLORS[i % COLORS.length]}
            />
          ))}
        </ScatterChart>
      </ResponsiveContainer></Wrap>
    );
  }

  // Универсальные обертки для bar/line/area
  const commonAxes = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xKey} />
      <YAxis />
      <Tooltip />
      <Legend />
    </>
  );

  if (chartType === 'bar') {
    return (
      <Wrap><ResponsiveContainer width="100%" height={HEIGHT}>
        <BarChart data={data}>
          {commonAxes}
          {yKeys.map((yKey, i) => (
            <Bar key={yKey} dataKey={yKey} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer></Wrap>
    );
  }

  if (chartType === 'line') {
    return (
      <Wrap><ResponsiveContainer width="100%" height={HEIGHT}>
        <LineChart data={data}>
          {commonAxes}
          {yKeys.map((yKey, i) => (
            <Line
              key={yKey}
              type="monotone"
              dataKey={yKey}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer></Wrap>
    );
  }

  // area
  return (
    <Wrap><ResponsiveContainer width="100%" height={HEIGHT}>
      <AreaChart data={data}>
        {commonAxes}
        {yKeys.map((yKey, i) => (
          <Area
            key={yKey}
            type="monotone"
            dataKey={yKey}
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.3}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer></Wrap>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="h-full w-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm"
      style={{ minHeight: MIN_HEIGHT }}
    >
      {message}
    </div>
  );
}
