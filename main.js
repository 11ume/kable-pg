const pg = require('pg')
const kable = require('kable')
const uriParser = require('pg-connection-string/index').parse
const { description } = require('./package.json')

const parseUri = (uri) => {
    const parse = uriParser(uri)
    return {
        host: parse.host
        , user: parse.user
        , port: parse.port
        , database: parse.database
        , password: parse.password
    }
}

function retry(k, options, config, client = null) {
    const call = () => {
        client && client.end()
        k.doingSomething(`Retrying connect to the server in ${options.host}:${options.port}`)
        connect(k, options, config, client)
    }

    setTimeout(call, options.waitToRetryTime)
}

function connect(k, options, config) {
    const client = new pg.Client(config)
    client.connect(err => {
        if (err) {
            retry(k, options, config, client)
            return
        }

        k.start()
    })

    client.on('error', (err) => {
        if (k.state === 'STOPPED') return
        k.stop(err.message)
        retry(k, options, config)
    })
}

function run({
    id
    , key = null
    , verbose = false
    , waitToRetryTime = 2000
    , uri
    , ssl
    , queryTimeout
    , statementTimeout
}) {

    const config = {
        connectionString: uri
        , ssl
        , statement_timeout: statementTimeout
        , query_timeout: queryTimeout
    }

    const meta = {
        id: 'pg-node'
        , description
    }

    const parse = parseUri(uri)
    const options = {
        host: parse.host
        , port: parse.port
        , waitToRetryTime
    }

    const k = kable(id, {
        host: parse.host
        , port: parse.port
        , key
        , meta
        , verbose
    })

    return k.run(false).then(() => {
        k.doingSomething('Starting')
        connect(k, options, config)
        return k
    })
}

module.exports = run 