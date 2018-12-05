
const fs = require("fs-extra")
const path = require("path")

const backupType = "question"
const baseFileName = `../backups/${backupType}s/html/`

const matomoScript = /<script type="text\/javascript">\s+var _paq = _paq(\s|.|\n)+?<\/script>/g
const crondScriptDiv = /<div style="display:none;" id="__crond">(\s|.)+?<\/div>/g
const UrlBaseElement = /<base.+?-->/g
const archiveURL = /https:\/\/.*?www.mohu.club\//


const process = async (qid) => {

    const html = (
        await fs.readFile(path.normalize(`${baseFileName}/${qid}.html`))
    ).toString()

    html.replace(matomoScript, "")
        .replace(crondScriptDiv, "")
        .replace(UrlBaseElement, "")
        .replace(archiveURL, "/")



}

