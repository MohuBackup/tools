// @ts-check
const fs = require("fs-extra")
const path = require("path")
const { JSDOM } = require("jsdom")
const { fetch, getProxyAgent } = require("../util")

const baseURL = "http://webcache.googleusercontent.com/search?vwsrc=1&q=cache:"
const baseFilePath = "../../backups/question/"
const agent = getProxyAgent()

/**
 * @typedef {{ qid: number; title: string; link: string; cacheId: string; }} Page
 */

/**
 * @param {Page} page 
 */
const download = async (page) => {
    const saveTo = `${page.qid}.html`
    const url = baseURL + page.cacheId + ":" + page.link

    try {
        const r = await fetch(url, {
            timeout: 10000,
            agent
        })
        if (r.ok) {
            const filePath = path.resolve(
                path.join(baseFilePath, saveTo)
            )

            fs.ensureDirSync(path.parse(filePath).dir)

            const html = await r.textConverted()
            const { window: { document } } = new JSDOM(html)

            const pageHTML = document.body.querySelector("div > pre").textContent
            await fs.writeFile(filePath, pageHTML)

            return
        } else {
            console.error(saveTo + " " + r.status)
            return
        }
    } catch (e) {
        return console.error(saveTo + " " + e)
    }

}

const downloadAll = async () => {

    /** @type {Page[]} */
    const cachedLostPages = await fs.readJSON("./cached_lost_pages.json")

    await Promise.all(
        cachedLostPages.map((page) => {
            return download(page)
        })
    )

}


downloadAll()
