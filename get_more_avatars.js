// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")

const { getAllQidsThen, flat, dedup } = require("./util")


const baseFilePath = "../archive.is/article"
const jsonFilePath = "../archive.is/avatars_from_archive_is.json"
const rawDataFilePath = "../archive.is/raw_avatars_data.json"


/** @typedef {import("./util").AvatarUrlObj} AvatarUrlObj */
/**
 * @param {number} qid
 * @returns {Promise<AvatarUrlObj[]>}
 */
const getAvatarUrlObjs = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document }, window: top, window } = new JSDOM(html)  // eslint-disable-line no-unused-vars

    /** @type {NodeListOf<HTMLAnchorElement>} */
    const _anchors = document.querySelectorAll(".body a[href]")

    const anchors = [..._anchors].filter(x => {
        return x.href.includes("https://www.mohu.club/people/")
    })

    return anchors.filter(x => {
        const imgElement = x.children[1]
        return imgElement.tagName == "IMG"

    }).map(x => {
        /** @type {HTMLImageElement} */
        const imgElement = x.children[1]

        const href = x.href

        const UserNameElements = anchors.filter(y => {
            return y.href == href && y.textContent
        })

        return {
            "user-url": href.split("/").pop(),
            "user-name": imgElement.alt || UserNameElements[0] && UserNameElements[0].textContent,
            avatar: imgElement.src.includes("https://") ? imgElement.src : null,
        }
    })
}

const resolveRawData = async () => {
    const rawData = await fs.readJSON(rawDataFilePath)

    const output = dedup(
        flat(rawData)
    )

    fs.writeJSON(jsonFilePath, output, { spaces: 4 })
}


const main = async () => {

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
        // getAllQidsThen(baseFilePath, getAvatarUrlObjsFromArchiveOrg)
    )

    const rawData = await fs.readJSON(rawDataFilePath)
    await fs.writeJSON(rawDataFilePath, rawData.concat(all), { spaces: 4 })

    const output = dedup(
        saved.concat(
            flat(all)
        )
    )

    console.log(output.length + " items found")

    await fs.writeJSON(jsonFilePath, output, { spaces: 4 })

}

// main()
