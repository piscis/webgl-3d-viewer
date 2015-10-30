'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodashMathMax = require('lodash/math/max');

var _lodashMathMax2 = _interopRequireDefault(_lodashMathMax);

var _lodashObjectMerge = require('lodash/object/merge');

var _lodashObjectMerge2 = _interopRequireDefault(_lodashObjectMerge);

var _lodashArrayRest = require('lodash/array/rest');

var _lodashArrayRest2 = _interopRequireDefault(_lodashArrayRest);

var _lodashCollectionEach = require('lodash/collection/each');

var _lodashCollectionEach2 = _interopRequireDefault(_lodashCollectionEach);

var _utilsProgressBar = require('./../utils/ProgressBar');

var _utilsProgressBar2 = _interopRequireDefault(_utilsProgressBar);

var _loadersSTLLoader = require('./../loaders/STLLoader');

var _loadersSTLLoader2 = _interopRequireDefault(_loadersSTLLoader);

var _controlsModelControls = require('./../controls/ModelControls');

var _controlsModelControls2 = _interopRequireDefault(_controlsModelControls);

var _controlsDragDropControls = require('./../controls/DragDropControls');

var _controlsDragDropControls2 = _interopRequireDefault(_controlsDragDropControls);

var Viewer = (function () {
  function Viewer(domElm) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Viewer);

    // Setup container
    this.container = Viewer._setupContainer(domElm);

    this.scene = null;
    this.camera = null;
    this.loader = null;
    this.model = null;
    this.controls = null;
    this.plane = null;
    this.axisHelper = null;
    this.sphere = null;
    this.boundingBox = null;
    this.modelWireframe = null;
    this.stats = null;
    this.group = null;
    this.config = {};
    this.progressBar = null;
    this.loaderPath = null;
    this.loaderContent = null;

    // Default viewer configuration
    this.defaultConfig = {
      wireframe: false,
      plane: false,
      boundingBox: false,
      sphere: false,
      axis: false,
      stats: null,
      autoRotate: false,
      dragDrop: false,
      material: true,
      startupAnimation: false,
      fudge: 1.0,
      progressBar: {}

    };

    // Prepare config
    this.config = (0, _lodashObjectMerge2['default'])(this.config, this.defaultConfig, config);

    // Prepare stats
    if (this.config.stats) {
      this.stats = this.config.stats;
    }

    // Init progress
    this.progressBar = new _utilsProgressBar2['default'](this.container, this.config.progressBar);
    this.progressBar.show();

    // Loading state
    this.loaded = false;

    // Listener
    this._resizeListener = null;
  }

  _createClass(Viewer, [{
    key: 'load',
    value: function load(path, cb) {
      var _this = this;

      if (this.loaderPath === path) {
        return false;
      }

      this._unload();

      // Setup listener
      this._setupListener();

      if (!this.progressBar) {
        this.progressBar = new _utilsProgressBar2['default'](this.container);
      }

      var callb = cb || function () {};
      var loader = new _loadersSTLLoader2['default']();
      var onLoadCB = function onLoadCB(geometry) {

        _this.loaderPath = path;
        _this._initializeGeometry(geometry, callb);
      };

      var onProgressCB = function onProgressCB(item) {

        if (item) {

          var progress = Math.round(100 * item.loaded / item.total);

          if (progress < 0) {
            progress = 0;
          } else if (progress > 100) {
            progress = 100;
          }

          if (_this.progressBar) {
            _this.progressBar.progress = progress;
          }

          if (progress === 100) {

            setTimeout(function () {

              if (_this.progressBar) {
                _this.progressBar.hide();
              }
            }, 1500);
          }
        }
      };

      var onErrorCB = function onErrorCB() {

        if (_this.progressBar) {
          _this.progressBar.hide();
        }
      };

      if (this.progressBar) {
        this.progressBar.show();
      }

      this.loader = loader.load(path, onLoadCB, onProgressCB, onErrorCB);
    }
  }, {
    key: 'parse',
    value: function parse(fileContent, cb) {

      if (this.loaded) {
        this._unload();
        // Setup listener
        this._setupListener();
      }

      this.loaderContent = fileContent;

      var callb = cb || function () {};
      var loader = new THREE.STLLoader();
      var geometry = loader.parse(fileContent);

      if (this.progressBar) {
        this.progressBar.hide();
      }

      this._initializeGeometry(geometry, callb);
    }
  }, {
    key: 'enablePlane',
    value: function enablePlane() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.plane;

      if (cfgState !== state) {

        if (this.plane) {
          this.group.remove(this.plane);
          this.plane = null;
        }

        if (state === true) {
          this._setupPlane();
        }

        this.config.plane = state;
      }

      return this.config.plane;
    }
  }, {
    key: 'enableModelWireframe',
    value: function enableModelWireframe() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.wireframe;

      if (state !== cfgState) {

        if (this.modelWireframe) {
          this.group.remove(this.modelWireframe);
          this.modelWireframe = null;
        }

        if (state === true) {
          this._setupModelWireframe();
        }
      }

      return this.config.wireframe;
    }
  }, {
    key: 'enableAxis',
    value: function enableAxis() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.axis;

      if (state !== cfgState) {

        if (this.axisHelper) {
          this.group.remove(this.axisHelper);
          this.axisHelper = null;
        }

        if (state === true) {
          this._setupAxisHelper();
        }

        this.config.state = state;
      }
      return this.config.axis;
    }
  }, {
    key: 'enableSphere',
    value: function enableSphere() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.sphere;

      if (state !== cfgState) {

        if (this.sphere) {
          this.group.remove(this.sphere);
          this.sphere = null;
        }

        if (state === true) {
          this._setupSphereGrid();
        }
        this.config.sphere = state;
      }

      return this.config.sphere;
    }
  }, {
    key: 'enableBoundingBox',
    value: function enableBoundingBox() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.boundingBox;

      if (cfgState !== state) {

        if (this.boundingBox) {
          this.group.remove(this.boundingBox);
          this.boundingBox = null;
        }

        if (state === true) {
          this._setupBoundingBox();
        }

        this.config.boundingBox = state;
      }

      return this.config.boundingBox;
    }
  }, {
    key: 'enableAutoRotate',
    value: function enableAutoRotate() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var cfgState = this.config.autoRotate;

      if (this.model && cfgState !== state) {
        this.controls.autoRotate = state;
        this.config.autoRotate = state;
      }

      return this.config.autoRotate;
    }
  }, {
    key: 'enableMaterial',
    value: function enableMaterial() {
      var state = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      if (this.model && state !== this.config.material) {

        if (state) {
          this.group.add(this.model);
        } else {
          this.group.remove(this.model);
        }

        this.config.material = state;
      }

      return this.config.material;
    }
  }, {
    key: 'setStats',
    value: function setStats(stats) {
      this.stats = stats;
    }
  }, {
    key: 'setModelColor',
    value: function setModelColor(color) {

      if (this.model && color) {
        this.model.material.color = color;
      }
    }
  }, {
    key: 'setModelColorByHexcode',
    value: function setModelColorByHexcode(hexcode) {

      if (hexcode) {
        var colorValue = hexcode.replace('#', '0x');
        var color = new THREE.Color(parseInt(colorValue, 16));
        this.setModelColor(color);
      }
    }
  }, {
    key: 'render',
    value: function render() {

      // horizontal rotation
      if (!this.group) {
        return;
      }

      this.renderer.render(this.scene, this.camera);
    }
  }, {
    key: 'animate',
    value: function animate(time) {
      var _this2 = this;

      if (this.stats) {
        this.stats.begin();
      }

      this.animationId = requestAnimationFrame(function (time) {
        _this2.animate(time);
      });

      if (this.controls) {
        this.controls.update(time);
      }

      this.render();

      if (this.stats) {
        this.stats.end();
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {

      this._unload();
      this.container.remove();
    }
  }, {
    key: '_setupCamera',
    value: function _setupCamera() {

      var height = this.container.clientHeight;
      var width = this.container.clientWidth;
      var camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);

      if (this.model) {

        var geometry = this.model.geometry;
        geometry.computeBoundingSphere();

        var g = this.model.geometry.boundingSphere.radius;
        var dist = g * 3;

        // fudge factor so you can see the boundaries
        camera.position.set(0, 0, dist * this.config.fudge);
      }

      this.camera = camera;
    }
  }, {
    key: '_setupScene',
    value: function _setupScene() {

      var scene = new THREE.Scene();
      var group = new THREE.Group();

      this.scene = scene;
      this.group = group;

      this.scene.add(this.group);
    }
  }, {
    key: '_setupControls',
    value: function _setupControls() {

      this._setupCamera();

      if (this.model) {

        if (this.controls) {
          this.controls.destroy();
          this.controls = null;
        }

        this.controls = new _controlsModelControls2['default'](this.container, this.camera, this.group);
      }
    }
  }, {
    key: '_setupRenderer',
    value: function _setupRenderer() {

      var height = this.container.clientHeight;
      var width = this.container.clientWidth;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      var devicePixelRatio = window.devicePixelRatio || 1;

      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(devicePixelRatio);
      renderer.setSize(width, height);

      renderer.gammaInput = true;
      renderer.gammaOutput = true;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.cullFace = THREE.CullFaceBack;

      this.container.appendChild(renderer.domElement);

      this.renderer = renderer;
    }
  }, {
    key: '_setupLights',
    value: function _setupLights() {

      // Ambient
      this.scene.add(new THREE.AmbientLight(0xcccccc));

      // Light 3
      var light = new THREE.SpotLight(0xcccccc);
      light.angle = 1.7;
      light.position.set(100, 500, 100);

      var target = new THREE.Object3D();
      target.position.set(0, 0, 0);
      light.target = target;

      this.scene.add(light);
    }
  }, {
    key: '_setupAxisHelper',
    value: function _setupAxisHelper() {

      if (this.model) {

        if (this.axisHelper) {
          this.group.remove(this.axisHelper);
        }

        // Get max dimention and add 50% overlap for plane
        // with a gutter of 10
        var geometry = this.model.geometry;
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        var maxDimension = (0, _lodashMathMax2['default'])(this.model.geometry.boundingBox.max);
        maxDimension = Math.ceil(~ ~(maxDimension * 1.50) / 10) * 10;

        var axisHelper = new THREE.AxisHelper(maxDimension);

        // reset center point
        axisHelper.position.x = 0;
        axisHelper.position.y = 0;
        axisHelper.position.z = 0;

        this.axisHelper = axisHelper;
        this.group.add(this.axisHelper);
        this.config.axis = true;
      }
    }
  }, {
    key: '_setupPlane',
    value: function _setupPlane() {

      if (this.model) {

        if (this.plane) {
          this.group.remove(this.plane);
        }

        // Getmax dimention and add 10% overlap for plane
        // with a gutter of 10
        var geometry = this.model.geometry;
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        var maxDimension = (0, _lodashMathMax2['default'])(this.model.geometry.boundingBox.max);
        maxDimension = Math.ceil(~ ~(maxDimension * 1.10) / 10) * 10;

        var plane = new THREE.GridHelper(maxDimension, 10);

        // reset center point
        var box = new THREE.Box3().setFromObject(plane);
        box.center(plane.position);
        plane.position.multiplyScalar(-1);

        plane.position.y = geometry.boundingSphere.center.y * -1;

        this.plane = plane;
        this.group.add(this.plane);
        this.config.plane = true;
      }
    }
  }, {
    key: '_setupSphereGrid',
    value: function _setupSphereGrid() {

      if (this.model) {

        if (this.sphere) {
          this.group.remove(this.sphere);
        }

        var geometry = this.model.geometry;
        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        var _model$geometry$boundingBox$max = this.model.geometry.boundingBox.max;
        var x = _model$geometry$boundingBox$max.x;
        var y = _model$geometry$boundingBox$max.y;
        var z = _model$geometry$boundingBox$max.z;

        var d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        var maxDimension = Math.ceil(~ ~(d * 0.60) / 10) * 10;

        var geometrySphere = new THREE.SphereGeometry(maxDimension, 10, 10);
        var material = new THREE.MeshBasicMaterial({ color: 0x4d635d, wireframe: true });
        var sphere = new THREE.Mesh(geometrySphere, material);

        // reset center point
        var box = new THREE.Box3().setFromObject(sphere);
        box.center(sphere.position);
        sphere.position.multiplyScalar(-1);

        geometrySphere.computeBoundingBox();
        geometrySphere.computeBoundingSphere();

        sphere.position.x = geometrySphere.boundingSphere.center.x;
        sphere.position.y = geometrySphere.boundingSphere.center.y;
        sphere.position.z = geometrySphere.boundingSphere.center.z;

        this.sphere = sphere;
        this.group.add(this.sphere);
        this.config.sphere = true;
      }
    }
  }, {
    key: '_setupBoundingBox',
    value: function _setupBoundingBox() {

      if (this.model) {

        if (this.boundingBox) {
          this.group.remove(this.boundingBox);
        }

        var wireframe = new THREE.WireframeGeometry(this.model.geometry);
        var line = new THREE.LineSegments(wireframe);

        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;

        // reset center point
        var box = new THREE.Box3().setFromObject(line);
        box.center(line.position);
        line.position.multiplyScalar(-1);

        this.boundingBox = new THREE.BoxHelper(line);

        this.group.add(this.boundingBox);
        this.config.boundingBox = true;
      }
    }
  }, {
    key: '_unload',
    value: function _unload() {
      var _this3 = this;

      cancelAnimationFrame(this.animationId);

      if (this.scene !== null) {

        var objsToRemoveFromGroup = (0, _lodashArrayRest2['default'])(this.group.children, 1);
        (0, _lodashCollectionEach2['default'])(objsToRemoveFromGroup, function (object) {
          _this3.group.remove(object);
        });

        var objsToRemoveFromScene = (0, _lodashArrayRest2['default'])(this.scene.children, 1);
        (0, _lodashCollectionEach2['default'])(objsToRemoveFromScene, function (object) {
          _this3.scene.remove(object);
        });
      }

      this.scene = null;
      this.group = null;
      this.camera = null;
      this.loader = null;
      this.model = null;
      this.controls = null;
      this.plane = null;
      this.axisHelper = null;
      this.renderer = null;
      this.sphere = null;
      this.animationId = null;
      this.boundingBox = null;
      this.modelWireframe = null;
      this.loaderPath = null;
      this.loaderContent = null;

      // Remove progressBar
      if (this.progressBar) {
        this.progressBar.destroy();
        this.progressBar = null;
      }

      // Remove controls
      if (this.controls) {
        this.controls.destroy();
        this.controls = null;
      }

      // DragDrop controls
      if (this.ddControls) {
        this.ddControls.destroy();
        this.ddControls = null;
      }

      if (this.container !== null) {

        // Clear container
        var elem = this.container;

        while (elem.lastChild) {
          elem.removeChild(elem.lastChild);
        }
      }

      this.loaded = false;
      this.loaderPath = null;

      // Remove listener
      window.removeEventListener('resize', this._resizeListener, false);
      this._resizeListener = null;

      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
    }
  }, {
    key: '_setupModelWireframe',
    value: function _setupModelWireframe() {

      if (this.model) {

        if (this.modelWireframe) {
          this.group.remove(this.modelWireframe);
        }

        var material = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 20, wireframe: true });

        var mesh = this.model.clone();
        mesh.material = material;
        this.modelWireframe = mesh;
        this.group.add(mesh);
        this.config.wireframe = true;
      }
    }
  }, {
    key: '_setupListener',
    value: function _setupListener() {
      var _this4 = this;

      this._resizeListener = function (evt) {
        _this4._onWindowResize(evt);
      };

      window.addEventListener('resize', this._resizeListener, false);

      if (this.config.dragDrop === true) {
        this.ddControls = new _controlsDragDropControls2['default'](this.container, function (result) {
          _this4.parse(result);
        });
      }
    }
  }, {
    key: '_restoreConfig',
    value: function _restoreConfig() {
      var _config = this.config;
      var wireframe = _config.wireframe;
      var plane = _config.plane;
      var boundingBox = _config.boundingBox;
      var sphere = _config.sphere;
      var axis = _config.axis;

      if (wireframe) {
        this._setupModelWireframe();
      }
      if (plane) {
        this._setupPlane();
      }
      if (boundingBox) {
        this._setupBoundingBox();
      }
      if (sphere) {
        this._setupSphereGrid();
      }
      if (axis) {
        this._setupAxisHelper();
      }
    }
  }, {
    key: '_initializeGeometry',
    value: function _initializeGeometry(geometry, cb) {
      var _this5 = this;

      var callb = cb || function () {};
      this._setupScene();
      this._setupRenderer();
      this._setupLights();

      var n = geometry;
      n.computeBoundingSphere();
      n.computeBoundingBox();

      n.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

      var material = new THREE.MeshPhongMaterial({ color: 0xb3b3b3, specular: 0x111111, shininess: 20 });
      var mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = material;

      // reset center point
      var box = new THREE.Box3().setFromObject(mesh);
      box.center(mesh.position);
      mesh.position.multiplyScalar(-1);

      this.model = mesh;

      if (this.config.material) {
        this.group.add(this.model);
      }

      this.scene.updateMatrixWorld();

      this._setupControls();

      this._restoreConfig();

      requestAnimationFrame(function (time) {
        _this5.animate(time);
        _this5.loaded = true;
        callb();
      });
    }
  }, {
    key: '_onWindowResize',
    value: function _onWindowResize() {

      if (this.container) {

        var height = this.container.clientHeight;
        var width = this.container.clientWidth;

        if (this.camera) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
        }

        if (this.renderer) {
          this.renderer.setSize(width, height);
        }
      }
    }
  }], [{
    key: '_setupContainer',
    value: function _setupContainer(domElm) {

      var vElm = document.createElement('div');
      vElm.style.height = '100%';
      vElm.style.width = '100%';
      domElm.appendChild(vElm);

      return vElm;
    }
  }]);

  return Viewer;
})();

exports['default'] = Viewer;
module.exports = exports['default'];