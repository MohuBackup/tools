// @ts-check
const fs = require("fs-extra")
const { JSDOM } = require("jsdom")
const { getAllQidsThen } = require("../util")

/** @type { "question" | "article" } */
const backupType = "article"
const baseFilePath = `../../backups/${backupType}`
const outputPath = `../../json/${backupType}`

const usersJsonFilePath = "../../backups/users.json"
/** @type {import("./typedef").UserObj[]} */
const users = fs.readJsonSync(usersJsonFilePath)

const lostUsersJsonFilePath = "../../backups/lost-users.json"
const lostUsers = new Set()

/** @typedef {import("./typedef").Question} Question */
/** @typedef {import("./typedef").AnswerDetail} AnswerDetail */
/** @typedef {import("./typedef").Article} Article */
/** @typedef {import("./typedef").CommentDetail} CommentDetail */

/**
 * @param {Document} document 
 * @returns {(import("./typedef").Tag)[]}
 */
const getTagsData = (document) => {
    /** @type {NodeListOf<HTMLSpanElement>} */
    const tags = document.querySelectorAll(".tag-bar .topic-tag")

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
 */
const getBaseDetail = (document) => {
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

    return {
        title,
        body,
        author: authorUserId,
        link,
    }
}

/**
 * @param {Document} document 
 * @returns {import("./typedef").QuestionDetail}
 */
const getQuestionDetail = (document) => {
    const baseDetail = getBaseDetail(document)

    const metaE = document.querySelector(".aw-question-detail .meta")
    const metaData = getMetaData(metaE)

    return {
        ...baseDetail,
        ...metaData
    }
}

/**
 * @param {Document} document 
 * @returns {import("./typedef").ArticleDetail}
 */
const getArticleDetail = (document) => {
    const baseDetail = getBaseDetail(document)
    /**
     * 删除link属性
     * 如果不删除，最后的函数返回值将和ArticleDetail接口相比多出link属性
     * (ts-check似乎无法检查对象解构后多出的属性)
     */
    delete baseDetail.link

    const metaDiv = document.querySelector(".aw-question-detail .meta")

    const dateE = metaDiv.querySelector(".more-operate > em")
    const date = new Date(dateE.textContent)

    /** @type {NodeListOf<HTMLAnchorElement>} */
    const votersAs = document.querySelectorAll(".aw-article-voter a.voter")
    const voters = [...votersAs].map(x => {
        const userName = x.dataset.originalTitle
        const user = users.find(u => u["user-name"] == userName)
        if (!user) {
            lostUsers.add(userName)
            console.log(userName)
        }

        return {
            "user-id": user ? user["user-id"] : -1,
            "user-name": userName
        }
    })

    return {
        ...baseDetail,
        voters,
        publishTime: date,
        modifyTime: date,
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

    // 判断答案是否被折叠
    const folded = +answerDiv.attributes.getNamedItem("uninterested_count").value > 0
        || +answerDiv.attributes.getNamedItem("force_fold").value > 0

    return {
        author,
        body,
        folded,
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
 * @param {HTMLDivElement} ArticleCommentDiv 
 * @returns {CommentDetail}
 */
const getArticleCommentsDetail = (ArticleCommentDiv) => {
    /** @type {HTMLImageElement} */
    const authorImg = ArticleCommentDiv.querySelector(".mod-head img")
    const authorUserName = authorImg.alt
    const author = users.find(u => u["user-name"] == authorUserName)
    if (!author) {
        lostUsers.add(authorUserName)
        console.log(authorUserName)
    }

    const bodyDiv = ArticleCommentDiv.querySelector(".mod-body > .markitup-box")
    const body = bodyDiv.innerHTML.trim()

    const t = ArticleCommentDiv.querySelector(".meta > span").textContent
    const date = new Date(t)

    return {
        author: {
            "user-id": author ? author["user-id"] : -1,
            "user-name": authorUserName
        },
        body,
        publishTime: date,
        modifyTime: date
    }
}

/**
 * @param {Document} document 
 * @returns {CommentDetail[]}
 */
const getArticleComments = (document) => {
    /** @type {NodeListOf<HTMLDivElement>} */
    const answerDivs = document.querySelectorAll(".aw-feed-list .aw-item")

    return [...answerDivs].map(x => {
        return getArticleCommentsDetail(x)
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
 * @param {Document} document 
 * @returns {Article}
 */
const getArticleData = (qid, document) => {
    return {
        type: "article",
        id: qid,
        tags: getTagsData(document),
        relatedQuestions: getRelatedQuestions(document),
        detail: getArticleDetail(document),
        comments: getArticleComments(document)
    }
}

/**
 * @param {number} qid 
 */
const handler = async (qid) => {
    const html = await fs.readFile(`${baseFilePath}/${qid}.html`, "utf-8")
    const { window: { document } } = new JSDOM(html)

    const data = backupType == "article" ? getArticleData(qid, document) : getQuestionData(qid, document)

    await fs.ensureDir(outputPath)
    fs.writeJSON(`${outputPath}/${qid}.json`, data, { spaces: 4 })
}

(async () => {
    // handler(252)

    // 一次仅处理少量文件，防止内存溢出
    const l = []
    getAllQidsThen(baseFilePath, (qid) => l.push(qid))

    for (let i = 0; i <= Math.floor(l.length / 200) * 200; i = i + 200) {
        await Promise.all(
            l.slice(i, i + 200).map((qid) => {
                return handler(qid)
            })
        )
    }

    await fs.writeJSON(lostUsersJsonFilePath, [...lostUsers], { spaces: 4 })

})()