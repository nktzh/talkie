import { getMockCurrentUser } from "@/entities/user/api/mock-user";
import { createForwardedContent } from "../lib/forward";
import { createMessageReply } from "../lib/reply";
import type {
  Conversation,
  ConversationId,
  Message,
  MessageAttachment,
  MessageFormat,
  MessageReaction,
  MessageStatus,
  User,
  VoiceNote,
} from "../model/types";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** Вложение без идентификатора: его проставит сборщик базы, чтобы номера не пересекались */
type AttachmentSeed = Omit<MessageAttachment, "id">;

interface MessageSeed {
  /** "channel" — пост от имени канала */
  from: User | "channel";
  minutesAgo: number;
  text: string;
  /** По умолчанию — обычный текст */
  format?: MessageFormat;
  status?: MessageStatus;
  views?: number;
  attachments?: AttachmentSeed[];
  voice?: VoiceNote;
  /** Сколько раз поставлено каждое эмодзи, с учётом реакций текущего пользователя */
  reactions?: Record<string, number>;
  /** Эмодзи из reactions, которые поставил текущий пользователь, — от старых к новым */
  myReactions?: string[];
  /** Номер сообщения в этом же чате, на которое ответили, — с единицы, как в id */
  replyTo?: number;
  /** Пересланное сообщение: содержимое берётся из оригинала, text сида не используется */
  forwardedFrom?: { conversationId: ConversationId; number: number };
}

interface ConversationSeed {
  /** lastMessage вычисляется из списка сообщений */
  conversation: DistributiveOmit<Conversation, "lastMessage">;
  messages: MessageSeed[];
}

export interface MockDatabase {
  conversations: Conversation[];
  messages: Record<ConversationId, Message[]>;
}

const MINUTE_MS = 60_000;

/*
 * Вложения в моках — заглушки: настоящие адреса появятся вместе с загрузкой файлов на сервер.
 * Документы отдаём data-ссылкой, чтобы кнопка «скачать» работала, а картинки рисуем в SVG.
 */
function mockFile(name: string, sizeKb: number, mimeType: string): AttachmentSeed {
  const body = `Файл-заглушка «${name}». Настоящие файлы появятся вместе с загрузкой на сервер.`;
  return {
    kind: "file",
    name,
    size: Math.round(sizeKb * 1024),
    mimeType,
    url: `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`,
  };
}

function gradientSvg(hue: number, width: number, height: number): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="hsl(${hue} 72% 64%)"/>` +
    `<stop offset="1" stop-color="hsl(${hue + 35} 66% 42%)"/>` +
    `</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  );
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function mockImage(name: string, hue: number, width: number, height: number): AttachmentSeed {
  const svg = gradientSvg(hue, width, height);

  return {
    kind: "image",
    name,
    size: svg.length,
    mimeType: "image/svg+xml",
    url: svgDataUrl(svg),
    width,
    height,
  };
}

/*
 * Голосовое-заглушка: настоящей записи нет, поэтому вместо неё — доли секунды тишины.
 * Длительность и волна берутся из данных, так что сообщение выглядит как настоящее.
 */
const SILENT_AUDIO_URL =
  "data:audio/wav;base64,UklGRkwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";

/** Волна строится по формуле: в моках нет записи, из которой её можно посчитать */
function mockVoice(durationMs: number, seed: number): VoiceNote {
  const waveform = Array.from({ length: 40 }, (_, index) => {
    const wave = Math.sin(index * 0.7 + seed) * 0.5 + Math.sin(index * 0.23 + seed * 2) * 0.3;
    return Math.round((0.45 + wave * 0.45) * 100) / 100;
  });

  return { url: SILENT_AUDIO_URL, mimeType: "audio/wav", durationMs, waveform };
}

/** Аудиофайл-заглушка: та же тишина, но длительность и размер — как у настоящего трека */
function mockAudio(name: string, sizeKb: number, durationMs: number): AttachmentSeed {
  return {
    kind: "audio",
    name,
    size: Math.round(sizeKb * 1024),
    mimeType: "audio/mpeg",
    url: SILENT_AUDIO_URL,
    durationMs,
  };
}

