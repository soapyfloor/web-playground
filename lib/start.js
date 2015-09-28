'use strict';

var assert = require('assert');
var express = require('express');
var Observable = require('rx').Observable;
var R = require('ramda');
var Assets = require('./util/Assets');
var File = require('./util/File');
var Playground = require('./util/Playground');
var ServeAssets = require('./ServeAssets').ServeAssets;

var CONST = require('../lib/CONST');

function assertCssBase(base) {
  assert(
    ['reset', 'normalize', null].indexOf(base) > -1,
    'css.base can only be "reset" or "normalize"');
}

var getBaseCss = R.pipe(R.path(['css', 'base']), R.defaultTo(null), R.tap(assertCssBase));
var getExternalCss = R.pipe(R.path(['css', 'external']), R.defaultTo([]));
var getExternalJs = R.pipe(R.path(['js', 'external']), R.defaultTo([]));

module.exports = function start(_opts) {
  var opts = R.merge({}, CONST.WPG_DEFAULT_OPTS, _opts);

  var serveAssets = new ServeAssets();

  var app = express();
  app.use(serveAssets.router);
  app.listen(opts.port);

  var bs = require('browser-sync').create();
  bs.init({
    proxy: 'http://localhost:' + opts.port
  });

  var getHtmlExts = Assets.extensionsForAsset('html');
  var getHtmlRenderer = Assets.rendererForAsset('html');

  var getJsExts = Assets.extensionsForAsset('js');
  var getJsRenderer = Assets.rendererForAsset('js');

  var getCssExts = Assets.extensionsForAsset('css');
  var getCssRenderer = Assets.rendererForAsset('css');

  File.watch('playground.*')
    .flatMap(Playground.parsePlaygroundFile)
    .doOnNext(function (playground) {
      serveAssets.locals = {
        title: playground.title,
        cssBase: getBaseCss(playground),
        stylesheets: getExternalCss(playground),
        scripts: getExternalJs(playground),
      };
    })
    .map(function (playground) {
      var htmlSrc = File.watch('html.{' + getHtmlExts(playground).join(',') + '}')
        .flatMap(File.readFile)
        .flatMap(getHtmlRenderer(playground))
        .doOnNext(serveAssets.updateAsset('html').bind(serveAssets));

      var jsSrc = File.watch('js.{' + getJsExts(playground).join(',') + '}')
        .flatMap(File.readFile)
        .flatMap(getJsRenderer(playground))
        .doOnNext(serveAssets.updateAsset('js').bind(serveAssets));

      var cssSrc = File.watch('css.{' + getCssExts(playground).join(',') + '}')
        .flatMap(File.readFile)
        .flatMap(getCssRenderer(playground))
        .doOnNext(serveAssets.updateAsset('css').bind(serveAssets));

      return Observable.combineLatest(htmlSrc, jsSrc, cssSrc);
    })
    .switch()
    .subscribeOnNext(bs.reload.bind(bs));
};