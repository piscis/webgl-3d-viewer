'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var ModelControls = (function () {
  function ModelControls(container) {
    var onData = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

    _classCallCheck(this, ModelControls);

    this.container = container;
    this._onData = onData;

    this._addListener();
  }

  _createClass(ModelControls, [{
    key: '_addListener',
    value: function _addListener() {
      var _this = this;

      this._dropListener = function (evt) {
        _this._onDrop(evt);
      };
      this._dragOverListener = function (evt) {
        return evt.preventDefault();
      };

      var container = this.container;
      container.addEventListener('drop', this._dropListener, false);

      // for Firefox
      container.addEventListener('dragover', this._dragOverListener, false);
    }
  }, {
    key: '_removeListener',
    value: function _removeListener() {

      var container = this.container;

      container.removeEventListener('drop', this._dropListener, false);
      container.removeEventListener('dragover', this._dragOverListener, false);
    }
  }, {
    key: '_onDrop',
    value: function _onDrop() {
      var _this2 = this;

      var evt = arguments.length <= 0 || arguments[0] === undefined ? { dataTransfer: { files: [] } } : arguments[0];

      evt.stopPropagation(); // Stops some browsers from redirecting.
      evt.preventDefault();

      var files = evt.dataTransfer.files;

      var onLoaded = function onLoaded(evt) {
        _this2._onData(evt.srcElement.result);
      };

      for (var i = 0; i < files.length; i++) {

        var f = files[i];

        // Read the File objects in this FileList.
        // console.log(f.name + " - " + f.type)
        if (/.*\.stl$/i.test(f.name)) {

          var reader = new FileReader();

          // Closure to capture the file information.
          reader.onloadend = onLoaded;

          reader.readAsArrayBuffer(f);
        }
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this._removeListener();
      this._onData = null;
    }
  }]);

  return ModelControls;
})();

exports['default'] = ModelControls;
module.exports = exports['default'];