const pg = require('pg')
const kable = require('kable')
const { description } = require('./package.json')
const { parseUri } = require('./lib/utils')

function retry(k, options, config, client = null) {
    const call = () => {
        client && client.end()
        k.doing(`Retrying connect to the server in ${options.host}:${options.port}`)
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

    const parsed = parseUri(uri)
    const options = {
        host: parsed.host
        , port: parsed.port
        , waitToRetryTime
    }

    const k = kable(id, {
        host: parsed.host
        , port: parsed.port
        , key
        , meta
        , verbose
    })

    return k.run(false).then(() => {
        k.doing('Starting')
        connect(k, options, config)
        return k
    })
}

module.exports = run 