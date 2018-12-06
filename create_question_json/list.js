// @ts-check
const fs = require("fs-extra")
const moment = require("moment")
const { getAllQidsThen, pad2 } = require("../util")


const usersJsonFilePath = "../../backups/users.json"
/** @type {import("./typedef").UserObj[]} */
const users = fs.readJsonSync(usersJsonFilePath)

/**
 * @param {?(import("./typedef").UserObjLike)} u 
 * @return {number}
 */
const getUserID = (u) => {
    if (u) {
        return u["user-id"] || u
    } else {
        return null
    }
}

/**
 * @param {number} userID 
 */
const getUserName = (userID) => {
    if (userID) {
        const user = users.find(x => {
            return x["user-id"] == userID
        })
        return user && user["user-name"]
    } else {
        return null
    }
}

/**
 * @param {number} userID 
 */
const getUserAvatar = (userID) => {
    if (userID) {

        const user = users.find(x => {
            return x["user-id"] == userID
        })

        if (!user || !user.avatar) return null

        return `/uploads/avatar/000/00/${pad2(userID / 100)}/${pad2(userID % 100)}_avatar_mid.jpg`

    } else {
        return null
    }
}

const getNumberOrArrayLength = (x) => {
    return Number.isInteger(+x) ? x : x.length
}

/**
 * 
 * @param {import("./typedef").AnswerDetail[]} answers 
 */
const getLastAnswerDetail = (answers) => {

    if (answers.length == 0) {
        return null
    }

    const lastAnswer = answers.sort((a, b) => {
        return new Date(b.modifyTime).getTime() - new Date(a.modifyTime).getTime()
    })[0]

    const lastAnswerPublishDate = moment(lastAnswer.modifyTime).format("YYYY-MM-DD")
    const lastAnswerUserID = getUserID(lastAnswer.author)
    const lastAnswerUserName = getUserName(lastAnswerUserID)

    return {
        authorUserID: lastAnswerUserID,
        authorUserName: lastAnswerUserName,
        publishDate: lastAnswerPublishDate
    }
}

/**
 * @param {number} qid 
 */
const getAllQuestions = async (inputPath, qid) => {
    /** @type {import("./typedef").Question} */
    const data = await fs.readJson(`${inputPath}/${qid}.json`)

    const { id, detail, answers, questionStatus } = data
    const { title, author, modifyTime } = detail
    const { views, concerns } = questionStatus

    const userID = getUserID(author)
    const userName = getUserName(userID)
    if (userID == 2765) {  // 过滤掉50cent的提问
        return
    }

    const publishDate = moment(modifyTime).format("YYYY-MM-DD")

    return {
        id,
        title,
        authorUserID: userID,
        authorUserName: userName,
        authorAvatar: getUserAvatar(userID),
        answersCount: answers.length,
        lastAnswer: getLastAnswerDetail(answers),
        concerns: getNumberOrArrayLength(concerns),
        views,
        publishDate
    }
}

/**
 * @param {number} qid 
 */
const getAllArticles = async (inputPath, qid) => {
    /** @type {import("./typedef").Article} */
    const data = await fs.readJson(`${inputPath}/${qid}.json`)

    const { id, detail, comments } = data
    const { title, author, voters, publishTime } = detail

    const userID = getUserID(author)
    const userName = getUserName(userID)
    if (userID == 2765) {  // 过滤掉50cent发表的文章
        return
    }

    const publishDate = moment(publishTime).format("YYYY-MM-DD")

    return {
        id,
        title,
        authorUserID: userID,
        authorUserName: userName,
        authorAvatar: getUserAvatar(userID),
        commentsCount: comments.length,
        voters: getNumberOrArrayLength(voters),
        publishDate
    }

}

const backupTypes = ["question", "article"]

backupTypes.forEach(async (backupType) => {
    const inputPath = `../../json/${backupType}`

    const handler = backupType == "question" ? getAllQuestions : getAllArticles

    // console.log(await handler(inputPath, 1))

    const output = (
        await Promise.all(
            getAllQidsThen(inputPath, (qid) => handler(inputPath, qid))
        )
    ).filter(x => !!x)

    fs.writeJSON(`../../backups/_data/${backupType}s.json`, output, { spaces: 4 })

    // console.log(output)

})