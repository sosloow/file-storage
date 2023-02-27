function defineConst(target, name, value) {
    Object.defineProperty(target, name, {
        value,
        enumerable: false,
        configurable: false,
    });
}

function promiseSeries(test, step) {
    return new Promise((resolve, reject) => {
        function spin() {
            if (test()) {
                Promise.resolve(step())
                .then(spin)
                .catch(reject);
            }
            else {
                resolve();
            }
        }

        spin();
    });
}

function getRange(header, chunkSize, totalSize) {
    const defaultRange = {start: 0, end: totalSize - 1, contentLength: totalSize};

    if (typeof header !== 'string') {
        return defaultRange;
    }
    const match = header.match(/(\d+)-(\d+)?/);

    if (! match) {
        return defaultRange;
    }

    let [, start] = match;

    start = Number(start);

    if (Number.isNaN(start)) {
        return defaultRange;
    }

    const end = Math.min(start + chunkSize, totalSize - 1);
    const contentLength = end - start + 1;

    return {start, end, contentLength};
}

function getRangeLength(range) {
    if (! range) {
        return 0;
    }

    return range[1] - range[0] + 1;
}

exports.defineConst = defineConst;
exports.promiseSeries = promiseSeries;
exports.getRange = getRange;
exports.getRangeLength = getRangeLength;
