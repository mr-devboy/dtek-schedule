import { chromium } from "playwright"

import {
  checkIsNight,
  createPeriod,
  getCurrentTime,
  loadLastMessage,
  saveLastMessage,
  deleteLastMessage,
  useSchedule,
} from "./helpers.js"
import {
  GROUP,
  hours,
  PowerState,
  SHUTDOWNS_DATA_MATCHER,
  SHUTDOWNS_PAGE,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  RETRIES_TIMEOUT,
  RETRIES_MAX_COUNT,
} from "./constants.js"

let sendNotificationRetries = 0
let getShutdownsDataRetries = 0

const getShutdownsData = async () => {
  console.log("🌀 Getting shutdowns data...")

  const browser = await chromium.launch({ headless: true })
  const browserPage = await browser.newPage()

  try {
    await browserPage.goto(SHUTDOWNS_PAGE, {
      waitUntil: "load",
    })

    const html = await browserPage.content()
    const match = html.match(SHUTDOWNS_DATA_MATCHER)

    if (!match) {
      throw new Error("not found")
    }

    const data = JSON.parse(match[1])
    console.log("✅ Getting shutdowns data finished.")
    return data
  } catch (error) {
    console.error(`❌ Getting shutdowns data failed: ${error.message}.`)

    if (getShutdownsDataRetries < RETRIES_MAX_COUNT) {
      console.log("🌀 Try getting shutdowns data again...")
      await new Promise((resolve) => setTimeout(resolve, RETRIES_TIMEOUT))
      getShutdownsDataRetries++
      return await getShutdownsData()
    }

    throw Error(
      `❌ Getting shutdowns data failed after ${RETRIES_MAX_COUNT} retries.`
    )
  } finally {
    await browser.close()
  }
}

function generateSchedule({ data, today }) {
  console.log("🌀 Generating schedule...")

  try {
    const hoursStates = data[today][GROUP]
    if (!hoursStates) throw Error(`group ${GROUP} not found`)
    const [schedule, setSchedule] = useSchedule([])

    hours.forEach((hour) => {
      const state = hoursStates[hour + 1]

      switch (state) {
        case PowerState.ON:
          setSchedule(createPeriod({ hour, power: true }))
          break

        case PowerState.OFF:
          setSchedule(createPeriod({ hour, power: false }))
          break

        case PowerState.HALF_ON:
          setSchedule(createPeriod({ hour, endMin: 30, power: true }))
          setSchedule(createPeriod({ hour, startMin: 30, power: false }))
          break

        case PowerState.HALF_OFF:
          setSchedule(createPeriod({ hour, endMin: 30, power: false }))
          setSchedule(createPeriod({ hour, startMin: 30, power: true }))
          break
      }
    })

    console.log("✅ Generating schedule finished.")

    return schedule
  } catch (error) {
    throw Error(`❌ Generating schedule failed: ${error.message}.`)
  }
}

function generateMessage(schedule = [], update) {
  console.log("🌀 Generating message...")

  const isShutdownsExists = schedule.some(({ power }) => !power)
  isShutdownsExists
    ? console.log("🪫 Power shutdowns detected!")
    : console.log("🔋 No power shutdowns!")

  const info = [
    ...(isShutdownsExists
      ? schedule
          .filter(({ power }) => !power)
          .map(({ begin, end }) => `🪫 <code>${begin} — ${end}\</code>`)
      : schedule.map(({ begin, end }) => `🔋 <code>${begin} — ${end}\</code>`)),
  ].join("\n")

  return [
    `⚡️ <b>Графік відключень на сьогодні:</b>`,
    info,
    "\n",
    `🔄 <i>${update}</i>`,
    `💬 <i>${getCurrentTime()}</i>`,
  ].join("\n")
}

async function sendNotification(message) {
  if (!TELEGRAM_BOT_TOKEN)
    throw Error("❌ Missing telegram bot token or chat id.")
  if (!TELEGRAM_CHAT_ID) throw Error("❌ Missing telegram chat id.")

  console.log("🌀 Sending notification...")

  const lastMessage = loadLastMessage() || {}

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${
        lastMessage.message_id ? "editMessageText" : "sendMessage"
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
          silent: checkIsNight(),
          message_id: lastMessage.message_id ?? undefined,
        }),
      }
    )

    const data = await response.json()
    saveLastMessage(data.result)

    console.log("🟢 Notification sent.")
  } catch (error) {
    console.log("🔴 Notification not sent.", error.message)
    deleteLastMessage()

    if (sendNotificationRetries < RETRIES_MAX_COUNT) {
      console.log("🌀 Try sending notification again...")
      setTimeout(() => {
        sendNotificationRetries++
        sendNotification(info)
      }, RETRIES_TIMEOUT)
    }
  }
}

async function run() {
  const data = await getShutdownsData()

  const groups = data.data?.[data.today] ?? {}
  if (!Object.keys(groups).length) {
    console.log("🔋 No schedule for today.")
    return
  }

  const schedule = generateSchedule(data)
  const scheduleMessage = generateMessage(schedule, data.update)

  sendNotification(scheduleMessage)
}

run().catch((error) => console.error(error.message))
