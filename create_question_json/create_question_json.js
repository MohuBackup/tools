// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../backups/${backupType}`
const outputPath = `../../json/${backupType}`

/** @typedef {import("./typedef").Question} Question */
/** @typedef {import("./typedef").AnswerDetail} AnswerDetail */

/**
 * @param {Document} document 
 * @returns {(import("./typedef").Tag)[]}
 */
const getTagsData = (document) => {
    /** @type {NodeListOf<HTMLSpanElement>} */
    const tags = document.querySelectorAll(".topic-tag")

    return [...tags].map(x => {
        return {
            "tag-id": +x.dataset.id,
            "tag-name": x.textContent.trim()  // x.querySelector(".text").textContent
        }
    })
}

/**
 * @param {Element} metaDiv 
 */
const getMetaData = (metaDiv) => {
    /** @type {HTMLAnchorElement} */
    const commentA = metaDiv.querySelector("a.aw-add-comment")
    const comments = +commentA.dataset.commentCount

    const dateE = metaDiv.firstElementChild
    const date = new Date(dateE.textContent)

    return {
        comments,
        publishTime: date,
        modifyTime: date,
    }
}

/**
 * @param {Document} document 
 * @returns {import("./typedef").QuestionDetail}
 */
const getQuestionDetail = (document) => {
    const titleE = document.querySelector(".aw-question-detail > .mod-head > h1")
    const title = titleE.textContent.trim()

    /** @type {HTMLAnchorElement} */
    const authorE = document.querySelector(".aw-side-bar dd > .aw-user-name")
    const authorUserId = authorE && +authorE.dataset.id

    const detailE = document.querySelector(".aw-question-detail")

    const bodyE = detailE.querySelector(".content")
    const body = bodyE.innerHTML.trim()

    /** @type {HTMLAnchorElement} */
    const linkE = detailE.querySelector(".aw-question-related-list a")
    const link = linkE && linkE.href

    const metaE = detailE.querySelector(".meta")

    return {
        title,
        body,
        author: authorUserId,
        link,
        ...getMetaData(metaE)
    }
}

/**
 * @param {HTMLDivElement} answerDiv 
 * @returns {AnswerDetail}
 */
const getAnswerDetail = (answerDiv) => {
    /** @type {HTMLAnchorElement} */
    const authorA = answerDiv.querySelector("a.aw-user-img")
    const author = +authorA.dataset.id || null

    const agreeByElement = answerDiv.querySelector(".aw-agree-by")
    const agreeByUsers = agreeByElement.querySelectorAll(".aw-user-name")
    const agreeBy = [...agreeByUsers].map(
        /** @param {HTMLAnchorElement} x */
        (x) => {
            return {
                "user-id": +x.dataset.id,
                "user-name": x.text
            }
        }
    )

    const usingMobilePhone = !!answerDiv.querySelector(".title i.icon.icon-phone")

    const bodyDiv = answerDiv.querySelector(".mod-body > .markitup-box")
    const body = bodyDiv.innerHTML.trim()

    const metaDiv = answerDiv.querySelector(".mod-footer > .meta")

    return {
        author,
        body,
        "agree-by": agreeBy,
        "using-mobile-phone": usingMobilePhone,
        ...getMetaData(metaDiv)
    }
}

/**
 * @param {Document} document 
 * @returns {AnswerDetail[]}
 */
const getAnswers = (document) => {
    /** @type {NodeListOf<HTMLDivElement>} */
    const answerDivs = document.querySelectorAll(".aw-feed-list .aw-item")

    return [...answerDivs].map(x => {
        return getAnswerDetail(x)
    })
}

/**
 * @param {Document} document  
 * @returns {(import("./typedef").QuestionSimplified)[]}
 */
const getRelatedQuestions = (document) => {
    /** @type {NodeListOf<HTMLAnchorElement>} */
    const qs = document.querySelectorAll(".aw-side-bar li > a")

    return [...qs].map(x => {
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
    const statusSpans = document.querySelectorAll(".aw-side-bar li > span")

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
    return {
        type: "question",
        id: qid,
        tags: getTagsData(document),
        detail: getQuestionDetail(document),
        answers: getAnswers(document),
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

    const data = getQuestionData(qid, document)

    await fs.ensureDir(outputPath)
    fs.writeJSON(`${outputPath}/${qid}.json`, data, { spaces: 4 })
}


// handler(299)
getAllQidsThen(baseFilePath, handler)
