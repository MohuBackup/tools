
const fs = require("fs-extra")
const path = require("path")
const { getAllQidsThen } = require("./util")

const backupType = "article"
const baseFileName = `../backups/${backupType}/`

const matomoScript = /<script type="text\/javascript">\s+var _paq = _paq(.|\n|\s)+?<\/script>/g
const crondScriptDiv = /<div style="display:none;" id="__crond">(.|\n|\s)+?<\/div>/g
const UrlBaseElement = /<base.+?-->/g
const archiveURL0 = /(\/im_\/)?https:\/\/.*?www.mohu.club\//g
const archiveURL1 = /https:([\w./:]+?(http(s)?))+/g


const handler = async (qid) => {

    const filepath = path.normalize(`${baseFileName}/${qid}.html`)

    const html = await fs.readFile(filepath, "utf-8")

    const newHTML = html.replace(matomoScript, "")
        .replace(crondScriptDiv, "")
        .replace(UrlBaseElement, "")
        .replace(archiveURL0, "/")
        .replace(archiveURL1, "$2")

    await fs.writeFile(filepath, newHTML)

}

getAllQidsThen(baseFileName, handler)

