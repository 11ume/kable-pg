const { parse } = require('pg-connection-string/index')

function parseUri(uri) {
    const parsed = parse(uri)
    return {
        host: parsed.host
        , user: parsed.user
        , port: parsed.port
        , database: parsed.database
        , password: parsed.password
    }
}

module.exports = {
    parseUri
}