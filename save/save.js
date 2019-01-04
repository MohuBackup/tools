// @ts-check
const fs = require("fs-extra")
const { fetch, getProxyAgent, readArrayFromJSON } = require("../util")

const agent = getProxyAgent()
const apiURL = "https://web.archive.org/save/https://2049bbs.xyz/t/"
const jsonFilePath = "./data.json"

/**
 * 生成一个数列
 * @param {number} start (含)
 * @param {number} end (含)
 */
const range = (start, end) => {
    return new Array(end - start + 1).fill(null).map((_, index) => index + start)
}

/**
 * @typedef {{ url: string; code: number; archiveTime?: string; length?: number; }} ArchivedItem 
 * @param {number} id 
 * @returns {Promise<ArchivedItem>}
 */
const save = async (id) => {
    const url = apiURL + id

    try {
        const r = await fetch(url, {
            timeout: 10000,
            agent
        })
        if (r.ok) {

            const text = await r.text()

            /** 存档时间 (UTC) */
            const archiveTime = text.match(/FILE ARCHIVED ON (.+)? AND RETRIEVED FROM /)[1]
            const length = text.length

            console.log(url)
            console.log(archiveTime)
            console.log(length)

            return {
                url,
                code: r.status,
                archiveTime,
                length
            }

        } else {
            console.error(url + " " + r.status)

            return {
                url,
                code: r.status,
            }
        }
    } catch (e) {
        console.error(url + " " + e)

        return {
            url,
            code: 500,
        }
    }

}

const saveAll = async () => {

    /** @type {ArchivedItem[]} */
    const savedData = await readArrayFromJSON(jsonFilePath)

    const start = 1
    const end = 882
    const n = 20

    // 绕过网站的并发限制
    for (let i = start; i <= end; i = i + n) {

        const idList = range(i, Math.min(i + n - 1, end))

        const data = await Promise.all(
            idList.map((id) => {
                return save(id)
            })
        )

        savedData.push(...data)

        await fs.writeJSON(jsonFilePath, savedData, { spaces: 4 })

    }

}


saveAll()
