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

var _utilsDetector = require('./utils/Detector');

var _utilsDetector2 = _interopRequireDefault(_utilsDetector);

var _utilsProgressBar = require('./utils/ProgressBar');

var _utilsProgressBar2 = _interopRequireDefault(_utilsProgressBar);

var _loadersSTLLoader = require('./loaders/STLLoader');

var _loadersSTLLoader2 = _interopRequireDefault(_loadersSTLLoader);

var _controlsOrbitControls = require('./controls/OrbitControls');

var _controlsOrbitControls2 = _interopRequireDefault(_controlsOrbitControls);

var Viewer = (function () {
  function Viewer(domElm) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Viewer);

    this.container = domElm;

    this.scene = null;
    this.camera = null;
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

    // Default configuration params
    this.controlsConfigDefault = {

      targetRotationX: 0,
      targetRotationOnMouseDownX: 0,

      targetRotationY: 0,
      targetRotationOnMouseDownY: 0,

      mouseX: 0,
      mouseXOnMouseDown: 0,

      mouseY: 0,
      mouseYOnMouseDown: 0,

      windowHalfX: window.innerWidth / 2,
      windowHalfY: window.innerHeight / 2,

      finalRotationY: null
    };

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
      material: true
    };

    // Prepare config
    this.config = (0, _lodashObjectMerge2['default'])(this.config, this.defaultConfig, config);
    this.controlsConfig = (0, _lodashObjectMerge2['default'])({}, this.controlsConfigDefault);

    if (this.config.stats) {
      this.stats = this.config.stats;
    }

    // Loading state
    this.loaded = false;

    // Listener
    this._resizeListener = null;
    this._dropListener = null;
    this._dragOverListener = null;

    // Setup listener
    this._setupListener();
  }

  _createClass(Viewer, [{
    key: 'load',
    value: function load(path, cb) {
      var _this = this;

      if (this.loaded) {
        this._unload();
      }

      if (!this.progressBar) {
        this.progressBar = new _utilsProgressBar2['default'](this.container);
        window.progress = this.progressBar;
      }

      cb = cb || function () {};
      var loader = new THREE.STLLoader();
      var onLoadCB = function onLoadCB(geometry) {
        _this._initializeGeometry(geometry, cb);
      };

      var onProgressCB = function onProgressCB(item, loaded, total) {

        if (item) {

          var progress = Math.round(100 * item.loaded / item.total);

          if (progress < 0) {
            progress = 0;
          } else if (progress > 100) {
            progress = 100;
          }

          _this.progressBar.progress = progress;

          if (progress == 100) {
            setTimeout(function () {
              _this.progressBar.hide();
            }, 1500);
          }
        }
      };

      var onErrorCB = function onErrorCB() {
        _this.progressBar.hide();
      };

      this.progressBar.show();

      loader.load(path, onLoadCB, onProgressCB, onErrorCB);
    }
  }, {
    key: 'parse',
    value: function parse(fileContent, cb) {

      if (this.loaded) {
        this._unload();
      }

      cb = cb || function () {};
      var loader = new THREE.STLLoader();
      var geometry = loader.parse(fileContent);
      this._initializeGeometry(geometry, cb);
    }
  }, {
    key: 'togglePlane',
    value: function togglePlane() {

      if (this.plane) {
        this.group.remove(this.plane);
        this.plane = null;
        this.config.plane = false;
      } else {
        this._setupPlane();
      }
    }
  }, {
    key: 'toggleModelWireframe',
    value: function toggleModelWireframe() {

      if (this.modelWireframe) {
        this.group.remove(this.modelWireframe);
        this.modelWireframe = null;
        this.config.wireframe = false;
      } else {
        this._setupModelWireframe();
      }
    }
  }, {
    key: 'toggleAxis',
    value: function toggleAxis() {

      if (this.axisHelper) {
        this.group.remove(this.axisHelper);
        this.axisHelper = null;
        this.config.axis = false;
      } else {
        this._setupAxisHelper();
      }
    }
  }, {
    key: 'toggleSphere',
    value: function toggleSphere() {

      if (this.sphere) {
        this.group.remove(this.sphere);
        this.sphere = null;
        this.config.sphere = false;
      } else {
        this._setupSphereGrid();
      }
    }
  }, {
    key: 'toggleBoundingBox',
    value: function toggleBoundingBox() {

      if (this.boundingBox) {
        this.group.remove(this.boundingBox);
        this.boundingBox = null;
        this.config.boundingBox = false;
      } else {
        this._setupBoundingBox();
      }
    }
  }, {
    key: 'toggleAutoRotate',
    value: function toggleAutoRotate() {

      if (this.model) {
        this.controls.autoRotate = !this.controls.autoRotate;
        this.config.autoRotate = this.controls.autoRotate;
      }
    }
  }, {
    key: 'toggleMaterial',
    value: function toggleMaterial() {

      if (this.model) {

        if (this.config.material) {
          this.group.remove(this.model);
          this.config.material = false;
        } else {
          this.group.add(this.model);
          this.config.material = true;
        }
      }
    }
  }, {
    key: 'setStats',
    value: function setStats(stats) {
      this.stats = stats;
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
        var dist = g * 4;
        var center = geometry.boundingSphere.center;

        camera.position.set(0, 190, dist * 1.1); // fudge factor so you can see the boundaries
        camera.lookAt(center.x, center.y, center.z);

        //window.camera = camera;
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
      var _this2 = this;

      this._setupCamera();

      if (this.model) {

        var geometry = this.model.geometry;
        geometry.computeBoundingSphere();
        var center = geometry.boundingSphere.center;

        this.camera.lookAt(center);

        var container = this.container;
        container.removeEventListener('mouseup', this._mouseUpListener, false);
        container.removeEventListener('mousemove', this._mouseMoveListener, false);
        container.removeEventListener('mousedown', this._mouseDownListener, false);
        container.removeEventListener('touchstart', this._touchStartListener, false);
        container.removeEventListener('touchmove', this._touchMoveListener, false);

        this.controlsConfig = (0, _lodashObjectMerge2['default'])({}, this.controlsConfigDefault);

        // Controls
        this._mouseDownListener = function (e) {
          _this2._onMouseDown(e);
        };
        this._mouseMoveListener = function (e) {
          _this2._onMouseMove(e);
        };
        this._mouseUpListener = function (e) {
          _this2._onMouseUp(e);
        };
        this._mouseOutListener = function (e) {
          _this2._onMouseOut(e);
        };
        this._touchStartListener = function (e) {
          _this2._onTouchStart(e);
        };
        this._touchEndListener = function (e) {
          _this2._onTouchEnd(e);
        };
        this._touchMoveListener = function (e) {
          _this2._onTouchMove(e);
        };

        // Mouse / Touch events
        container.addEventListener('mousedown', this._mouseDownListener, false);
        container.addEventListener('touchstart', this._touchStartListener, false);
        container.addEventListener('touchmove', this._touchMoveListener, false);

        var controls = new THREE.OrbitControls(this.camera, this.container);

        controls.enableKeys = false;
        controls.enableRotate = false;
        controls.enablePan = false;
        controls.enableDamping = false;
        controls.enableZoom = true;

        var geometry = this.model.geometry;
        geometry.computeBoundingSphere();
        controls.target.set(0, 0, 0);

        var center = geometry.boundingSphere.center;
        controls.target.set(center.x, center.y, center.z);

        this.controls = controls;
      }
    }
  }, {
    key: '_setupRenderer',
    value: function _setupRenderer() {

      var height = this.container.clientHeight;
      var width = this.container.clientWidth;
      var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio);
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
        var n = this.model.geometry;
        n.computeBoundingBox();
        n.computeBoundingSphere();

        var maxDimension = (0, _lodashMathMax2['default'])(this.model.geometry.boundingBox.max);
        maxDimension = Math.ceil(~ ~(maxDimension * 1.50) / 10) * 10;

        var axisHelper = new THREE.AxisHelper(maxDimension);
        axisHelper.position.x = n.boundingSphere.center.x;
        axisHelper.position.y = 0;
        axisHelper.position.z = n.boundingSphere.center.z;

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
        var n = this.model.geometry;
        n.computeBoundingBox();
        n.computeBoundingSphere();

        var maxDimension = (0, _lodashMathMax2['default'])(this.model.geometry.boundingBox.max);
        maxDimension = Math.ceil(~ ~(maxDimension * 1.10) / 10) * 10;

        var plane = new THREE.GridHelper(maxDimension, 10);
        plane.position.x = n.boundingSphere.center.x;
        plane.position.y = 0;
        plane.position.z = n.boundingSphere.center.z;

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

        var n = this.model.geometry;
        n.computeBoundingBox();
        n.computeBoundingSphere();

        var _model$geometry$boundingBox$max = this.model.geometry.boundingBox.max;
        var x = _model$geometry$boundingBox$max.x;
        var y = _model$geometry$boundingBox$max.y;
        var z = _model$geometry$boundingBox$max.z;

        var d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
        var maxDimension = Math.ceil(~ ~(d * 0.60) / 10) * 10;

        var geometry = new THREE.SphereGeometry(maxDimension, 10, 10);
        var material = new THREE.MeshBasicMaterial({ color: 0x4d635d, wireframe: true });
        var sphere = new THREE.Mesh(geometry, material);

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        sphere.position.x = n.boundingSphere.center.x;
        sphere.position.y = geometry.boundingSphere.radius / 2;
        sphere.position.z = n.boundingSphere.center.z;

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
        line.position.x = 0;

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

      if (this.scene != null) {

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
      this.model = null;
      this.controls = null;
      this.plane = null;
      this.axisHelper = null;
      this.renderer = null;
      this.sphere = null;
      this.animationId = null;
      this.boundingBox = null;
      this.modelWireframe = null;

      if (this.container != null) {

        // Clear container
        var elem = this.container;

        while (elem.lastChild) {
          elem.removeChild(elem.lastChild);
        }
      }

      this.loaded = false;

      // Remove listener
      window.removeEventListener('resize', this._resizeListener, false);
      this._resizeListener = null;
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

      this._resizeListener = function (ev) {
        _this4._onWindowResize(ev);
      };
      this._dropListener = function (ev) {
        _this4._onDrop(ev);
      };
      this._dragOverListener = function (ev) {
        _this4._onDragOver(ev);
      };

      window.addEventListener('resize', this._resizeListener, false);

      if (this.config.dragDrop === true) {
        var dropZone = this.container;
        dropZone.addEventListener('drop', this._dropListener, false);

        // for Firefox
        dropZone.addEventListener('dragover', this._dragOverListener, false);
      }
    }
  }, {
    key: '_restoreConfig',
    value: function _restoreConfig() {
      if (this.config.wireframe) {
        this._setupModelWireframe();
      }
      if (this.config.plane) {
        this._setupPlane();
      }
      if (this.config.boundingBox) {
        this._setupBoundingBox();
      }
      if (this.config.sphere) {
        this._setupSphereGrid();
      }
      if (this.config.axis) {
        this._setupAxisHelper();
      }
    }
  }, {
    key: '_initializeGeometry',
    value: function _initializeGeometry(geometry, cb) {

      cb = cb || function () {};
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
      this.model = mesh;

      if (this.config.material) {
        this.group.add(this.model);
      }

      this._setupControls();

      this._restoreConfig();

      this.animate();
      this.loaded = true;
      cb();
    }
  }, {
    key: '_onWindowResize',
    value: function _onWindowResize() {
      var _this5 = this;

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

        ['controlsConfig', 'controlsConfigDefault'].forEach(function (key) {

          if (_this5.hasOwnProperty(key)) {
            _this5[key].windowHalfX = window.innerWidth / 2;
            _this5[key].windowHalfY = window.innerHeight / 2;
          }
        });
      }
    }
  }, {
    key: '_onDrop',
    value: function _onDrop(e) {

      var self = this;

      e.stopPropagation(); // Stops some browsers from redirecting.
      e.preventDefault();

      var files = e.dataTransfer.files;

      for (var i = 0, f; f = files[i]; i++) {
        // Read the File objects in this FileList.
        //console.log(f.name + " - " + f.type)

        if (!/.*\.stl$/i.test(f.name)) {
          alert('File type not recognised.');
          continue;
        }

        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onloadend = function (e) {

          self.parse(e.srcElement.result);
        };

        reader.readAsArrayBuffer(f);
      }
    }
  }, {
    key: '_onDragOver',
    value: function _onDragOver(e) {
      e.preventDefault();
    }
  }, {
    key: '_onMouseDown',
    value: function _onMouseDown(e) {

      e.preventDefault();

      var container = this.container;
      var cfg = this.controlsConfig;

      if (container) {

        container.addEventListener('mousemove', this._mouseMoveListener, false);
        container.addEventListener('mouseup', this._mouseUpListener, false);
        container.addEventListener('mouseout', this._mouseOutListener, false);

        cfg.mouseXOnMouseDown = e.clientX - cfg.windowHalfX;
        cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

        cfg.mouseYOnMouseDown = e.clientY - cfg.windowHalfY;
        cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
      }
    }
  }, {
    key: '_onMouseMove',
    value: function _onMouseMove(e) {

      var cfg = this.controlsConfig;

      cfg.mouseX = e.clientX - cfg.windowHalfX;
      cfg.mouseY = e.clientY - cfg.windowHalfY;

      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.02;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + (cfg.mouseX - cfg.mouseXOnMouseDown) * 0.02;
    }
  }, {
    key: '_onMouseUp',
    value: function _onMouseUp(e) {

      var container = this.container;
      var cfg = this.controlsConfig;

      if (container) {
        container.removeEventListener('mousemove', this._mouseMoveListener, false);
        container.removeEventListener('mouseup', this._mouseUpListener, false);
        container.removeEventListener('mouseout', this._mouseOutListener, false);
      }
    }
  }, {
    key: '_onMouseOut',
    value: function _onMouseOut(e) {

      var container = this.container;

      if (container) {
        container.removeEventListener('mousemove', this._mouseMoveListener, false);
        container.removeEventListener('mouseup', this._mouseUpListener, false);
        container.removeEventListener('mouseout', this._mouseOutListener, false);
      }
    }
  }, {
    key: '_onTouchStart',
    value: function _onTouchStart(e) {

      if (e.touches.length == 1) {

        e.preventDefault();

        var cfg = this.controlsConfig;

        cfg.mouseXOnMouseDown = e.touches[0].pageX - cfg.windowHalfX;
        cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

        cfg.mouseYOnMouseDown = e.touches[0].pageY - cfg.windowHalfY;
        cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
      }
    }
  }, {
    key: '_onTouchEnd',
    value: function _onTouchEnd(e) {

      if (e.touches.length == 1) {

        e.preventDefault();

        var cfg = this.controlsConfig;

        cfg.mouseX = e.touches[0].pageX - cfg.windowHalfX;
        cfg.targetRotationX = cfg.targetRotationOnMouseDownX + (cfg.mouseX - cfg.mouseXOnMouseDown) * 0.05;

        cfg.mouseY = e.touches[0].pageY - cfg.windowHalfY;
        cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;
      }
    }
  }, {
    key: '_onTouchMove',
    value: function _onTouchMove(e) {

      if (e.touches.length == 1) {

        e.preventDefault();

        var cfg = this.controlsConfig;

        cfg.mouseX = e.touches[0].pageX - cfg.windowHalfX;
        cfg.targetRotationX = cfg.targetRotationOnMouseDownX + (cfg.mouseX - cfg.mouseXOnMouseDown) * 0.05;

        cfg.mouseY = e.touches[0].pageY - cfg.windowHalfY;
        cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;
      }
    }
  }, {
    key: 'setModelColor',
    value: function setModelColor(color) {

      if (this.model) {
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

      //horizontal rotation
      if (!this.group) {
        return;
      }

      var group = this.group;
      var cfg = this.controlsConfig;

      group.rotation.y += (cfg.targetRotationX - group.rotation.y) * 0.1;

      //vertical rotation
      cfg.finalRotationY = cfg.targetRotationY - group.rotation.x;
      group.rotation.x += cfg.finalRotationY * 0.05;

      this.renderer.render(this.scene, this.camera);
    }
  }, {
    key: 'animate',
    value: function animate() {
      var _this6 = this;

      if (this.stats) {
        this.stats.begin();
      }

      this.animationId = requestAnimationFrame(function () {
        _this6.animate();
      });

      if (this.controls) {
        this.controls.update();
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

      this.container.removeEventListener('drop', this._dropListener, false);
      this.container.removeEventListener('dragover', this._dragOverListener, false);

      this.container.remove();
      this.progressBar.destroy();
    }
  }]);

  return Viewer;
})();

exports['default'] = Viewer;
module.exports = exports['default'];