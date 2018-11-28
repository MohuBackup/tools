
const fs = require("fs")
const path = require("path")

/**
 * 获取目录下所有已备份的问题/文章的qid, 按qid从小到大的顺序依次调用callback
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

module.exports = {
    getAllQidsThen
}
