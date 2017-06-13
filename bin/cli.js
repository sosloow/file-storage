#!/usr/bin/env node

'use strict';

const connect = require('connect');
const hall = require('hall');
const {middleware, FileStore, NedbDataStorage, MongodbDataStorage, FsBlobStorage} = require('..');
const nedb = require('nedb');
const argentum = require('argentum');
const fs = require('fs');
const path = require('path');
const {MongoClient} = require('mongodb');

const argv = process.argv.slice(2);
const config = argentum.parse(argv, {
    aliases: {
        d: 'debug',
        v: 'verbose',
    },
    defaults: {
        port: process.env.PORT || 8080,
        debug: process.env.DEBUG === '1',
        verbose: process.env.VERBOSE === '1',
        pidFile: process.env.PID_FILE || '/var/run/file-store.pid',
        mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017/filestorage',
    },
});

const DEBUG = config.debug;
const VERBOSE = config.verbose;
const MONGO_URL = config.mongoUrl;
const port = config.port;
const dir = path.resolve(process.cwd(), argv[0] || '.');

process.on('beforeExit', () => onExit);
process.on('exit', () => onExit);
process.on('SIGINT', () => {
    onExit()
    process.exit();
});

MongoClient.connect(MONGO_URL).then((db) => {
    const storage = new FileStore({
        dataStore: new MongodbDataStorage({
            db,
            collection: 'files',
        }),
        blobStore: new FsBlobStorage({dir}),
    });

    const router = hall();
    const logger = VERBOSE
        ? console
        : null;

    connect()
    .use((req, res, next) => {
        VERBOSE && console.log(req.method, req.url);
        next();
    })
    .use(middleware(router, storage, logger, DEBUG))
    .use((err, req, res, next) => {
        if (! err) {
            res.statusCode = 404;
            res.statusText = 'Nothing found';
            res.end();
        }
        else {
            res.statusCode = 500;
            res.statusText = 'Internal error';
            res.end(err.message);
            DEBUG && console.log(err);
        }
    })
    .listen(port);

    VERBOSE && console.log('Listening on localhost:%s', port);
})
.catch(onError);

function onError(error) {
    console.error(error);
    process.exit(1);
}

function onExit() {
}
