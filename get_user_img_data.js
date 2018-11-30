// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen, flat } = require("./util")

const backupTypes = ["article", "question"]
const jsonFilePath = "../backups/uploads.json"

/** @typedef {{ src: string; alt: string; title: string; }} UserUploadsItem */

/**
 * @param {string} baseFilePath 
 * @param {number} qid 
 * @returns {Promise<UserUploadsItem[]>}
 */
const handler = async (baseFilePath, qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    /** @type {NodeListOf<HTMLImageElement>} */
    const imgs = document.querySelectorAll("img[title]")

    if (imgs.length == 0) return

    console.log(imgs.length)

    return [...imgs].map((img) => {
        const { src, alt, title } = img

        return {
            src,
            alt,
            title
        }
    })
}

/** @type {UserUploadsItem[]} */
let allImgs = []

backupTypes.forEach(async (backupType) => {
    const baseFilePath = `../backups/${backupType}/`

    const cb = (qid) => handler(baseFilePath, qid)

    const imgs = await Promise.all(
        getAllQidsThen(baseFilePath, cb)
    )

    allImgs.push(...flat(imgs))

    const output = allImgs.sort((a, b) => {
        if (a.src < b.src) {
            return -1
        } else if (a.src > b.src) {
            return 1
        } else {
            return 0
        }
    }).filter((x) => {
        return !!x && !x.src.startsWith("/ueditor/") && !x.src.startsWith("/static/")
    })

    await fs.writeJSON(jsonFilePath, output, { spaces: 4 })

})
