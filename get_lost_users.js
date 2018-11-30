// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")

const { getAllQidsThen, readArrayFromJSON, flat, dedup, sortUserObjArray } = require("./util")

const baseFilePath = "../backups/question"
const jsonFilePath = "../backups/users.json"


/** @typedef {import("./util").UserObj} UserObj */


/**
 * 获取赞同者的用户信息
 * @param {Document} _document 
 * @returns {UserObj[]}
 */
const getVotersUserObjs = (_document) => {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const userNameAs = _document.querySelectorAll("a.aw-user-name[data-id]")

    return [...userNameAs].map((x) => {
        const userID = +x.dataset.id
        const userURL = x.href.split("/").pop()
        const userName = x.textContent

        return {
            "user-id": userID,
            "user-url": userURL,
            "user-name": userName,
            "user-description": null,
            avatar: null
        }
    })
}


/**
 * @param {number} qid 
 * @returns {Promise<UserObj[]>}
 */
const getLostUserObjs = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)
    return getVotersUserObjs(document)
}


(async () => {

    /** @type {UserObj[]}*/
    const saved = await readArrayFromJSON(jsonFilePath)

    const savedUserIds = saved.map(x => {
        return x["user-id"]
    })


    const all = await Promise.all(
        getAllQidsThen(baseFilePath, getLostUserObjs)
    )

    const lostUsers = flat(all).filter(x => {
        return !savedUserIds.includes(x["user-id"])
    })

    const output = sortUserObjArray(
        saved.concat(dedup(lostUsers))
    )

    console.log(output.length + " items found")

    await fs.writeJSON(jsonFilePath, output, { spaces: 4 })


})()


