#!/usr/bin/env node
const arg = require('arg')
const path = require('path')
const run = require('../main')
const { existsSync } = require('fs')
const { version } = require('../package.json')

const args = arg({
    '--help': Boolean
    , '-h': '--help'
    , '--version': Boolean
    , '-v': '--version'
    , '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
    , '--ssl': Boolean
    , '-s': '--ssl'
    , '--statement_timeout': Number
    , '-st': '--statement_timeout'
    , '--query_timeout': Number
    , '-qt': '--query_timeout'
})

if (args['--help']) {
    console.error(`
    kable-pg - Custom kable node prepared to work whit Postgrsql server.
    USAGE
        $ kable --help
        $ kable --version
        $ kable -u <pg_uri>
    OPTIONS
        --help                              shows this help message
        -v  --version                       displays the current used version
        -u, --uri <pg_uri>                  specify a URI of connection
        -i, --id <node id>                  specify a unique id to indentificate this node
        -k, --key <key>                     specify a 32 character key to ensure the communication between all connected nodes
        -s, --ssl <boolean>                 passed directly to node.TLSSocket
        -st, --statement_timeout <number>   number of milliseconds before a statement in query will time out, default is no timeout
        -qt, --query_timeout <number>       number of milliseconds before a query call will timeout, default is no timeout
`)
    process.exit(2)
}

if (args['--version']) {
    console.log(version)
    process.exit()
}

if (!args['--uri']) {
    console.error('The arg --uri is required')
    process.exit(1)
}

function getModFileIndex() {
    const main = 'index.js'
    try {
        const packageJson = require(path.resolve(process.cwd(), 'package.json'))
        return packageJson.main || main
    } catch (err) {
        return main
    }
}

async function mod(fileName) {
    let modul
    try {
        // Await to support exporting Promises
        modul = await require(path.resolve(process.cwd(), fileName))
        // Await to support es6 module's default export
        if (modul && typeof modul === 'object') {
            modul = await modul.default
        }
    } catch (err) {
        console.error(`Error when importing ${fileName}: ${err.stack}`)
        process.exit(1)
    }

    if (typeof modul !== 'function') {
        console.error(`The file "${fileName}" does not export a function.`)
        process.exit(1)
    }

    return modul
}

async function start() {
    const k = await run({
        uri: args['--uri']
        , id: args['--id']
        , key: args['--key']
        , ssl: args['--ssl']
        , statementTimeout: args['--statement_timeout']
        , queryTimeout: args['--query_timeout']
    })

    const fileName = getModFileIndex()
    if (existsSync(fileName)) (await mod(fileName))(k)
}

start()
