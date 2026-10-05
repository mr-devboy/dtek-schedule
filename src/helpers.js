import fs from "node:fs"
import path from "node:path"
import { LAST_MESSAGE_FILE } from "./constants.js"

function addLeadingZero(str) {
  if (typeof str !== "string" && typeof str !== "number") return
  return String(str).padStart(2, "0")
}

export function createPeriod({ hour, startMin = 0, endMin = 0, power }) {
  const begin = `${addLeadingZero(hour)}:${addLeadingZero(startMin)}`
  const end =
    endMin === 0
      ? `${addLeadingZero(hour + 1)}:00`
      : `${addLeadingZero(hour)}:${addLeadingZero(endMin)}`

  return {
    begin,
    end,
    power,
  }
}

export function useSchedule(schedule) {
  const setSchedule = (period) => {
    const last = schedule.at(-1)
    if (last?.power === period.power) {
      last.end = period.end
    } else {
      schedule.push(period)
    }
  }

  return [schedule, setSchedule]
}

export function getCurrentTime() {
  const now = new Date()

  const date = now.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
  })

  const time = now.toLocaleTimeString("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${date} ${time}`
}

export function checkIsNight() {
  const hours = new Date().toLocaleString("en-US", {
    timeZone: "Europe/Kyiv",
    hour: "numeric",
    hour12: false,
  })
  return hours >= 0 && hours < 8
}

export function loadLastMessage() {
  if (!fs.existsSync(LAST_MESSAGE_FILE)) return null

  const lastMessage = JSON.parse(
    fs.readFileSync(LAST_MESSAGE_FILE, "utf8").trim()
  )

  if (lastMessage?.date) {
    const messageDay = new Date(lastMessage.date * 1000).toLocaleDateString(
      "en-CA",
      { timeZone: "Europe/Kyiv" }
    )
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Europe/Kyiv",
    })

    if (messageDay < today) {
      deleteLastMessage()
      return null
    }
  }

  return lastMessage
}

export function saveLastMessage({ date, message_id } = {}) {
  fs.mkdirSync(path.dirname(LAST_MESSAGE_FILE), { recursive: true })
  fs.writeFileSync(
    LAST_MESSAGE_FILE,
    JSON.stringify({
      message_id,
      date,
    })
  )
}

export function deleteLastMessage() {
  fs.rmdirSync(path.dirname(LAST_MESSAGE_FILE), { recursive: true })
}
