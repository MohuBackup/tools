
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")

const util = require("./util")
const { getAllQidsThen, flat, dedup } = util


const baseFilePath = "../archive.is/article"
const jsonFilePath = "../archive.is/avatars_from_archive_is.json"


/** @typedef {util.AvatarUrlObj} AvatarUrlObj */
/**
 * @param {number} qid
 * @returns {AvatarUrlObj[]}
 */
const getAvatarUrlObjs = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document }, window: top, window } = new JSDOM(html)  // eslint-disable-line no-unused-vars

    const anchors = [...document.querySelectorAll(".body a[href]")].filter(x => {
        return x.href.includes("https://www.mohu.club/people/")
    })

    return anchors.filter(x => {
        const imgElement = x.children[1]
        return imgElement.tagName == "IMG" && imgElement.src.includes("https://")

    }).map(x => {
        const imgElement = x.children[1]

        const href = x.href

        const UserNameElements = anchors.filter(y => {
            return y.href == href && y.textContent
        })

        return {
            "user-url": href.split("/").pop(),
            "user-name": imgElement.alt || UserNameElements[0] && UserNameElements[0].textContent,
            avatar: imgElement.src,
        }
    })
}


const main = (async () => {

    /**
     * 已保存的数据
     * @type {AvatarUrlObj[]}
     */
    let saved
    try {
        saved = await fs.readJSON(jsonFilePath) || []
    } catch (e) {
        saved = []
    }

    const all = await Promise.all(
        getAllQidsThen(baseFilePath, getAvatarUrlObjs)
    )

    const output = dedup(
        saved.concat(
            flat(all)
        )
    )

    console.log(output.length + " items found")

    await fs.writeJSON(jsonFilePath, output, { spaces: 4 })

})

main()
