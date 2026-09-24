import { REACTION_PALETTE } from "../config/reactions";

/*
 * Прогрев шрифта эмодзи.
 *
 * Первый показ палитры реакций упирается не в React, а в шрифт: браузер впервые раскладывает
 * цветные эмодзи и подтягивает их глифы. На это уходит около 100 мс даже на десктопе, а на
 * телефоне — заметно больше, и меню открывается с ощутимой задержкой. Со второго раза глифы
 * лежат в кеше шрифта, и та же раскладка занимает доли миллисекунды.
 *
 * Поэтому раскладываем палитру заранее — пока пользователь читает чат: невидимым блоком за краем
 * экрана, порциями в простое. К моменту, когда он дотянется до меню, кеш уже прогрет.
 */

/**
 * Сколько эмодзи раскладываем за один заход. Первая раскладка эмодзи стоит несколько миллисекунд
 * на десктопе и в разы больше на телефоне, поэтому порция маленькая: она укладывается в кадр
 * даже там, где браузер запустит её не в простое, а по истечении таймаута
 */
const CHUNK_SIZE = 2;
/** Дольше этого порцию не откладываем: на занятой странице простоя может не случиться вовсе, мс */
const IDLE_TIMEOUT_MS = 500;
/** Интервал там, где нет requestIdleCallback (Safari до 18), мс */
const FALLBACK_DELAY_MS = 100;

/** Сколько эмодзи палитры уже прогрето: прерванный прогрев продолжится со следующего чата */
let warmedCount = 0;
let isWarming = false;

/**
 * Разложить палитру реакций в фоне. Возвращает функцию остановки — вызовите её при размонтировании.
 * Повторные вызовы и уже прогретая палитра ничего не стоят
 */
export function warmEmojiFont(): () => void {
  if (isWarming || warmedCount >= REACTION_PALETTE.length) return () => {};
  isWarming = true;

  const host = document.createElement("div");
  host.ariaHidden = "true";
  // Элемент нужен только для раскладки текста: за краем экрана он ничего не рисует и ни на что не влияет
  host.style.cssText =
    "position:fixed;top:0;left:-9999px;pointer-events:none;font-family:var(--font-emoji);font-size:20px";

  /** requestIdleCallback есть не везде (Safari до 18) — там же работаем по таймеру */
  const idle = typeof window.requestIdleCallback === "function";
  let timerId = 0;

  function step() {
    const chunk = REACTION_PALETTE.slice(warmedCount, warmedCount + CHUNK_SIZE);
    host.textContent = chunk.map((item) => item.emoji).join("");
    // Чтение размеров заставляет разложить текст прямо сейчас: без него кадр без отрисовки
    // выбросил бы работу, ради которой всё и затевалось
    void host.getBoundingClientRect().width;
    warmedCount += chunk.length;

    if (warmedCount < REACTION_PALETTE.length) schedule();
    else stop();
  }

  function schedule() {
    timerId = idle
      ? window.requestIdleCallback(step, { timeout: IDLE_TIMEOUT_MS })
      : window.setTimeout(step, FALLBACK_DELAY_MS);
  }

  function stop() {
    if (idle) window.cancelIdleCallback(timerId);
    else window.clearTimeout(timerId);
    host.remove();
    isWarming = false;
  }

  document.body.append(host);
  schedule();

  return stop;
}
