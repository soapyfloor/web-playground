'use strict';

var File = require('../util/file');
var CONST = require('../CONST');

module.exports = function getCssReset(req, res) {
  res.set('Content-Type', CONST.CSS_CONTENT_TYPE);
  File.readFile(CONST.CSS_RESET_PATH)
    .then(res.send.bind(res));
};