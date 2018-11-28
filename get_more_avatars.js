
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("./util")


const baseFilePath = "../archive.is/article"
const jsonFilePath = "../archive.is/avatars_from_archive_is.json"


/**
 * @typedef {{"user-url": string; "user-name": string; avatar: string;}} AvatarUrlObj
 */

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

/**
 * 数组去重 (不能用Set因为Set无法去重Object)
 * @param {AvatarUrlObj[]} oldAll 
 * @returns {AvatarUrlObj[]}
 */
const dedup = (oldAll) => {
    return oldAll.sort((a, b) => {
        const userA = a["user-url"]
        const userB = b["user-url"]
        if (userA < userB) {
            return -1
        }
        if (userA > userB) {
            return 1
        }
        return 0
    }).reduce((newAll, c) => {
        const l = newAll.slice(-1)
        if (l.length > 0) {
            if (c["user-url"] && l[0]["user-url"] == c["user-url"]) {
                return newAll
            }
        }
        return newAll.concat(c)
    }, [])
}

/**
 * 扁平化数组  
 * (深度为1的 `Array.prototype.flat` 的简单实现)
 * @param {any[][]} array 
 */
const flat = (array) => {
    return array.reduce((a, x) => {
        return a.concat(x)
    }, [])
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