/** Видео-заглушка: вместо кадра — градиент в превью, вместо ролика — тишина */
function mockVideo(name: string, hue: number, width: number, height: number, durationMs: number): AttachmentSeed {
  return {
    kind: "video",
    name,
    size: Math.round((durationMs / 1000) * 180 * 1024),
    mimeType: "video/mp4",
    url: SILENT_AUDIO_URL,
    width,
    height,
    durationMs,
    previewUrl: svgDataUrl(gradientSvg(hue, width, height)),
  };
}

const USERS = {
  anna: { id: "u-anna", displayName: "Анна Смирнова", username: "anna_sm" },
  max: { id: "u-max", displayName: "Максим Орлов", username: "orlov" },
  kate: { id: "u-kate", displayName: "Екатерина Лебедева", username: "kate_l" },
  dmitry: { id: "u-dmitry", displayName: "Дмитрий Козлов", username: "dkozlov" },
  olga: { id: "u-olga", displayName: "Ольга Петрова", username: "olga_p" },
  ivan: { id: "u-ivan", displayName: "Иван Соколов", username: "sokolov" },
  sergey: { id: "u-sergey", displayName: "Сергей Волков", username: "volkov_s" },
  maria: { id: "u-maria", displayName: "Мария Кузнецова", username: "mkuz" },
  alexey: { id: "u-alexey", displayName: "Алексей Новиков", username: "novikov" },
  natalia: { id: "u-natalia", displayName: "Наталья Морозова", username: "nat_moroz" },
  pavel: { id: "u-pavel", displayName: "Павел Егоров", username: "egorov_p" },
  elena: { id: "u-elena", displayName: "Елена Васильева", username: "lena_v" },
  spam: { id: "u-spam", displayName: "Выигрыш дня", username: "prize_2026" },
} satisfies Record<string, User>;

const BOTS = {
  talkie: { id: "b-talkie", displayName: "Talkie Bot", username: "talkie_bot" },
  weather: { id: "b-weather", displayName: "Погодный бот", username: "weather_bot" },
  translate: { id: "b-translate", displayName: "Переводчик", username: "translate_bot" },
} satisfies Record<string, User>;

/** Длинная переписка, чтобы проверять прокрутку, подгрузку и разделители дат */
function longHistory(me: User, peer: User): MessageSeed[] {
  const lines = [
    "Как продвигается задача?",
    "Почти готово, осталось написать тесты",
    "Отлично, не торопись",
    "Посмотри, пожалуйста, пулреквест, когда будет время",
    "Оставил пару комментариев",
    "Поправил, глянь ещё раз",
    "Теперь всё супер 👍",
    "Созвон в силе?",
    "Да, через 10 минут",
    "Опаздываю на пару минут, начинайте без меня",
  ];

  return Array.from({ length: 60 }, (_, index) => ({
    from: index % 3 === 0 ? me : peer,
    // По несколько сообщений в день на протяжении пары недель
    minutesAgo: 20_000 - index * 330,
    text: lines[index % lines.length],
  }));
}

