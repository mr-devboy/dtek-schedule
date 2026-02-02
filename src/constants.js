import path from "node:path"

export const shutdownsPages = {
  k: "https://www.dtek-kem.com.ua/ua/shutdowns",
  kr: "https://www.dtek-krem.com.ua/ua/shutdowns",
  dn: "https://www.dtek-dnem.com.ua/ua/shutdowns",
  o: "https://www.dtek-oem.com.ua/ua/shutdowns",
  d: "https://www.dtek-dem.com.ua/ua/shutdowns",
}
export const SHUTDOWNS_PAGE =
  shutdownsPages[String(process.env.REGION).toLocaleLowerCase()] ??
  shutdownsPages["kr"]
export const SHUTDOWNS_DATA_MATCHER = /fact\s*=\s*(\{.*\})/s

const GROUP_PREFIX = "GPV"
export const GROUP = `${GROUP_PREFIX}${process.env.GROUP}`

export const PowerState = Object.freeze({
  ON: "yes",
  OFF: "no",
  HALF_ON: "second",
  HALF_OFF: "first",
})

export const hours = Array.from({ length: 24 }).map((_, i) => i)

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export const LAST_MESSAGE_FILE = path.resolve("artifacts", `last-message.json`)

export const RETRIES_MAX_COUNT = 5
export const RETRIES_TIMEOUT = 5000
