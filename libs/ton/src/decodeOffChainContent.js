/**
 * Модуль для декодирования змеевидных ячеек с контентом.
 *
 * Змеевидная структура ячеек используется в TON для хранения
 * контента, который может быть большим и не помещаться в
 * одну ячейку. Внутри ячеек содержится последовательность
 * ячеек, каждая из которых может содержать часть контента.
 * Каждая из таких ячеек имеет общий префикс, который позволяет
 * определить, что это змеевидная ячейка.
 *
 * Этот модуль предоставляет функцию {@link decodeOffChainContent}, которая
 * принимает корневую ячейку такого контента и возвращает единый буфер,
 * содержащий все данные всех ячеек.
 *
 * @typedef {import("@ton/ton").Cell} Cell
 */

import { bitsToPaddedBuffer } from "@ton/core/dist/boc/utils/paddedBits"
import { OFFCHAIN_CONTENT_PREFIX } from "./const"

/** Преобразует змеевидную структуру ячеек в единый буфер.
 * @param {Cell} cell - Корневая ячейка змеевидной структуры.
 * @returns {Buffer} Буфер, содержащий данные всех ячеек.
 */
const flattenSnakeCell = (cell) => {
  let /** @type {Cell | null} */ c = cell // Начинаем с первой ячейки.
  let res = Buffer.alloc(0) // Инициализация результирующего буфера.
  while (c) {
    // Обходим все ячейки.
    let cs = c.beginParse() // Начинаем парсинг текущей ячейки.
    // Загружаем данные и преобразуем их в буфер.
    let data = bitsToPaddedBuffer(cs.loadBits(cs.remainingBits))
    // Конкатенируем данные текущей ячейки с предыдущими.
    res = Buffer.concat([res, data])
    c = c.refs[0] // Переходим к следующей ячейке в цепочке.
  }
  return res
}

/** Декодирует off-chain содержимое из ячейки.
 * @param {Cell} content - Корневая ячейка, содержащая off-chain данные.
 * @returns {string} Строковое представление данных, исключая префикс.
 */
export const decodeOffChainContent = (content) => {
  let data = flattenSnakeCell(content) // Формируем буфер из змеевидной структуры.
  let prefix = data[0] // Извлекаем префикс из данных. // Проверяем соответствие префикса ожидаемому значению.
  if (prefix !== OFFCHAIN_CONTENT_PREFIX) {
    // В случае несоответствия выбрасываем исключение.
    throw new Error(`Unknown content prefix: ${prefix.toString(16)}`)
  } // Возвращаем декодированное содержимое в виде строки, используя метод subarray.
  return Buffer.from(data).subarray(1).toString()
}
