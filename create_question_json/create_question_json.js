// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("../util")

const backupType = "question"
const baseFilePath = `../../backups/${backupType}`
const outputPath = "../../json"

/** @typedef {import("./typedef").Question} Question */
/** @typedef {import("./typedef").Tag} Tag */
/** @typedef {import("./typedef").QuestionDetail} QuestionDetail */

/**
 * @param {Document} document 
 * @returns {Tag[]}
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
 * @param {Document} document 
 * @returns {QuestionDetail}
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

    const dateE = metaE.firstElementChild
    const date = new Date(dateE.textContent)

    const commentE = metaE.querySelector("a")
    const comments = +commentE.dataset.commentCount


    return {
        title,
        body,
        author: authorUserId,
        publishTime: date,
        modifyTime: date,
        comments,
        link
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
        detail: getQuestionDetail(document)
    }
}

/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    const data = getQuestionData(qid, document)

    fs.writeJSON(`${outputPath}/${qid}.json`, data, { spaces: 4 })
}

