const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

function clearCache() {
  cache.flushAll();
}

module.exports = { cache, clearCache };
