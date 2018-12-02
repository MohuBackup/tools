// @ts-check
const fs = require("fs-extra")
const path = require("path")


const baseFilePath = "../backups/question"

const r0 = />(\d+) (天|小时)前</g
const r1 = new RegExp(`最新活动: <span class="aw-text-color-blue"${r0.source}`, "g")


/**
 * @typedef {{ [qid: number] : Date }} ArchiveTimeData
 * @returns {ArchiveTimeData}
 */
const getArchiveTimeData = () => {
    const resDataFilePath = path.join(baseFilePath, "resData.json")

    let resData = fs.readJSONSync(resDataFilePath)

    /** @type {ArchiveTimeData} */
    const data = {}
    resData.forEach(x => {
        data[x.id] = new Date(x.archiveTime)
    })

    return data
}

const archiveTimeData = getArchiveTimeData()

/**
 * 暴力格式化时间 
 * @param {Date} t 
 */
const formatTime = (t) => {

    // const timeZoneOffset = (-new Date().getTimezoneOffset()) * 60 * 1000
    const timeZoneOffset = 8 * 60 * 60 * 1000  // UTC+08:00

    const d = new Date(t.getTime() + timeZoneOffset).toISOString()

    return d.match(/\d{4}(-\d{2}){2}/)[0] + " " + d.match(/\d{2}:\d{2}/)[0]
}

/**
 * @param {number} qid 
 * @returns {Promise<void>}
 */
const absolutizeTime = async (qid) => {
    const f = `${baseFilePath}/${qid}.html`
    const html = await fs.readFile(f, "utf-8")

    /**
     * @param {string} match 
     * @param {string} n 
     * @param {string} unit 
     */
    const replacer = (match, n, unit) => {
        const archiveTime = archiveTimeData[qid]

        const ms = unit == "天"
            ? 24 * 60 * 60 * 1000  // 一天的毫秒数
            : 60 * 60 * 1000  // 一小时的毫秒数

        const absTime = new Date(archiveTime.getTime() - (+n) * ms)

        return match.replace(/>.+?</, `>${formatTime(absTime)}<`)
    }

    const output = html.replace(r1, replacer)

    fs.writeFile(f, output)

}

absolutizeTime(4097)
