// @ts-check
const fs = require("fs-extra")
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
 * 判断传入的参数是否是一个数组
 * @param {any} x 
 */
const isArray = (x) => {
    return Object.prototype.toString.call(x) == "[object Array]"
}

/**
 * @param {number} n 
 * @returns {string}
 */
const pad2 = (n) => {
    return String(Math.floor(n)).padStart(2, "0")
}

/**
 * 不throw错误地从一个json文件中读取数组
 * @param {string} file 
 * @param {fs.ReadOptions} [options] 
 * @returns {Promise<any[]>}
 */
const readArrayFromJSON = async (file, options) => {
    let data
    try {
        data = await fs.readJSON(file, options)
    } catch (e) {
        console.error(e)
        data = []
    }
    return isArray(data) ? data : []
}

/** 
 * 导入 `node-fetch`  
 * 直接定义类型为import("node-fetch")似乎会有问题
 * @typedef {import("node-fetch").Request} Request
 * @typedef {import("node-fetch").RequestInit} RequestInit
 * @typedef {import("node-fetch").Response} Response
 * @type {
        (
            url: string | Request,
            init?: RequestInit
        ) 
         => Promise<Response> 
    }
 */
const fetch = require("node-fetch")

/**
 * 使用梯子，不解释
 * @return 一个 `https.Agent` 实例
 */
const getProxyAgent = () => {
    const SocksProxyAgent = require("socks-proxy-agent")
    const proxy = "socks://127.0.0.1:1080"

    /** @type {import("https").Agent} */
    const agent = new SocksProxyAgent(proxy, true)

    // agent.options.rejectUnauthorized = false

    return agent
}


/**
 * @typedef {{"user-url": string; "user-name": string; avatar?: string;}} AvatarUrlObj
*/

/**
 * @typedef {{"user-id": number; "user-url": string; "user-name": string; "user-description"?: string; avatar?: string;}} UserObj extends AvatarUrlObj 
 */

/**
 * AvatarUrlObj或UserObj数组去重 (不能用Set因为Set无法去重Object)
 * @template {AvatarUrlObj} T
 * @param {T[]} oldAll 
 * @returns {T[]}
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

/**
 * 按照用户id升序排列由UserObj组成的数组
 * @param {UserObj[]} userObjs 
 */
const sortUserObjArray = (userObjs) => {
    return userObjs.sort((a, b) => {
        return a["user-id"] - b["user-id"]
    })
}


module.exports = {
    getAllQidsThen,
    readArrayFromJSON,
    fetch,
    flat,
    pad2,
    dedup,
    isArray,
    getProxyAgent,
    sortUserObjArray,
}
