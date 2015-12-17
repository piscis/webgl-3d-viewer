'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Viewer = require('./Viewer');

var _Viewer2 = _interopRequireDefault(_Viewer);

var ViewerFactory = (function () {
  function ViewerFactory(domNode) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ViewerFactory);

    this._domNode = domNode;
    this._config = config;
    this._viewer = null;
  }

  _createClass(ViewerFactory, [{
    key: 'zoomIn',
    value: function zoomIn() {
      var scale = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];

      this.viewer.controls.zoomIn(scale);
    }
  }, {
    key: 'zoomOut',
    value: function zoomOut(scale) {
      this.viewer.controls.zoomOut(scale);
    }
  }, {
    key: 'togglePlane',
    value: function togglePlane() {
      var viewer = this.viewer;
      return viewer.enablePlane(!viewer.config.plane);
    }
  }, {
    key: 'toggleModelWireframe',
    value: function toggleModelWireframe() {
      var viewer = this.viewer;
      return viewer.enableModelWireframe(!viewer.config.wireframe);
    }
  }, {
    key: 'toggleAxis',
    value: function toggleAxis() {
      var viewer = this.viewer;
      return viewer.enableAxis(!viewer.config.axis);
    }
  }, {
    key: 'toggleSphere',
    value: function toggleSphere() {
      var viewer = this.viewer;
      return viewer.enableSphere(!viewer.config.sphere);
    }
  }, {
    key: 'toggleBoundingBox',
    value: function toggleBoundingBox() {
      var viewer = this.viewer;
      return viewer.enableBoundingBox(!viewer.config.boundingBox);
    }
  }, {
    key: 'toggleAutoRotate',
    value: function toggleAutoRotate() {
      var viewer = this.viewer;
      return viewer.enableAutoRotate(!viewer.config.autoRotate);
    }
  }, {
    key: 'toggleMaterial',
    value: function toggleMaterial() {
      var viewer = this.viewer;
      return viewer.enableMaterial(!viewer.config.material);
    }
  }, {
    key: 'setModelColorByHexcode',
    value: function setModelColorByHexcode(hexcode) {
      return this.viewer.setModelColorByHexcode(hexcode);
    }
  }, {
    key: 'load',
    value: function load(path, cb) {
      return this.viewer.load(path, cb);
    }
  }, {
    key: 'parse',
    value: function parse(content, cb) {
      return this.viewer.parse(content, cb);
    }
  }, {
    key: 'reload',
    value: function reload(cb) {

      var path = this.viewer.loaderPath;
      var content = this.viewer.loaderContent;
      var config = this.viewer.config;

      this.viewer.destroy();
      this._config = config;
      this._viewer = undefined;

      if (content) {
        this.viewer.parse(content, cb);
      } else if (path) {
        this.viewer.load(path, cb);
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      if (this._viewer) {
        this._viewer.destroy();
      }
      this._viewer = undefined;
      this._domNode = null;
      this._config = null;
      return null;
    }
  }, {
    key: 'viewer',
    get: function get() {

      if (!this._viewer) {
        this._viewer = new _Viewer2['default'](this._domNode, this._config);
      }

      return this._viewer;
    }
  }, {
    key: 'zoom',
    get: function get() {
      return this.viewer.zoom;
    },
    set: function set(val) {
      this.viewer.zoom = val;
    }
  }]);

  return ViewerFactory;
})();

exports['default'] = ViewerFactory;
module.exports = exports['default'];