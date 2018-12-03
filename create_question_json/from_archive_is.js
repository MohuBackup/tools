// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../archive.is/${backupType}`
const outputPath = `../../json/${backupType}`

const usersJsonFilePath = "../../backups/users.json"
/** @type {import("./typedef").UserObj[]} */
const users = fs.readJsonSync(usersJsonFilePath)

const lostUsersJsonFilePath = "../../backups/lost-users.json"
const lostUsers = new Set()

const tagsJsonFilePath = "../../backups/tags.json"
/** @type {{ [tagName: string]: number; }[]} */
const allTags = fs.readJsonSync(tagsJsonFilePath)

/**
 * @param {Document} document 
 * @returns {(import("./typedef").Tag)[]}
 */
const getTagsData = (document) => {
    const tags = document.querySelectorAll("div.body > div > div > div > div > div > div > div > span > a[href]")

    return [...tags].map(x => {
        const tagName = x.textContent.trim()

        return {
            "tag-id": allTags[tagName],
            "tag-name": tagName
        }
    })
}

/**
 * 移除空白span节点
 * @param {Element} x 
 */
const removeBlankSpans = (x) => {
    if (x.outerHTML == "<span style=\"box-sizing: border-box; -moz-box-sizing: border-box; -ms-box-sizing: border-box; \"></span>") {
        x.remove()
    }

    [...x.children].forEach(y => removeBlankSpans(y))
}

/**
 * @param {Element} x 
 */
const removeUselessStyle = (x) => {
    const s = "text-align:left;box-sizing: border-box; -moz-box-sizing: border-box; -ms-box-sizing: border-box;"

    const oldStyle = x.getAttribute("style")
    if (oldStyle) {
        const newStyle = oldStyle.replace(s, "").trim()
        newStyle ? x.setAttribute("style", newStyle) : x.removeAttribute("style")
    }

    return [...x.children].forEach(y => removeUselessStyle(y))
}

/**
 * @param {Element} x 
 */
const replaceDivWithP = (x, document) => {
    const s = "text-align:left;box-sizing: border-box; -moz-box-sizing: border-box; -ms-box-sizing: border-box; margin: 0px 0px 10px; padding: 5px; "

    if (x.getAttribute("style") == s) {
        const p = document.createElement("p")
        p.innerHTML = x.innerHTML
        x.replaceWith(p)
    }

    x.querySelectorAll("div").forEach(y => replaceDivWithP(y, document))
}

/**
 * @param {Document} document 
 */
const getBaseDetail = (document) => {
    const titleE = document.querySelector("div.body > div > div > div > div > div > div > div > h1")
    const title = titleE.textContent.trim()

    /** @type {HTMLAnchorElement} */
    const authorE = document.querySelector("div.body dd > a")
    /** @type {import("./typedef").UserObjSimplified} */
    let author
    if (authorE) {
        const authorUserName = authorE.text
        const a = users.find(u => u["user-name"] == authorUserName)
        author = {
            "user-id": a["user-id"],
            "user-name": a["user-name"]
        }
    } else {
        author = null
    }

    const bodyE = document.querySelectorAll("div.body > div > div > div > div > div > div > div > div")[0]
    removeBlankSpans(bodyE)
    replaceDivWithP(bodyE, document)
    removeUselessStyle(bodyE)

    const body = bodyE.innerHTML.trim()

    /** @type {HTMLAnchorElement} */
    const linkE = document.querySelector("div.body > div > div > div > div > div > div > div > div > div > ul a")
    const link = linkE && linkE.href

    return {
        title,
        body,
        author,
        link,
    }
}


/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    console.log(getBaseDetail(document))
}

(async () => {
    handler(1883)
})()
