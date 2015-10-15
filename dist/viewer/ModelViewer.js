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

var ModelViewer = (function () {
  function ModelViewer(domElm) {
    var config = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, ModelViewer);

    require('./utils/Detector.js');
    require('./loaders/STLLoader.js');
    require('./controls/OrbitControls');

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
    this.config = {};

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

  _createClass(ModelViewer, [{
    key: 'getControls',
    value: function getControls() {
      return this.controls || null;
    }
  }, {
    key: 'load',
    value: function load(path, cb) {
      var _this = this;

      if (this.loaded) {
        this._unload();
      }

      cb = cb || function () {};
      var loader = new THREE.STLLoader();
      loader.load(path, function (geometry) {
        _this._initializeGeometry(geometry, cb);
      });
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
        this.scene.remove(this.plane);
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
        this.scene.remove(this.modelWireframe);
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
        this.scene.remove(this.axisHelper);
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
        this.scene.remove(this.sphere);
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
        this.scene.remove(this.boundingBox);
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
          this.scene.remove(this.model);
          this.config.material = false;
        } else {
          this.scene.add(this.model);
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

        window.camera = camera;
      }

      this.camera = camera;
    }
  }, {
    key: '_setupScene',
    value: function _setupScene() {

      var scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0x777777));
      this.scene = scene;
    }
  }, {
    key: '_setupControls',
    value: function _setupControls() {

      this._setupCamera();

      var controls = new THREE.OrbitControls(this.camera, this.container);

      controls.rotateSpeed = 1.9;
      controls.zoomSpeed = 1.2;
      controls.panSpeed = 0.8;

      controls.enableZoom = true;
      controls.enablePan = true;

      controls.enableDamping = true;
      controls.dampingFactor = 0.3;

      controls.autoRotate = this.config.autoRotate;

      controls.keys = [65, 83, 68];

      if (this.model) {

        //var pos =this.model.position;
        var geometry = this.model.geometry;
        geometry.computeBoundingSphere();
        controls.target.set(0, 0, 0);

        var center = geometry.boundingSphere.center;
        controls.target.set(center.x, center.y, center.z);
      }

      this.controls = controls;
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

      var light1 = new THREE.DirectionalLight(0xffffff);
      light1.position.set(1, 1, 1);
      this.scene.add(light1);

      var light2 = new THREE.DirectionalLight(0x002288);
      light2.position.set(-1, -1, -1);
      this.scene.add(light2);

      var light3 = new THREE.AmbientLight(0x222222);
      this.scene.add(light3);
    }
  }, {
    key: '_setupAxisHelper',
    value: function _setupAxisHelper() {

      if (this.model) {

        if (this.axisHelper) {
          this.scene.remove(this.axisHelper);
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
        this.scene.add(this.axisHelper);
        this.config.axis = true;
      }
    }
  }, {
    key: '_setupPlane',
    value: function _setupPlane() {

      if (this.model) {

        if (this.plane) {
          this.scene.remove(this.plane);
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
        this.scene.add(this.plane);
        this.config.plane = true;
      }
    }
  }, {
    key: '_setupSphereGrid',
    value: function _setupSphereGrid() {

      if (this.model) {

        if (this.sphere) {
          this.scene.remove(this.sphere);
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
        this.scene.add(this.sphere);
        this.config.sphere = true;
      }
    }
  }, {
    key: '_setupBoundingBox',
    value: function _setupBoundingBox() {

      if (this.model) {

        if (this.boundingBox) {
          this.scene.remove(this.boundingBox);
        }

        var wireframe = new THREE.WireframeGeometry(this.model.geometry);
        var line = new THREE.LineSegments(wireframe);

        line.material.depthTest = false;
        line.material.opacity = 0.25;
        line.material.transparent = true;
        line.position.x = 0;

        this.boundingBox = new THREE.BoxHelper(line);

        this.scene.add(this.boundingBox);
        this.config.boundingBox = true;
      }
    }
  }, {
    key: '_unload',
    value: function _unload() {
      var _this2 = this;

      cancelAnimationFrame(this.animationId);

      var objsToRemove = (0, _lodashArrayRest2['default'])(this.scene.children, 1);
      (0, _lodashCollectionEach2['default'])(objsToRemove, function (object) {
        _this2.scene.remove(object);
      });

      this.scene = null;
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

      // Clear container
      var elem = this.container;

      while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
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
          this.scene.remove(this.modelWireframe);
        }

        var material = new THREE.MeshPhongMaterial({ color: 0xffffff, specular: 0x111111, shininess: 200, wireframe: true });

        var mesh = this.model.clone();
        mesh.material = material;
        this.modelWireframe = mesh;
        this.scene.add(mesh);
        this.config.wireframe = true;
      }
    }
  }, {
    key: '_setupListener',
    value: function _setupListener() {
      var _this3 = this;

      this._resizeListener = function (ev) {
        _this3._onWindowResize(ev);
      };

      window.addEventListener('resize', this._resizeListener, false);

      this._dropListener = function (ev) {
        _this3._onDrop(ev);
      };

      this._dragOverListener = function (ev) {
        _this3._onDragOver(ev);
      };

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

      var material = new THREE.MeshPhongMaterial({ color: 0xb3b3b3, specular: 0x111111, shininess: 200 });
      var mesh = new THREE.Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = material;
      this.model = mesh;

      if (this.config.material) {
        this.scene.add(this.model);
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

      if ((this.scene, this.camera)) {

        this.renderer.render(this.scene, this.camera);
      }
    }
  }, {
    key: 'animate',
    value: function animate() {
      var _this4 = this;

      if (this.stats) {
        this.stats.begin();
      }
      this.animationId = requestAnimationFrame(function () {
        _this4.animate();
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
    }
  }]);

  return ModelViewer;
})();

exports['default'] = ModelViewer;
module.exports = exports['default'];