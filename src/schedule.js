import { chromium } from "playwright"

import {
  checkIsNight,
  createPeriod,
  getCurrentTime,
  getNextDay,
  loadLastMessage,
  saveLastMessage,
  deleteLastMessage,
  useSchedule,
} from "./helpers.js"
import {
  DayTitle,
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

const getShutdownsData = async ({ attempt = 0 } = {}) => {
  console.log("🌀 Getting shutdowns data...")

  const browser = await chromium.launch({ headless: true })

  try {
    const browserPage = await browser.newPage()
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
  } finally {
    await browser.close()
  }

  if (attempt < RETRIES_MAX_COUNT) {
    console.log("🌀 Try getting shutdowns data again...")
    await new Promise((resolve) => setTimeout(resolve, RETRIES_TIMEOUT))
    return await getShutdownsData({ attempt: attempt + 1 })
  }

  throw Error(
    `❌ Getting shutdowns data failed after ${RETRIES_MAX_COUNT} retries.`
  )
}

function generateSchedule({ data }) {
  if (!data) return null

  console.log("🌀 Generating schedule...")

  try {
    const [schedule, setSchedule] = useSchedule([])

    hours.forEach((hour) => {
      const state = data[hour + 1]

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

function generateScheduleText({ title, schedule }) {
  if (!schedule) return null

  const isShutdownsExists = schedule.some(({ power }) => !power)
  isShutdownsExists
    ? console.log(`🪫 Power shutdowns detected: ${title}.`)
    : console.log(`🔋 No power shutdowns: ${title}.`)

  const periods = isShutdownsExists
    ? schedule
        .filter(({ power }) => !power)
        .map(({ begin, end }) => `🪫 <code>${begin} — ${end}</code>`)
    : schedule.map(({ begin, end }) => `🔋 <code>${begin} — ${end}</code>`)

  return [`<b>${title}:</b>`, ...periods].join("\n")
}

function generateMessage({ sections, updatedAt }) {
  console.log("🌀 Generating message...")

  const body = sections.filter(Boolean).join("\n\n")

  const footer = [
    `📢 <i>${updatedAt}</i>`,
    `🤖 <i>${getCurrentTime()}</i>`,
  ].join("\n")

  return { body, footer }
}

async function sendNotification({ body, footer, attempt = 0 }) {
  if (!TELEGRAM_BOT_TOKEN) throw Error("❌ Missing telegram bot token.")
  if (!TELEGRAM_CHAT_ID) throw Error("❌ Missing telegram chat id.")

  console.log("🌀 Sending notification...")

  const text = [body, footer].join("\n\n")

  const lastMessage = loadLastMessage() || {}
  const isBodyChanged = lastMessage.body !== body
  const isEdit = Boolean(lastMessage.message_id) && !isBodyChanged
  const isReply = Boolean(lastMessage.message_id) && isBodyChanged

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${
        isEdit ? "editMessageText" : "sendMessage"
      }`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
          disable_notification: checkIsNight(),
          message_id: isEdit ? lastMessage.message_id : undefined,
          reply_parameters: isReply
            ? {
                message_id: lastMessage.message_id,
                allow_sending_without_reply: true,
              }
            : undefined,
        }),
      }
    )

    const data = await response.json()

    if (data.description?.includes("not modified")) {
      console.log("🟡 Notification not changed.")
      return
    }
    if (!data.ok) {
      deleteLastMessage()
      throw Error(data.description)
    }

    saveLastMessage({ ...data.result, body })

    console.log("🟢 Notification sent.")
  } catch (error) {
    console.error(`❌ Sending notification failed: ${error.message}.`)

    if (attempt < RETRIES_MAX_COUNT) {
      console.log("🌀 Try sending notification again...")
      await new Promise((resolve) => setTimeout(resolve, RETRIES_TIMEOUT))
      return await sendNotification({
        body,
        footer,
        attempt: attempt + 1,
      })
    }

    throw Error(
      `❌ Sending notification failed after ${RETRIES_MAX_COUNT} retries.`
    )
  }
}

async function run() {
  const data = await getShutdownsData()

  const { today } = data
  const tomorrow = getNextDay({ data, day: today })

  const todayData = data.data?.[today]?.[GROUP]
  const tomorrowData = data.data?.[tomorrow]?.[GROUP]

  const todaySchedule = generateSchedule({ data: todayData })
  const tomorrowSchedule = generateSchedule({ data: tomorrowData })

  if (!todaySchedule && !tomorrowSchedule) {
    console.log("🔋 No schedule.")
    return
  }

  const todayText = generateScheduleText({
    title: DayTitle.TODAY,
    schedule: todaySchedule,
  })
  const tomorrowText = generateScheduleText({
    title: DayTitle.TOMORROW,
    schedule: tomorrowSchedule,
  })

  const message = generateMessage({
    sections: [todayText, tomorrowText],
    updatedAt: data.update,
  })

  await sendNotification(message)
}

run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
