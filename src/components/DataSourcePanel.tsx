/**
 * Упрощённая панель управления: только выбор темы данных и кнопка обновления.
 * Excel-режим и админка отключены в публичной версии.
 *
 * Если в будущем понадобится вернуть админ-интерфейс — компоненты
 * FileUploader и форма логина по-прежнему лежат в src/components/,
 * а PHP-эндпоинты /api/login.php и /api/upload.php продолжают работать.
 */
import { useEffect, useState } from 'react';
import { useApiData } from '@/hooks/useApiData';
import { api, type TopicDto } from '@/services/api';
import { useT } from '@/i18n/useTranslation';

export function DataSourcePanel() {
  const t = useT();
  const { loading, error, loadFromApi } = useApiData();
  const [topics, setTopics] = useState<TopicDto[]>([]);
  const [topicId, setTopicId] = useState<number | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Один раз грузим список тем (при монтировании, не зависит от языка)
  useEffect(() => {
    api.getMetadata()
      .then((md) => {
        setTopics(md.topics);
        if (md.topics.length > 0) setTopicId(md.topics[0].id);
      })
      .catch((e) =>
        setMetaError(e instanceof Error ? e.message : 'Failed to load metadata')
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // При смене темы — автозагрузка данных
  useEffect(() => {
    if (topicId === null) return;
    const topic = topics.find((x) => x.id === topicId);
    if (topic) loadFromApi(topic);
  }, [topicId, topics, loadFromApi]);

  const currentTopic = topics.find((tp) => tp.id === topicId) ?? null;

  return (
    <div className="space-y-3">
      {metaError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {metaError}
        </div>
      )}

      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-600 uppercase">
            {t('panel.topic')}
          </span>
          <select
            value={topicId ?? ''}
            onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : null)}
            disabled={topics.length === 0}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[260px]"
          >
            {topics.length === 0 && <option value="">{t('panel.loadingDots')}</option>}
            {topics.map((tp) => (
              <option key={tp.id} value={tp.id}>{tp.name}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => currentTopic && loadFromApi(currentTopic)}
          disabled={loading || !currentTopic}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? t('panel.loading') : t('panel.refresh')}
        </button>
      </div>

      {currentTopic?.description && (
        <p className="text-xs text-gray-500">{currentTopic.description}</p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
