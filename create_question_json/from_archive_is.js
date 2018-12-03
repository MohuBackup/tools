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

const lostUsersJsonFilePath = "../../archive.is/lost-users.json"
const lostUsers = new Set()

const tagsJsonFilePath = "../../backups/tags.json"
/** @type {{ [tagName: string]: number; }[]} */
const allTags = fs.readJsonSync(tagsJsonFilePath)


/** @typedef {import("./typedef").Question} Question */
/** @typedef {import("./typedef").AnswerDetail} AnswerDetail */


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
    const s0 = "box-sizing: border-box; -moz-box-sizing: border-box; -ms-box-sizing: border-box; "
    const s1 = s0 + "display:table;"
    const s2 = s1 + "clear:both;"

    if (x.tagName == "SPAN") {
        const style = x.getAttribute("style")

        if (style == s0 || style == s1 || style == s2) {
            x.remove()
        }
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
    const base = "text-align:left;box-sizing: border-box; -moz-box-sizing: border-box; -ms-box-sizing: border-box; "
    const s0 = base + "margin: 0px 0px 10px; padding: 5px; "
    const s1 = base + "position:relative;z-index:1;line-height:1.6;word-wrap:break-word;"

    const style = x.getAttribute("style")
    if (style == s0 || style == s1) {
        const p = document.createElement("p")
        p.innerHTML = x.innerHTML
        x.replaceWith(p)
    }

    x.querySelectorAll("div").forEach(y => replaceDivWithP(y, document))
}

/**
 * @param {HTMLAnchorElement} authorE 
 * @returns {import("./typedef").UserObjSimplified}
 */
const getAuthor = (authorE) => {
    if (authorE && authorE.href.includes("/people/")) {
        const authorUserName = authorE.text
        const a = users.find(u => u["user-name"] == authorUserName)
        if (!a) {
            lostUsers.add(authorUserName)
        }

        return {
            "user-id": a ? a["user-id"] : -1,
            "user-name": authorUserName
        }
    } else {
        return null
    }
}

/**
 * @param {Element} answerDiv 
 * @param {boolean} folded 
 * @returns {AnswerDetail}
 */
const getAnswerDetail = (answerDiv, folded = false) => {
    const [titleDiv, bodyDiv, metaDiv] = answerDiv.children

    const [authorInfoDiv, agreeByUsersDiv] = titleDiv.querySelectorAll("div:last-child > div")
    const authorA = authorInfoDiv.querySelector("a")
    const author = getAuthor(authorA)

    const usingMobilePhone = !!authorInfoDiv.querySelector("i:last-child")

    const agreeByUsersAs = agreeByUsersDiv.querySelectorAll("a")
    const agreeBy = [...agreeByUsersAs].filter(x => x.text != "更多 »").map(x => getAuthor(x))

    replaceDivWithP(bodyDiv, answerDiv.getRootNode())
    removeUselessStyle(bodyDiv)
    const body = bodyDiv.innerHTML.trim()

    const dateE = metaDiv.querySelector("div:only-child > span:first-child")
    const date = new Date(dateE.textContent.trim())

    /** @type {HTMLAnchorElement} */
    const commentA = metaDiv.querySelector("div:only-child > span:nth-child(3) > a")
    const comments = +commentA.text.match(/\d+/)[0]

    return {
        author,
        body,
        comments,
        folded,
        "agree-by": agreeBy,
        "using-mobile-phone": usingMobilePhone,
        publishTime: date,
        modifyTime: date,
    }
}

/**
 * @param {Document} document 
 * @returns {{detail: import("./typedef").QuestionDetail; answers: AnswerDetail[]; }}
 */
const getQuestionDetailAndAnswers = (document) => {
    const titleE = document.querySelector("div.body > div > div > div > div > div > div > div > h1")
    const title = titleE.textContent.trim()

    /** @type {HTMLAnchorElement} */
    const authorE = document.querySelector("div.body dd > a")
    const author = getAuthor(authorE)

    /** @type {HTMLAnchorElement} */
    const linkE = document.querySelector("div.body > div > div > div > div > div > div > div > div > div > ul a")
    const link = linkE && linkE.href

    const D = document.querySelectorAll("div.body > div > div > div > div > div > div > div > div")
    const bodyE = D[0]
    const metaDivIndex = link ? 2 : 1
    const metaDiv = D[metaDivIndex]

    replaceDivWithP(bodyE, document)
    removeUselessStyle(bodyE)
    const body = bodyE.innerHTML.trim()

    const t = metaDiv.querySelector("span").textContent.trim()
    const date = new Date(t)

    const commentA = metaDiv.querySelector("a")
    const commentT = commentA.textContent
    const comments = commentT.includes("添加评论") ? 0 : +commentT.match(/(\d+) 条评论/)[1]

    const answerDivs = [...D].slice(metaDivIndex + 2, -2)
    const answerDivsFolded = [...[...D].slice(-1)[0].children]
    const answers = [
        ...answerDivs.map(x => {
            return getAnswerDetail(x)
        }),
        ...answerDivsFolded.map(x => {
            return getAnswerDetail(x, true)
        })
    ]

    return {
        detail: {
            title,
            body,
            author,
            link,
            comments,
            publishTime: date,
            modifyTime: date
        },
        answers
    }
}

/**
 * @param {Document} document  
 * @returns {(import("./typedef").QuestionSimplified)[]}
 */
const getRelatedQuestions = (document) => {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const qs = document.querySelectorAll("div.body > div > div > div > div > div > div > div > ul a")

    return [...qs].filter(x => {
        return x.href.match(/question\/\d+/)
    }).map(x => {
        return {
            title: x.text,
            id: +x.href.split("/").pop()
        }
    })
}

/**
 * @param {Document} document  
 * @returns {import("./typedef").QuestionStatus}
 */
const getQuestionStatus = (document) => {
    /** @type {NodeListOf<HTMLSpanElement>} */
    const statusSpans = document.querySelectorAll("div.body > div > div > div > div > div > div > div > ul > li > span")

    const [t, views, concerns] = [...statusSpans].map(x => {
        return x.textContent.trim()
    })

    return {
        "last-active-time": new Date(t),
        views: +views,
        concerns: +concerns
    }
}

/**
 * @param {number} qid 
 * @param {Document} document 
 * @returns {Question}
 */
const getQuestionData = (qid, document) => {
    const { detail, answers } = getQuestionDetailAndAnswers(document)

    return {
        type: "question",
        id: qid,
        tags: getTagsData(document),
        detail,
        answers,
        relatedQuestions: getRelatedQuestions(document),
        questionStatus: getQuestionStatus(document)
    }
}


/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    removeBlankSpans(document)

    // const data = backupType == "article" ? getArticleData(qid, document) : getQuestionData(qid, document)
    // const data = getQuestionData(qid, document)
    console.log(
        getQuestionStatus(document)
    )

    // await fs.writeJSON(lostUsersJsonFilePath, [...lostUsers], { spaces: 4 })

}

(async () => {
    // handler(1883)
    handler(1447)
})()
