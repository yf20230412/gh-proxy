'use strict'

// ====================== 正确读取环境变量（无报错版） ======================
const ASSET_URL        = typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT.ASSET_URL : 'https://github2-bv9.pages.dev' //静态资源
const PREFIX           = typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT.PREFIX : '/' // 路径前缀 如果自定义路由为example.com/gh/*，将PREFIX改为 '/gh/'，注意，少一个杠都会错！
const ENABLE_JSDELIVR  = typeof ENVIRONMENT !== 'undefined' ? Number(ENVIRONMENT.ENABLE_JSDELIVR) : 0 //0 = GitHub实时更新   1=jsDelivr 有缓存
const FORCE_REGION     = typeof ENVIRONMENT !== 'undefined' ? Number(ENVIRONMENT.FORCE_REGION) : 1 // 1=开启强制地区 0=关闭
const CF_REGION_CODE   = typeof ENVIRONMENT !== 'undefined' ? ENVIRONMENT.CF_REGION : 'HK'  // HK 香港 / JP 日本 / SG 新加坡 /韩国 = KR /台湾 = TW
const WHITE_LIST       = typeof ENVIRONMENT !== 'undefined' && ENVIRONMENT.WHITE_LIST ? ENVIRONMENT.WHITE_LIST.split(',') : []  //白名单，留空，路径里面有包含字符的才会通过, 逗号分隔/username/,/repo/ 
// =========================================================================

// 动态设置地区
const CF_REGION = new Headers({ 'cf-region': CF_REGION_CODE })

/** @type {ResponseInit} */
const PREFLIGHT_INIT = {
    status: 204,
    headers: new Headers({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS',
        'access-control-max-age': '1728000',
    }),
}

const exp1 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:releases|archive).*$/i
//const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:blob|raw).*$/i
// 只匹配 github.com/blob 链接，排除raw
const exp2 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/blob.*$/i
const exp3 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/(?:info|git-).*$/i
//const exp4 = /^(?:https?:\/\/)?raw\.githubusercontent\.com\/.+?\/.+?\/.+?\/.+$/i
const exp4 = /^(?:https?:\/\/)?raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(.+)$/i

const exp5 = /^(?:https?:\/\/)?gist\.github\.com\/.+?\/.+?\/.+$/i
const exp6 = /^(?:https?:\/\/)?github\.com\/.+?\/.+?\/tags.*$/i

function makeRes(body, status = 200, headers = {}) {
    headers['access-control-allow-origin'] = '*'
    return new Response(body, { status, headers })
}

function newUrl(urlStr) {
    try {
        return new URL(urlStr)
    } catch (err) {
        return null
    }
}

addEventListener('fetch', e => {
    const ret = fetchHandler(e)
        .catch(err => makeRes('cfworker error:\n' + err.stack, 502))
    e.respondWith(ret)
})

function checkUrl(u) {
    for (let i of [exp1, exp2, exp3, exp4, exp5, exp6]) {
        if (u.search(i) === 0) {
            return true
        }
    }
    return false
}

async function fetchHandler(e) {
    const req = e.request
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    let path = urlObj.searchParams.get('q')
    if (path) {
        return Response.redirect('https://' + urlObj.host + PREFIX + path, 301)
    }
    path = urlObj.href.substr(urlObj.origin.length + PREFIX.length).replace(/^https?:\/+/, 'https://')

    // 优先单独匹配 raw.githubusercontent 域名
    if (path.search(exp4) === 0) {
        if (ENABLE_JSDELIVR) {
            const newUrl = path.replace(
                /^https?:\/\/raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\//,
                'https://cdn.jsdelivr.net/gh/$1/$2@'
            )
            return Response.redirect(newUrl, 302)
        } else {
            return httpHandler(req, path)
        }
    }

    // 再匹配 github.com 相关链接
    else if (path.search(exp2) === 0) {
        if (ENABLE_JSDELIVR) {
            const newUrl = path.replace('/blob/', '@').replace(/^(?:https?:\/\/)?github\.com/, 'https://cdn.jsdelivr.net/gh')
            return Response.redirect(newUrl, 302)
        } else {
            path = path.replace('/blob/', '/raw/')
            return httpHandler(req, path)
        }    
    }
    // 其余Github资源统一代理
    else if (path.search(exp1) === 0 || path.search(exp5) === 0 || path.search(exp6) === 0 || path.search(exp3) === 0) {
        return httpHandler(req, path)
    }
    // 兜底静态页面
    else {
        return fetch(ASSET_URL + path)
    }
}


function httpHandler(req, pathname) {
    const reqHdrRaw = req.headers
    if (req.method === 'OPTIONS' && reqHdrRaw.has('access-control-request-headers')) {
        return new Response(null, PREFLIGHT_INIT)
    }
    const reqHdrNew = new Headers(reqHdrRaw)
    let urlStr = pathname
    let flag = !Boolean(WHITE_LIST.length)
    for (let i of WHITE_LIST) {
        if (urlStr.includes(i.trim())) {
            flag = true
            break
        }
    }
    if (!flag) return new Response("blocked", { status: 403 })
    if (urlStr.search(/^https?:\/\//) !== 0) urlStr = 'https://' + urlStr
    const urlObj = newUrl(urlStr)
    const reqInit = {
        method: req.method,
        headers: reqHdrNew,
        redirect: 'manual',
        body: req.body,
        cache: 'no-store' // 新增不缓存，保证实时+提速
    }
    return proxy(urlObj, reqInit)
}

async function proxy(urlObj, reqInit) {
    const headers = new Headers(reqInit.headers)
    if (FORCE_REGION) {
        CF_REGION.forEach((v, k) => headers.set(k, v))
        reqInit.headers = headers
    }

    const res = await fetch(urlObj.href, reqInit)
    const resHdrOld = res.headers
    const resHdrNew = new Headers(resHdrOld)
    const status = res.status

    if (resHdrNew.has('location')) {
        let _location = resHdrNew.get('location')
        if (checkUrl(_location))
            resHdrNew.set('location', PREFIX + _location)
        else {
            reqInit.redirect = 'follow'
            return proxy(newUrl(_location), reqInit)
        }
    }
    resHdrNew.set('access-control-expose-headers', '*')
    resHdrNew.set('access-control-allow-origin', '*')
    resHdrNew.delete('content-security-policy')
    resHdrNew.delete('content-security-policy-report-only')
    resHdrNew.delete('clear-site-data')

    return new Response(res.body, { status, headers: resHdrNew })
}
