'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodashArrayFirst = require('lodash/array/first');

var _lodashArrayFirst2 = _interopRequireDefault(_lodashArrayFirst);

var _lodashCollectionFilter = require('lodash/collection/filter');

var _lodashCollectionFilter2 = _interopRequireDefault(_lodashCollectionFilter);

var _blueimpMd5 = require('blueimp-md5');

var _blueimpMd52 = _interopRequireDefault(_blueimpMd5);

var _STLLoader = require('./STLLoader');

var _STLLoader2 = _interopRequireDefault(_STLLoader);

var ModelLoaderRegistry = (function () {
  function ModelLoaderRegistry() {
    _classCallCheck(this, ModelLoaderRegistry);
  }

  _createClass(ModelLoaderRegistry, [{
    key: 'load',
    value: function load(url) {
      var onLoad = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
      var onProgress = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];
      var onError = arguments.length <= 3 || arguments[3] === undefined ? function () {} : arguments[3];

      var _this = this;

      var onParseStart = arguments.length <= 4 || arguments[4] === undefined ? function () {} : arguments[4];
      var onParseEnd = arguments.length <= 5 || arguments[5] === undefined ? function () {} : arguments[5];

      var id = this._genId(url);
      var regEntry = this._findEntryById(id);

      if (regEntry) {
        var geometry = regEntry.geometry;
        geometry.registry = true;

        onParseStart();
        onLoad(regEntry.geometry);
        onParseEnd();
        onProgress({ loaded: 100, total: 100 });
      } else {

        var loader = new _STLLoader2['default']();

        loader.load(url, function (geometry) {

          geometry.registry = false;

          var RegistryItem = {
            id: id,
            geometry: geometry
          };

          _this.registry.push(RegistryItem);
          onLoad(geometry);
        }, onProgress, onError, onParseStart, onParseEnd);
      }
    }
  }, {
    key: 'parse',
    value: function parse(model) {

      var id = this._genId(model);
      var regEntry = this._findEntryById(id);
      var geometry = null;

      if (regEntry) {
        geometry = regEntry.geometry;
        geometry.registry = true;
      } else {

        var loader = new _STLLoader2['default']();
        var content = loader.parse(model);

        var RegistryItem = {
          id: id,
          geometry: content
        };

        this.registry.push(RegistryItem);
        geometry = content;
        geometry.registry = true;
      }

      return geometry;
    }
  }, {
    key: '_findEntryById',
    value: function _findEntryById(id) {
      var entry = (0, _lodashArrayFirst2['default'])((0, _lodashCollectionFilter2['default'])(this.registry, { id: id }));

      if (entry) {
        return Object.assign({}, entry);
      }
    }
  }, {
    key: '_genId',
    value: function _genId(base) {

      var id = '';

      if (base instanceof ArrayBuffer) {
        // ConvertBufferToBase64
        var bufferBase64 = btoa([].reduce.call(new Uint8Array(base), function (p, c) {
          return p + String.fromCharCode(c);
        }, ''));
        id = (0, _blueimpMd52['default'])(bufferBase64, 'arraybuffer');
      } else {
        id = (0, _blueimpMd52['default'])(base, 'url');
      }

      return id;
    }
  }, {
    key: 'registry',
    get: function get() {
      return ModelLoaderRegistry.modelRegistry;
    }
  }]);

  return ModelLoaderRegistry;
})();

exports['default'] = ModelLoaderRegistry;

ModelLoaderRegistry.modelRegistry = [];
module.exports = exports['default'];