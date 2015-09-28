'use strict';

var R = require('ramda');
var ejs = require('ejs');
var File = require('../util/file');
var CONST = require('../CONST');

module.exports = function getRoot(req, res) {
  var self = this;
  var p;

  if (self.assets['htmlErr']) {
    p = File.readFile(CONST.ERROR_TMPL)
      .then(function (tmpl) {
        return ejs.render(tmpl, {htmlErr: self.assets['htmlErr']});
      });
  } else {
    p = File.readFile(CONST.HTML_TMPL)
      .then(function (tmpl) {
        return ejs.render(tmpl, R.merge({fragment: self.assets['html']}, self.locals));
      });
  }

  p.then(res.send.bind(res));
};