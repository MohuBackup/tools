
const fs = require("fs")
const path = require("path")

/**
 * 获取目录下所有已备份的问题/文章的qid, 按从小到大的顺序依次作为参数调用callback
 * @param {fs.PathLike} baseFileName 
 * @param {(qid: number) => any} callback 
 * @returns 一个包含所有callback的返回值的Array
 */
const getAllQidsThen = (baseFileName, callback) => {
    return fs.readdirSync(baseFileName)
        .map((f) => path.parse(f).name)
        .filter((id) => Number.isInteger(+id))
        .sort((a, b) => (a | 0) - (b | 0))
        .map((qid) => {
            return callback(+qid)
        })
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


/**
 * @typedef {{"user-url": string; "user-name": string; avatar: string;}} AvatarUrlObj
 */

/**
 * AvatarUrlObj数组去重 (不能用Set因为Set无法去重Object)
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


module.exports = {
    getAllQidsThen,
    flat,
    dedup
}
