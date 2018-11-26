#!/usr/bin/env python
# -*- coding: utf-8 -*-
import codecs
import json
import re
import time
from datetime import datetime
from os import path

import gevent
import grequests

backupType = "question"
baseUrl = "https://via.hypothes.is/https://web.archive.org/web/2/www.mohu.club/{backupType}/".format(
    backupType=backupType)
baseFileName = "../backups/{backupType}s/html/{{id}}.html".format(
    backupType=backupType)
jsonFilename = path.join(path.dirname(baseFileName), "resData.json")


try:
    with codecs.open(jsonFilename, "rb") as f:
        resData = json.load(f)
except IOError:
    resData = []


def exceptionHandler(request, exception):
    print(exception)


def getModifiedContent(content):
    insertBegin = "<!-- WB Insert -->"
    insertEnd = "<!-- End Wayback Rewrite JS Include -->"
    r0 = re.compile(insertBegin + ".+" + insertEnd, re.M | re.S)
    c = r0.sub("", content).split("</html>")[0]
    return c + "</html>"


def getRawURL(url):
    r = re.compile("www\.mohu\.club(.+)")
    return "https://" + r.search(url).group(0)


def resDataItem(qid, rawURL, url, archiveTime):
    return {
        "id": int(qid),
        "rawURL": rawURL,
        "url": url,
        "archiveTime": archiveTime
    }


def parseDatetime(s):
    return datetime.strptime(s, "%Y-%m-%dT%X")


def getArchiveTime(url):
    r = re.compile("\d{14}")
    t = r.search(url).group(0)
    return datetime.strptime(t, "%Y%m%d%H%M%S").isoformat()


def resolveResponse(res):
    r1 = re.compile("\d+")
    url = res.url
    qid = r1.findall(
        url.split("/")[-1]
    )[0]

    rawURL = getRawURL(url)
    archiveTime = getArchiveTime(url)

    d = [x for x in resData if (x.get("id") and x["id"] == int(qid))]
    if d:
        savedResDataItem = d[0]
        if parseDatetime(archiveTime) > parseDatetime(savedResDataItem["archiveTime"]):
            resData.remove(savedResDataItem)
        else:
            print("skipped " + qid)
            return

    output = getModifiedContent(res.content)

    filename = baseFileName.format(id=qid)

    resData.append(resDataItem(qid, rawURL, url, archiveTime))

    with codecs.open(filename, "wb") as f:
        f.write(output)


for ai in xrange(50):

    reqs = set()

    for i in xrange(ai * 100 + 1, (ai + 1) * 100):
        reqs.add(
            grequests.get(baseUrl + str(i))
        )

    time0 = time.time()

    responses = grequests.imap(
        reqs,
        exception_handler=exceptionHandler,
        size=None,
        stream=True
    )

    try:
        for res in responses:
            if res:
                gevent.spawn(resolveResponse, res)

        gevent.wait(timeout=100)
    finally:
        print(time.time() - time0)
        resData.sort(key=lambda data: data["id"])

        with codecs.open(jsonFilename, "wb") as f:
            f.write(json.dumps(resData))