function createSeeds(at: (minutesAgo: number) => string): ConversationSeed[] {
  const me = getMockCurrentUser();
  const { anna, max, kate, dmitry, olga, ivan, sergey, maria, alexey, natalia, pavel, elena, spam } = USERS;
  const { talkie: talkieBot, weather: weatherBot, translate: translateBot } = BOTS;

  return [
    {
      conversation: {
        kind: "direct",
        id: "anna",
        title: anna.displayName,
        peer: anna,
        isOnline: true,
        lastSeenAt: null,
        isBlocked: false,
        unreadCount: 2,
        isPinned: true,
        isMuted: false,
      },
      messages: [
        { from: anna, minutesAgo: 1510, text: "Привет! Ты уже посмотрел макеты нового онбординга?" },
        { from: me, minutesAgo: 1502, text: "Привет! Да, вечером пройдусь подробно и оставлю комментарии" },
        { from: anna, minutesAgo: 1500, text: "Супер, спасибо 🙌", reactions: { "❤️": 1 }, myReactions: ["❤️"] },
        {
          from: anna,
          minutesAgo: 1440,
          text: "Вот два экрана из новой версии",
          attachments: [
            mockImage("onboarding-1.png", 210, 1280, 860),
            mockImage("onboarding-2.png", 260, 1280, 860),
          ],
        },
        {
          from: anna,
          minutesAgo: 1435,
          text: "",
          attachments: [mockFile("Онбординг v3.fig", 4820, "application/octet-stream")],
        },
        {
          from: anna,
          minutesAgo: 1430,
          text: "И запись прототипа, чтобы было видно анимации",
          attachments: [mockVideo("prototype.mp4", 200, 1280, 720, 42_000)],
        },
        {
          from: me,
          minutesAgo: 42,
          text: "Посмотрел. В целом очень круто, особенно экран с приглашениями",
          reactions: { "🔥": 1 },
        },
        {
          from: me,
          minutesAgo: 41,
          text: "Единственное — на шаге с паролем не хватает подсказки про требования",
        },
        { from: anna, minutesAgo: 6, text: "Точно, добавлю", replyTo: 8 },
        { from: anna, minutesAgo: 5.5, text: "", voice: mockVoice(14_200, 1) },
        { from: anna, minutesAgo: 5, text: "Созвонимся завтра утром и обсудим остальное?" },
      ],
    },
    {
      conversation: {
        kind: "group",
        id: "team",
        title: "Команда Talkie",
        role: "owner",
        membersCount: 6,
        members: [me, ivan, dmitry, olga, anna, kate],
        reactionsEnabled: true,
        unreadCount: 4,
        isPinned: true,
        isMuted: false,
      },
      messages: [
        { from: ivan, minutesAgo: 180, text: "Всем привет! Сегодня релиз в 18:00, не забываем про чек-лист" },
        { from: dmitry, minutesAgo: 176, text: "Бэкенд готов, миграции прогнал на стейдже" },
        {
          from: dmitry,
          minutesAgo: 175,
          text: "План миграций на всякий случай",
          attachments: [mockFile("migrations-2.4.sql", 36, "application/sql")],
        },
        { from: me, minutesAgo: 170, text: "Фронт тоже почти всё, осталось докрутить тёмную тему" },
        {
          from: olga,
          minutesAgo: 31,
          text: "Прогнала регресс — критичных багов нет",
          reactions: { "👏": 3, "🔥": 2 },
          myReactions: ["👏"],
        },
        {
          from: olga,
          minutesAgo: 30.5,
          text: "Отчёт и скриншоты",
          attachments: [
            mockFile("Регресс 2.4.pdf", 1240, "application/pdf"),
            mockFile("Тест-кейсы.xlsx", 96, "application/vnd.ms-excel"),
            mockImage("regress-report.png", 150, 1200, 900),
          ],
        },
        { from: olga, minutesAgo: 30, text: "Пара мелочей заведена в задачах, посмотрите, как будет минутка" },
        { from: ivan, minutesAgo: 19, text: "", forwardedFrom: { conversationId: "talkie-news", number: 5 } },
        {
          from: ivan,
          minutesAgo: 12,
          text: "Отлично, тогда идём по плану 🚀",
          // 🚀 в палитре нет — например, его оттуда убрали: реакция видна, но поставить её нельзя
          reactions: { "👍": 4, "🚀": 2 },
          myReactions: ["👍"],
        },
        { from: ivan, minutesAgo: 11, text: "", voice: mockVoice(38_000, 2) },
        {
          from: me,
          minutesAgo: 8,
          format: "markdown",
          text: [
            "### Чек-лист релиза",
            "",
            "1. Прогнать `npm run build`",
            "2. Проверить тёмную тему",
            "3. Обновить changelog",
            "",
            "Команда для отката:",
            "",
            "```",
            "git revert --no-edit HEAD",
            "```",
          ].join("\n"),
          status: "read",
          reactions: { "🫡": 2 },
        },
        { from: dmitry, minutesAgo: 3, text: "Кто-нибудь видел ключи от переговорки?", reactions: { "👀": 2, "🤔": 1 } },
        { from: olga, minutesAgo: 2, text: "Кажется, их забрали на ресепшен", replyTo: 12 },
      ],
    },
    {
      conversation: {
        kind: "channel",
        id: "talkie-news",
        title: "Talkie News",
        subscribersCount: 12_480,
        role: "subscriber",
        reactionsEnabled: true,
        unreadCount: 3,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        {
          from: "channel",
          minutesAgo: 2900,
          text: "Добро пожаловать в официальный канал Talkie! Здесь мы рассказываем о новых функциях и планах развития.",
          views: 10_230,
          reactions: { "❤️": 2_310, "👍": 1_540, "🎉": 402 },
        },
        {
          from: "channel",
          minutesAgo: 1400,
          text: "Открыли регистрацию по пригласительным кодам. Попросите код у друзей, которые уже пользуются Talkie.",
          views: 9_874,
        },
        {
          from: "channel",
          minutesAgo: 700,
          text: "Собрали пресс-кит: логотипы, иконки и рекомендации по использованию бренда.",
          views: 7_015,
          attachments: [
            mockFile("talkie-press-kit.zip", 8640, "application/zip"),
            mockImage("brand-cover.png", 205, 1600, 900),
          ],
        },
        {
          from: "channel",
          minutesAgo: 95,
          text: "Скоро в Talkie появятся каналы: публикуйте посты для своей аудитории, а подписчики смогут читать ленту и получать уведомления о новых записях.",
          views: 4_312,
          reactions: { "🔥": 518, "🤩": 97, "🤔": 12 },
          myReactions: ["🔥", "🤩"],
        },
        {
          from: "channel",
          minutesAgo: 20,
          format: "markdown",
          text: [
            "## Обновление 2.4",
            "",
            "Что нового в этой версии:",
            "",
            "- **Форматирование сообщений** — заголовки, списки, таблицы",
            "- *Курсив*, ~~зачёркнутый текст~~ и `код в строке`",
            "- Ссылки: [документация](https://talkie.example/docs)",
            "",
            "| Платформа | Версия | Статус     |",
            "| --------- | ------ | ---------- |",
            "| Web       | 2.4.0  | доступна   |",
            "| Android   | 2.4.0  | в раскатке |",
            "| iOS       | 2.3.9  | на ревью   |",
            "",
            "> Обновление прилетит автоматически в течение суток.",
          ].join("\n"),
          views: 2_106,
          reactions: { "🎉": 184, "👍": 76 },
        },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "max",
        title: max.displayName,
        peer: max,
        isOnline: false,
        lastSeenAt: at(55),
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: max, minutesAgo: 300, text: "Скинь, пожалуйста, доступ к репозиторию" },
        { from: me, minutesAgo: 290, text: "Добавил тебя, проверь почту" },
        { from: max, minutesAgo: 285, text: "Всё пришло, спасибо!" },
        {
          from: max,
          minutesAgo: 280,
          text: "Кстати, вот плейлист для фокуса, о котором говорил",
          attachments: [mockAudio("Lo-fi для работы.mp3", 8_640, 222_000), mockAudio("Шум дождя.m4a", 5_120, 185_000)],
        },
      ],
    },
    {
      conversation: {
        kind: "channel",
        id: "design-notes",
        title: "Дизайн-заметки",
        subscribersCount: 842,
        role: "owner",
        reactionsEnabled: true,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        {
          from: "channel",
          minutesAgo: 3000,
          text: "Небольшое правило: на экране должна быть одна главная кнопка. Всё остальное — второстепенные действия.",
          views: 611,
          reactions: { "👌": 48, "👍": 36 },
        },
        {
          from: "channel",
          minutesAgo: 200,
          text: "Тёмная тема — это не инверсия цветов. Поверхности становятся светлее по мере того, как «приближаются» к пользователю.",
          views: 488,
          reactions: { "🔥": 27, "🤔": 12 },
        },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "kate",
        title: kate.displayName,
        peer: kate,
        isOnline: false,
        lastSeenAt: at(2900),
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: kate, minutesAgo: 4400, text: "Спасибо за помощь с презентацией!" },
        { from: me, minutesAgo: 4390, text: "Всегда пожалуйста 😊" },
      ],
    },
    {
      conversation: {
        kind: "group",
        id: "altai",
        title: "Выходные на Алтае",
        role: "member",
        membersCount: 5,
        members: [me, dmitry, anna, kate, max],
        reactionsEnabled: true,
        unreadCount: 12,
        isPinned: false,
        isMuted: true,
      },
      messages: [
        { from: dmitry, minutesAgo: 800, text: "Забронировал домик на субботу и воскресенье" },
        { from: anna, minutesAgo: 780, text: "Ура! Что брать с собой?" },
        {
          from: dmitry,
          minutesAgo: 770,
          text: "Вот как выглядит домик",
          attachments: [mockImage("altai-1.jpg", 110, 1400, 930), mockImage("altai-2.jpg", 35, 1400, 930)],
          reactions: { "🥰": 3 },
          myReactions: ["🥰"],
        },
        {
          from: dmitry,
          minutesAgo: 765,
          text: "",
          attachments: [mockFile("Маршрут.pdf", 720, "application/pdf")],
        },
        {
          from: kate,
          minutesAgo: 740,
          text: "",
          attachments: [
            mockImage("altai-3.jpg", 160, 1400, 930),
            mockVideo("river.mp4", 190, 1920, 1080, 18_000),
            mockImage("altai-4.jpg", 20, 1400, 930),
          ],
        },
        { from: anna, minutesAgo: 735, text: "Какая красота 😍 Беру второй этаж!", replyTo: 3 },
        { from: anna, minutesAgo: 700, text: "", voice: mockVoice(9_800, 3) },
        { from: dmitry, minutesAgo: 60, text: "Тёплые вещи обязательно, ночью обещают до +5" },
      ],
    },
    {
      conversation: {
        kind: "channel",
        id: "frontend-daily",
        title: "Frontend Daily",
        subscribersCount: 56_300,
        role: "subscriber",
        // Владелец выключил реакции: подписчикам меню не предлагает их поставить
        reactionsEnabled: false,
        unreadCount: 7,
        isPinned: false,
        isMuted: true,
      },
      messages: [
        {
          from: "channel",
          minutesAgo: 600,
          text: "CSS-свойство field-sizing: content позволяет полям ввода подстраивать размер под содержимое без JavaScript.",
          views: 23_104,
        },
        {
          from: "channel",
          minutesAgo: 20,
          text: "Совет дня: селектор :has() позволяет стилизовать родителя в зависимости от состояния дочерних элементов.",
          views: 8_452,
        },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "olga",
        title: olga.displayName,
        peer: olga,
        isOnline: true,
        lastSeenAt: null,
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: me, minutesAgo: 10_100, text: "Оля, пришли, пожалуйста, отчёт по тестированию" },
        { from: olga, minutesAgo: 10_080, text: "Отправила на почту" },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "dmitry",
        title: dmitry.displayName,
        peer: dmitry,
        isOnline: false,
        lastSeenAt: at(20),
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: dmitry, minutesAgo: 2000, text: "Во сколько завтра встречаемся?" },
        { from: me, minutesAgo: 1990, text: "Давай в 11 у офиса", status: "sent" },
      ],
    },
    {
      conversation: {
        kind: "bot",
        id: "talkie-bot",
        title: talkieBot.displayName,
        bot: talkieBot,
        unreadCount: 1,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: me, minutesAgo: 140, text: "/start" },
        {
          from: talkieBot,
          minutesAgo: 140,
          text: "Привет! Я помогу разобраться в Talkie. Отправьте /help, чтобы увидеть список команд.",
        },
        { from: me, minutesAgo: 138, text: "/help" },
        {
          from: talkieBot,
          minutesAgo: 138,
          text: "Доступные команды:\n/invite — создать пригласительный код\n/settings — настройки уведомлений\n/help — эта справка",
        },
      ],
    },
    {
      conversation: {
        kind: "bot",
        id: "weather-bot",
        title: weatherBot.displayName,
        bot: weatherBot,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: me, minutesAgo: 1200, text: "Погода в Москве" },
        {
          from: weatherBot,
          minutesAgo: 1200,
          text: "Сейчас в Москве +14°, облачно. Вечером возможен небольшой дождь ☔️",
        },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "sergey",
        title: sergey.displayName,
        peer: sergey,
        isOnline: true,
        lastSeenAt: null,
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        ...longHistory(me, sergey),
        { from: me, minutesAgo: 16, text: "Выкатил фикс, проверь у себя" },
        { from: me, minutesAgo: 15, text: "И скинь логи, если снова упадёт", status: "sent" },
        { from: me, minutesAgo: 0.5, text: "Не могу отправить скриншот, что-то с сетью", status: "failed" },
      ],
    },
    {
      conversation: {
        kind: "group",
        id: "moms-chat",
        title: "Родительский чат 3«Б»",
        role: "admin",
        membersCount: 27,
        members: [me, maria, natalia, elena],
        // Выключены владельцем; администратор включить их не может
        reactionsEnabled: false,
        unreadCount: 58,
        isPinned: false,
        isMuted: true,
      },
      messages: [
        { from: maria, minutesAgo: 400, text: "Добрый вечер! Напоминаю, в пятницу собрание в 18:30" },
        { from: natalia, minutesAgo: 390, text: "Спасибо! А сдаём на экскурсию до какого числа?" },
        { from: maria, minutesAgo: 385, text: "До среды, реквизиты ниже" },
        {
          from: maria,
          minutesAgo: 384,
          text: "",
          attachments: [mockFile("Экскурсия в планетарий.docx", 54, "application/msword")],
        },
        { from: elena, minutesAgo: 120, text: "Кто-нибудь знает, что задали по окружающему миру?" },
        {
          from: natalia,
          minutesAgo: 118,
          text: "Вот фото из дневника",
          attachments: [mockImage("homework.jpg", 45, 900, 1200)],
        },
        { from: elena, minutesAgo: 110, text: "Спасибо большое! 🙏" },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "spam",
        title: spam.displayName,
        peer: spam,
        isOnline: false,
        lastSeenAt: null,
        isBlocked: true,
        unreadCount: 0,
        isPinned: false,
        isMuted: true,
      },
      messages: [
        {
          from: spam,
          minutesAgo: 6000,
          text: "Поздравляем! Вы выиграли iPhone. Чтобы забрать приз, перейдите по ссылке и введите данные карты",
        },
      ],
    },
    {
      conversation: {
        kind: "channel",
        id: "talkie-dev",
        title: "Talkie для разработчиков",
        username: "talkie_dev",
        description: "API, SDK и боты для Talkie. Анонсы изменений и примеры кода.",
        subscribersCount: 3_214,
        role: "admin",
        reactionsEnabled: true,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        {
          from: "channel",
          minutesAgo: 5000,
          format: "markdown",
          text: [
            "## Bot API: первые шаги",
            "",
            "Создайте бота через @talkie_bot и получите токен. Затем отправьте первое сообщение:",
            "",
            "```",
            "curl -X POST https://api.talkie.example/bot<TOKEN>/sendMessage \\",
            '  -d chat_id=123 -d text="Привет!"',
            "```",
          ].join("\n"),
          views: 2_870,
        },
        {
          from: "channel",
          minutesAgo: 2500,
          text: "Опубликовали SDK для TypeScript. Документация и примеры — в архиве.",
          views: 2_311,
          reactions: { "🔥": 214, "👏": 96 },
          attachments: [mockFile("talkie-sdk-1.0.0.tgz", 312, "application/gzip")],
        },
        {
          from: "channel",
          minutesAgo: 240,
          text: "Запись вебинара о вебхуках",
          views: 1_048,
          attachments: [mockVideo("webhooks-webinar.mp4", 280, 1920, 1080, 3_540_000)],
        },
      ],
    },
    {
      conversation: {
        kind: "group",
        id: "board-games",
        title: "Настолки по четвергам",
        username: "boardgames_msk",
        role: "member",
        membersCount: 143,
        members: [me, alexey, pavel, kate, ivan],
        reactionsEnabled: true,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: alexey, minutesAgo: 3100, text: "В четверг играем в «Каркассон» и «Кодовые имена», приходите!" },
        { from: pavel, minutesAgo: 3050, text: "Буду с другом, займите на двоих место" },
        { from: kate, minutesAgo: 3000, text: "", voice: mockVoice(5_400, 4) },
        {
          from: alexey,
          minutesAgo: 1600,
          text: "Фотки с прошлой встречи",
          attachments: [
            mockImage("games-1.jpg", 330, 1200, 800),
            mockImage("games-2.jpg", 10, 800, 1200),
            mockImage("games-3.jpg", 60, 1200, 800),
            mockImage("games-4.jpg", 290, 1200, 1200),
            mockImage("games-5.jpg", 180, 1200, 800),
          ],
          // Лимит своих реакций исчерпан: новая вытеснит самую старую — 😁
          reactions: { "😁": 12, "🏆": 5, "🔥": 3 },
          myReactions: ["😁", "🏆", "🔥"],
        },
        { from: ivan, minutesAgo: 1500, text: "Отличная была игра, реванш в следующий раз 😄" },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "elena",
        title: elena.displayName,
        peer: elena,
        isOnline: false,
        lastSeenAt: at(180),
        isBlocked: false,
        unreadCount: 3,
        isPinned: false,
        isMuted: false,
      },
      messages: [
        { from: me, minutesAgo: 260, text: "Лена, привет! Получилось посмотреть договор?" },
        { from: elena, minutesAgo: 190, text: "Привет! Да, есть пара правок" },
        {
          from: elena,
          minutesAgo: 189,
          text: "Отметила их в файле",
          attachments: [mockFile("Договор аренды — правки.pdf", 2_310, "application/pdf")],
        },
        {
          from: elena,
          minutesAgo: 185,
          text: "Самое важное — пункт 4.2: срок уведомления о расторжении лучше увеличить до 60 дней. И ещё стоит отдельно прописать, кто оплачивает коммунальные услуги, сейчас это нигде не указано.",
        },
      ],
    },
    {
      conversation: {
        kind: "direct",
        id: "pavel",
        title: pavel.displayName,
        peer: pavel,
        isOnline: false,
        lastSeenAt: null,
        createdAt: at(35),
        isBlocked: false,
        unreadCount: 0,
        isPinned: false,
        isMuted: false,
      },
      messages: [],
    },
    {
      conversation: {
        kind: "bot",
        id: "translate-bot",
        title: translateBot.displayName,
        bot: translateBot,
        unreadCount: 0,
        isPinned: false,
        isMuted: true,
      },
      messages: [
        { from: me, minutesAgo: 900, text: "Good morning, have a nice day!" },
        { from: translateBot, minutesAgo: 900, text: "🇬🇧 → 🇷🇺\nДоброе утро, хорошего дня!" },
        { from: me, minutesAgo: 895, text: "", voice: mockVoice(3_200, 5) },
        { from: translateBot, minutesAgo: 895, text: "Не удалось распознать речь. Попробуйте записать сообщение ещё раз." },
      ],
    },
  ];
}

