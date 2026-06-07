/**
 * Статическая страница «Команда проекта».
 * ФИО и описания приходят из словаря — для каждого языка свой вариант.
 *
 * Фотографии: положите файлы в public/team/ с именами:
 *   sadykanova.jpg, kumarbekuly.jpg, rashidinov.jpg, bagimbaeva.jpg
 */
import { useState } from 'react';
import { useT, useLangStore } from '@/i18n/useTranslation';
import type { Lang } from '@/i18n/translations';

interface Member {
  photoSlug: string;
  fullName: Record<Lang, string>;
  shortRoleKey: string;        // ключ перевода: 'team.role.leader' и т.п.
  description: Record<Lang, string>;
}

const GRANT_INFO = {
  code: 'AP23489325',
  title: {
    ru:
      'Моделирование пространственно-временной динамики показателей здоровья ' +
      'населения Восточно-Казахстанской области с применением ГИС-технологий',
    kk:
      'Шығыс Қазақстан облысы халқының денсаулық көрсеткіштерінің кеңістіктік-' +
      'уақыттық динамикасын ГАЖ-технологияларды қолдану арқылы модельдеу',
    en:
      'Modelling the spatio-temporal dynamics of health indicators of the ' +
      'population of the East Kazakhstan Region using GIS technologies',
  } satisfies Record<Lang, string>,
};

const MEMBERS: Member[] = [
  {
    photoSlug: 'sadykanova',
    fullName: {
      ru: 'Садыканова Гульназ Есимбековна',
      kk: 'Садықанова Гүлназ Есімбекқызы',
      en: 'Sadykanova Gulnaz Yesimbekovna',
    },
    shortRoleKey: 'team.role.leader',
    description: {
      ru: 'Кандидат биологических наук, профессор кафедры биологии ВКУ им. С. Аманжолова. ' +
          '«Лучший преподаватель ВУЗа — 2024». Специалист в области экологии человека и ' +
          'экологического мониторинга.',
      kk: 'Биология ғылымдарының кандидаты, С. Аманжолов атындағы ШҚУ биология ' +
          'кафедрасының профессоры. «Жыл үздік ЖОО оқытушысы — 2024». Адам экологиясы ' +
          'және экологиялық мониторинг саласындағы маман.',
      en: 'Candidate of Biological Sciences, Professor of the Biology Department at ' +
          'S. Amanzholov East Kazakhstan University. "Best University Teacher of 2024". ' +
          'Specialist in human ecology and environmental monitoring.',
    },
  },
  {
    photoSlug: 'kumarbekuly',
    fullName: {
      ru: 'Құмарбекұлы Санат',
      kk: 'Құмарбекұлы Санат',
      en: 'Kumarbekuly Sanat',
    },
    shortRoleKey: 'team.role.lead',
    description: {
      ru: 'PhD, ассоциированный профессор кафедры экологии и географии КазНПУ им. Абая. ' +
          '«Лучший преподаватель ВУЗа — 2025». Специалист в области экологии ' +
          'окружающей среды.',
      kk: 'PhD, Абай атындағы ҚазҰПУ экология және география кафедрасының ' +
          'қауымдастырылған профессоры. «Жыл үздік ЖОО оқытушысы — 2025». ' +
          'Қоршаған орта экологиясы саласындағы маман.',
      en: 'PhD, Associate Professor of the Department of Ecology and Geography ' +
          'at Abai Kazakh National Pedagogical University. "Best University ' +
          'Teacher of 2025". Specialist in environmental ecology.',
    },
  },
  {
    photoSlug: 'rashidinov',
    fullName: {
      ru: 'Рашидинов Дамир Рашидинович',
      kk: 'Рашидинов Дамир Рашидиновичі',
      en: 'Rashidinov Damir Rashidinovich',
    },
    shortRoleKey: 'team.role.researcher',
    description: {
      ru: 'Магистр по специальности «Информационные системы», сеньор-лектор кафедры ' +
          '«Информационные системы» Алматинского технологического университета.',
      kk: '«Ақпараттық жүйелер» мамандығы бойынша магистр, Алматы технологиялық ' +
          'университетінің «Ақпараттық жүйелер» кафедрасының аға дәріскері.',
      en: 'Master\'s degree in Information Systems, Senior Lecturer at the ' +
          'Information Systems Department of Almaty Technological University.',
    },
  },
  {
    photoSlug: 'bagimbaeva',
    fullName: {
      ru: 'Багимбаева Зухра Болатбековна',
      kk: 'Бағымбаева Зүхра Болатбекқызы',
      en: 'Bagimbayeva Zuhra Bolatbekovna',
    },
    shortRoleKey: 'team.role.researcher2',
    description: {
      ru: 'Докторант 3 года обучения ОП 8D01505 — Биология ВКУ им. С. Аманжолова.',
      kk: 'С. Аманжолов атындағы ШҚУ 8D01505 — Биология БББ 3-курс докторанты.',
      en: 'Third-year PhD student in the Biology programme (8D01505) at ' +
          'S. Amanzholov East Kazakhstan University.',
    },
  },
];

export function TeamPage() {
  const t    = useT();
  const lang = useLangStore((s) => s.lang);

  return (
    <main className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Карточка проекта */}
      <section className="bg-gradient-to-r from-blue-700 to-slate-800 text-white rounded-lg shadow-md p-6">
        <div className="text-xs uppercase tracking-wider text-blue-300 mb-2">
          {t('team.grant.label')}
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="text-2xl font-bold tabular-nums">{GRANT_INFO.code}</span>
        </div>
        <p className="text-sm sm:text-base text-blue-50 leading-relaxed">
          «{GRANT_INFO.title[lang]}»
        </p>
      </section>

      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{t('team.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('team.subtitle')}</p>
      </div>

      {/* Карточки участников */}
      <div className="grid sm:grid-cols-2 gap-5">
        {MEMBERS.map((m) => (
          <MemberCard key={m.photoSlug} member={m} lang={lang} />
        ))}
      </div>
    </main>
  );
}

function MemberCard({ member, lang }: { member: Member; lang: Lang }) {
  const t = useT();
  const [photoFailed, setPhotoFailed] = useState(false);

  const fullName = member.fullName[lang];
  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row">
      <div className="sm:w-40 sm:flex-shrink-0 bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center aspect-square sm:aspect-auto sm:h-auto sm:min-h-[200px]">
        {!photoFailed ? (
          <img
            src={`/team/${member.photoSlug}.jpg`}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-dashed border-blue-300 flex items-center justify-center text-2xl font-semibold text-blue-700">
              {initials}
            </div>
            <div className="mt-2 text-xs text-gray-400">{t('team.photo.placeholder')}</div>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 space-y-2">
        <h3 className="text-base font-semibold text-gray-900 leading-tight">
          {fullName}
        </h3>
        <div className="text-xs uppercase tracking-wide text-blue-700 font-medium">
          {t(member.shortRoleKey)}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {member.description[lang]}
        </p>
      </div>
    </article>
  );
}
