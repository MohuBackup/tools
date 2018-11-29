// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")

const { getAllQidsThen, flat, dedup } = require("./util")


const baseFilePath = "../archive.is/article"
const jsonFilePath = "../archive.is/avatars_from_archive_is.json"
const rawDataFilePath = "../archive.is/raw_avatars_data.json"


/** @typedef {import("./util").AvatarUrlObj} AvatarUrlObj */
/** @typedef {import("./util").UserObj} UserObj */

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

/**
 * 判断是否是默认头像
 * @param {string} avatar 
 */
const isDefaultAvatar = (avatar) => {
    return avatar.includes("/static/common/avatar-mid-img.png")
}

/**
 * 获取回答者的用户信息
 * @param {Document} _document 
 * @returns {UserObj[]}
 */
const getAnswerersUserObjs = (_document) => {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const imgAs = _document.querySelectorAll("a.aw-user-img")
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const userNameAs = _document.querySelectorAll("a.aw-user-name[data-id]")

    return [...imgAs].map((x) => {
        const userID = +x.dataset.id
        const userURL = x.href.split("/").pop()

        /** @type {HTMLImageElement} */
        const userIMG = x.children[0]
        const avatar = userIMG.src

        const userNameA = [...userNameAs].filter(y => {
            return y.dataset.id == `${userID}` && y.parentElement.classList.length == 0
        })[0]
        if (!userNameA) return

        const [userName, userDescription] = userNameA.parentElement.textContent.split(" - ").map(x => x.trim())

        return {
            "user-id": userID,
            "user-url": userURL,
            "user-name": userName,
            "user-description": userDescription || null,
            avatar: !isDefaultAvatar(avatar) ? avatar : null
        }
    }).filter(x => !!x)
}

/**
 * 获取提问者的用户信息
 * @param {Document} _document 
 * @returns {UserObj}
 */
const getQuestionerUserObj = (_document) => {
    const Q = _document.querySelector(".aw-mod > .mod-body > dl")
    if (!Q) return

    const avatar = Q.querySelector("img").src

    /** @type {HTMLAnchorElement} */
    const userNameA = Q.querySelector(".aw-user-name")
    const userURL = userNameA.href.split("/").pop()
    const userID = +userNameA.dataset.id
    const userName = userNameA.textContent

    const userDescriptionP = userNameA.nextElementSibling
    const userDescription = userDescriptionP ? userDescriptionP.textContent : null

    return {
        "user-id": userID,
        "user-url": userURL,
        "user-name": userName,
        "user-description": userDescription,
        avatar: !isDefaultAvatar(avatar) ? avatar : null
    }
}

/**
 * @param {number} qid 
 * @returns {Promise<UserObj[]>}
 */
const getUserObjsFromArchiveOrg = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    return getAnswerersUserObjs(document)
        .concat(getQuestionerUserObj(document))
        .filter(x => !!x)
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