/** Свои реакции поставлены вскоре после сообщения, с интервалом в секунду — в порядке myReactions */
function toReactions(counts: Record<string, number>, myReactions: string[] = [], createdAt: string): MessageReaction[] {
  return Object.entries(counts).map(([emoji, count]) => {
    const order = myReactions.indexOf(emoji);
    if (order === -1) return { emoji, count, isChosen: false };

    const chosenAt = new Date(Date.parse(createdAt) + (order + 1) * 1000).toISOString();
    return { emoji, count, isChosen: true, chosenAt };
  });
}

/** Время в моках считается относительно момента запроса, чтобы данные всегда выглядели свежими */
export function createMockDatabase(now = Date.now()): MockDatabase {
  const at = (minutesAgo: number) => new Date(now - minutesAgo * MINUTE_MS).toISOString();
  const seeds = createSeeds(at);
  const messages: Record<ConversationId, Message[]> = {};

  for (const { conversation, messages: messageSeeds } of seeds) {
    messages[conversation.id] = messageSeeds.map((seed, index): Message => {
      const id = `${conversation.id}-${index + 1}`;

      return {
        id,
        conversationId: conversation.id,
        author:
          seed.from === "channel"
            ? { id: conversation.id, displayName: conversation.title }
            : { id: seed.from.id, displayName: seed.from.displayName },
        text: seed.text,
        format: seed.format,
        createdAt: at(seed.minutesAgo),
        status: seed.status ?? "read",
        viewsCount: seed.views,
        attachments: seed.attachments?.map((attachment, position) => ({
          ...attachment,
          id: `${id}-a${position + 1}`,
        })),
        voice: seed.voice,
        reactions: seed.reactions && toReactions(seed.reactions, seed.myReactions, at(seed.minutesAgo)),
      };
    });
  }

  // Ответы и пересылки ссылаются на уже собранные сообщения — в том числе из других чатов
  for (const { conversation, messages: messageSeeds } of seeds) {
    const list = messages[conversation.id];

    messageSeeds.forEach((seed, index) => {
      if (seed.replyTo) {
        list[index] = { ...list[index], replyTo: createMessageReply(list[seed.replyTo - 1]) };
      }

      if (seed.forwardedFrom) {
        const { conversationId, number } = seed.forwardedFrom;
        const source = seeds.find((item) => item.conversation.id === conversationId);
        if (!source) throw new Error(`Моки: пересылка из неизвестного чата ${conversationId}`);
        list[index] = { ...list[index], ...createForwardedContent(messages[conversationId][number - 1], source.conversation) };
      }
    });
  }

  const conversations = seeds.map(
    ({ conversation }): Conversation => ({ ...conversation, lastMessage: messages[conversation.id].at(-1) ?? null }),
  );

  return { conversations, messages };
}
