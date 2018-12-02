// @ts-check
const fs = require("fs-extra")
const path = require("path")
const moment = require("moment-timezone")


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
 * @param {number} qid 
 * @returns {Promise<void>}
 */
const absolutizeTime = async (qid) => {
    const f = `${baseFilePath}/${qid}.html`
    const html = await fs.readFile(f, "utf-8")

    /**
     * @param {string} match 
     * @param {string} n 
     * @param { "天" | "小时" } unit_zh 
     */
    const replacer = (match, n, unit_zh) => {
        const unit = unit_zh == "天" ? "days" : "hours"  // 翻译时间单位

        const archiveTime = archiveTimeData[qid]

        const absTime = moment(archiveTime).subtract((+n), unit)

        const formatted = absTime.tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm")

        return match.replace(/>.+?</, `>${formatted}<`)
    }

    const output = html.replace(r1, replacer)

    fs.writeFile(f, output)

}

absolutizeTime(4097)
