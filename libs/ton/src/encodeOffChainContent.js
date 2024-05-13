/**
 * Модуль для кодирования контента в змеевидные ячейки.
 *
 * В TON блокчейне используется змеевидная структура ячеек для эффективного хранения
 * и передачи больших объемов данных. Эти данные могут включать текстовые строки,
 * медиа-файлы и другие типы контента, которые необходимо хранить в блокчейне.
 * Змеевидная структура обеспечивает возможность разбиения больших объемов информации
 * на меньшие части и распределение их по разным ячейкам.
 *
 * Префикс offChain используется для обозначения контента, который хранится
 * за пределами блокчейна и может быть доступен через внешние ссылки. Это
 * позволяет уменьшить размер данных, хранящихся непосредственно в блокчейне,
 * сохраняя при этом ссылку на полный объем информации.
 *
 * Данная функция {@link encodeOffChainContent} принимает контент в виде строки
 * и преобразует его в серию змеевидных ячеек с использованием определенного префикса
 * для обозначения off-chain данных. Результатом является корневая ячейка,
 * готовая к использованию в блокчейне TON.
 *
 * @typedef {import("@ton/ton").Cell} Cell
 */
import { beginCell } from "@ton/core"
import { OFFCHAIN_CONTENT_PREFIX } from "./const"

/** Делит буфер на массив буферов фиксированного размера.
 * @param {Buffer} buff - Буфер, который нужно разделить.
 * @param {number} chunkSize - Размер каждого кусочка буфера (в байтах).
 * @returns {Buffer[]} Массив буферов заданного размера.
 */
const bufferToChunks = (buff, chunkSize) => {
  const /** @type {Buffer[]} */ chunks = []
  while (buff.byteLength > 0) {
    chunks.push(buff.subarray(0, chunkSize)) // ...добавляем кусок буфера в массив.
    buff = buff.subarray(chunkSize) // Удаляем добавленный кусок из начального буфера.
  }
  return chunks
}

/** Создает цепочку ячеек связанных списком (snake cell) для хранения больших объемов данных.
 * @param {Buffer} data - Данные, которые нужно закодировать в ячейки.
 * @returns {Cell} Корневая ячейка содержащая все данные.
 */
const makeSnakeCell = (data) => {
  const chunks = bufferToChunks(data, 127) // Делят данные на куски по 127 байт.
  if (chunks.length === 0) return beginCell().endCell() // Если данных нет, возвращаем пустую ячейку.
  if (chunks.length === 1) return beginCell().storeBuffer(chunks[0]).endCell() // Если всего один кусок, храним его в одной ячейке.

  let curCell = beginCell() // Если кусков несколько, начинаем цепочку ячеек.
  // Обрабатываем каждый кусок данных, начиная с последнего.
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i] // Берем кусок данных.
    curCell.storeBuffer(chunk) // Кладем его в текущую ячейку.
    // Если это не последний кусок данных...
    if (i - 1 >= 0) {
      const nextCell = beginCell() // ...создаем новую ячейку.
      nextCell.storeRef(curCell) // Сохраняем в новой ячейке ссылку на текущую.
      curCell = nextCell // Текущей становится новая ячейка.
    }
  }
  return curCell.endCell()
}
/** Преобразует строку в off-chain контент через snake cell.
 * @param {string} content - Строка, которую необходимо закодировать.
 * @returns {Cell} Возвращает корневую ячейку, содержащую закодированный контент.
 */
export const encodeOffChainContent = (content) => {
  let data = Buffer.from(content) // Преобразуем строку в буфер.
  const offChainPrefix = Buffer.from([OFFCHAIN_CONTENT_PREFIX]) // Создаем префикс для off-chain данных.
  data = Buffer.concat([offChainPrefix, data]) // Конкатенируем префикс с данными.
  return makeSnakeCell(data) // Создаем snake cell из полученного буфера.
}
