// @ts-check
const fs = require("fs")
const path = require("path")

/**
 * 获取目录下所有已备份的问题/文章的qid, 按从小到大的顺序依次作为参数调用callback
 * @template T
 * @param {fs.PathLike} baseFileName 
 * @param {(qid: number) => T} callback 
 * @returns {T[]} 一个包含所有callback的返回值的Array
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
 * @template A 
 * @param {A[][]} array 
 */
const flat = (array) => {
    return array.reduce((a, x) => {
        return a.concat(x)
    }, [])
}


/**
 * @typedef {{"user-url": string; "user-name": string; avatar?: string;}} AvatarUrlObj
 */

/**
 * @typedef {{"user-id": number; "user-url": string; "user-name": string; "user-description"?: string; avatar?: string;}} UserObj
 */

/**
 * AvatarUrlObj数组去重 (不能用Set因为Set无法去重Object)
 * @param {AvatarUrlObj[]} oldAll 
 * @returns {AvatarUrlObj[]}
 */
const dedup = (oldAll) => {
    return oldAll.filter(x => {  // 过滤掉已注销的用户
        return x["user-url"]
    }).sort((a, b) => {  // 按照 Unicode 码位顺序排序
        const userA = a["user-url"]
        const userB = b["user-url"]
        if (userA < userB) {
            return -1
        } else if (userA > userB) {
            return 1
        } else {  // 进一步排序单一用户被抓取到的全部头像图片地址，使排序稳定
            const avatarA = a.avatar
            const avatarB = b.avatar
            if (!avatarA) return 1  // 将不包含头像(avatar属性值为null)的AvatarUrlObj排在该用户所有对应的AvatarUrlObj的最后
            if (!avatarB) return -1

            if (avatarA < avatarB) {
                return -1
            } else if (avatarA > avatarB) {
                return 1
            } else {
                return 0
            }
        }
    }).reduce((newAll, c) => {  // 真正的去重过程
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