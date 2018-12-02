// @ts-check
const fs = require("fs-extra")
const path = require("path")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("./util")


const baseFilePath = "../archive.is/question"

/** @typedef {import("./util").resDataItem} resDataItem */

/**
 * @param {number} qid 
 * @returns {Promise<resDataItem>}
 */
const handler = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    /** @type {HTMLLinkElement} */
    const urlL = document.querySelector("link[rel=bookmark]")
    const url = urlL.href
    const rawURL = "https" + url.split(/http(s)?/).pop()

    /** @type {HTMLMetaElement} */
    const archiveTimeElement = document.querySelector("meta[itemprop='dateModified']")
    const archiveTime = archiveTimeElement.content

    return {
        id: qid,
        url,
        rawURL,
        archiveTime
    }
}



(async () => {

    const all = await Promise.all(
        getAllQidsThen(baseFilePath, handler)
    )


    await fs.writeJSON(
        path.join(baseFilePath, "resData.json"),
        all,
        { spaces: 4 }
    )


})()
