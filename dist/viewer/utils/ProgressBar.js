'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodashStringTemplate = require('lodash/string/template');

var _lodashStringTemplate2 = _interopRequireDefault(_lodashStringTemplate);

var _lodashObjectMerge = require('lodash/object/merge');

var _lodashObjectMerge2 = _interopRequireDefault(_lodashObjectMerge);

var _lodashCollectionEach = require('lodash/collection/each');

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var ProgressBar = (function () {
  function ProgressBar(domElm) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ProgressBar);

    this._container = domElm;
    this._progressElm = null;

    this._defaultConfig = {
      visibility: 'hidden',
      progress: 0,
      unit: '%',
      text: 'Preparing 3D Preview ',
      progressText: 'Preparing 3D Preview'
    };

    this.template = (0, _lodashStringTemplate2['default'])('\n      <div class="viewer__progress-bar viewer__progress-bar--<%- visibility %>">\n        <div class="viewer__progress-bar__container">\n          <% if(progress > 0) { %>\n            <span class="viewer__progress-bar__text"><%- text %></span>\n            <span class="viewer__progress-bar__count"><%- progress %></span>\n            <span class="viewer__progress-bar__unit"><%- unit %></span>\n          <% } else { %>\n            <span class="viewer__progress-bar__text"><%- progressText %></span>\n          <% } %>\n        </div>\n      </div>\n    '.trim());

    this._config = (0, _lodashObjectMerge2['default'])({}, this._defaultConfig, config);
    this._updateProgress();
  }

  _createClass(ProgressBar, [{
    key: 'show',
    value: function show() {
      this._config.visibility = 'visible';
      if (this._progressElm.classList) {
        this._progressElm.classList.remove('viewer__progress-bar--hidden');
        this._progressElm.classList.add('viewer__progress-bar--visible');
      } else {
        this._updateProgress();
      }
    }
  }, {
    key: 'hide',
    value: function hide() {
      this._config.visibility = 'hidden';

      if (this._progressElm.classList) {
        this._progressElm.classList.add('viewer__progress-bar--hidden');
        this._progressElm.classList.remove('viewer__progress-bar--visible');
      } else {
        this._updateProgress();
      }
    }
  }, {
    key: '_updateProgress',
    value: function _updateProgress() {

      var elm = this.template(this._config);
      var domNodes = this._container.getElementsByClassName('viewer__progress-bar');

      if (domNodes.length > 0) {

        (0, _lodashCollectionEach2['default'])(domNodes, function (node) {
          if (node) {
            node.remove();
          }
        });

        this._progressElm = null;
      }

      var el = document.createElement('div');
      el.innerHTML = elm;

      this._container.appendChild(el.childNodes[0]);
      this._progressElm = elm;
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      var domElms = this._container.getElementsByClassName('viewer__progress-bar');

      (0, _lodashCollectionEach2['default'])(domElms, function (node) {
        node.remove();
      });
    }
  }, {
    key: 'progress',
    set: function set(progress) {

      if (progress) {
        this._config.progress = parseInt(progress, 10);
        this._updateProgress();
      }
    },
    get: function get() {
      return this._config.progress;
    }
  }]);

  return ProgressBar;
})();

exports['default'] = ProgressBar;
module.exports = exports['default'];