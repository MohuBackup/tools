
const fs = require("fs-extra")
const path = require("path")

const backupType = "question"
const baseFileName = `../backups/${backupType}s/html/`

const matomoScript = /<script type="text\/javascript">\s+var _paq = _paq(.|\n)+?<\/script>/g
const crondScriptDiv = /<div style="display:none;" id="__crond">(.|\n)+?<\/div>/g
const UrlBaseElement = /<base.+?-->/g
const archiveURL0 = /(\/im_\/)?https:\/\/.*?www.mohu.club\//g
const archiveURL1 = /https:([\w./:]+?(http(s)?))+/g


const process = async (qid) => {

    const filepath = path.normalize(`${baseFileName}/${qid}.html`)

    const html = (
        await fs.readFile(filepath)
    ).toString()

    const newHTML = html.replace(matomoScript, "")
        .replace(crondScriptDiv, "")
        .replace(UrlBaseElement, "")
        .replace(archiveURL0, "/")
        .replace(archiveURL1, "$2")

    await fs.writeFile(filepath, newHTML)

}

