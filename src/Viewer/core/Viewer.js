import max from 'lodash/math/max';
import merge from 'lodash/object/merge';
import rest from 'lodash/array/rest';
import each from 'lodash/collection/each';

import ProgressBar from './../utils/ProgressBar';
import STLLoader from './../loaders/STLLoader';
import OrbitControls from './../controls/OrbitControls';

export default class Viewer {

  constructor(domElm, config = {}) {

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

      windowHalfX: (window.innerWidth / 2),
      windowHalfY: (window.innerHeight / 2),

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
      material: true,
      fudge: 1.0,
      progressBar: {}
    };


    // Prepare config
    this.config = merge(this.config, this.defaultConfig, config);
    this.controlsConfig = merge({}, this.controlsConfigDefault);

    if (this.config.stats) {
      this.stats = this.config.stats;
    }

    // Init progress
    this.progressBar = new ProgressBar(this.container, this.config.progressBar);
    this.progressBar.show();

    // Loading state
    this.loaded = false;

    // Listener
    this._resizeListener = null;
    this._dropListener = null;
    this._dragOverListener = null;
  }

  load(path, cb) {

    if (this.loaderPath === path) {
      return false;
    }

    this._unload();

    // Setup listener
    this._setupListener();

    if (!this.progressBar) {
      this.progressBar = new ProgressBar(this.container);
      window.progress = this.progressBar;
    }

    let callb = cb || function() { };
    let loader = new STLLoader();
    let onLoadCB = (geometry)=>{

      console.log(path);

      this.loaderPath = path;
      this._initializeGeometry(geometry, callb);
    };

    let onProgressCB = (item)=>{

      if (item) {

        let progress = Math.round((100 * item.loaded / item.total));

        if (progress < 0) {
          progress = 0;
        } else if (progress > 100) {
          progress = 100;
        }

        if (this.progressBar) {
          this.progressBar.progress = progress;
        }

        if (progress === 100) {

          setTimeout(()=>{

            if (this.progressBar) {
              this.progressBar.hide();
            }
          }, 1500);
        }
      }

    };

    let onErrorCB = ()=>{

      if (this.progressBar) {
        this.progressBar.hide();
      }
    };

    if (this.progressBar) {
      this.progressBar.show();
    }

    this.loader = loader.load(path, onLoadCB, onProgressCB, onErrorCB);
  }

  parse(fileContent, cb) {

    if (this.loaded) {
      this._unload();
    }

    let callb = cb || function() { };
    let loader = new THREE.STLLoader();
    let geometry = loader.parse(fileContent);
    this._initializeGeometry(geometry, callb);
  }


  enablePlane(state = true) {

    const cfgState = this.config.plane;

    if(cfgState !== state){

      if (this.plane) {
        this.group.remove(this.plane);
        this.plane = null;
      }

      if(state === true) {
        this._setupPlane();
      }

      this.config.plane = state;
    }

    return this.config.plane;
  }

  enableModelWireframe(state = true) {

    const cfgState = this.config.wireframe;

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

  enableAxis(state = true) {

    const cfgState = this.config.axis;

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

  enableSphere(state=true) {

    const cfgState = this.config.sphere;

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

  enableBoundingBox(state = true) {

    const cfgState = this.config.boundingBox;

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

  enableAutoRotate(state = true) {

    const cfgState = this.config.autoRotate;

    if (this.model && cfgState !== state) {
      this.controls.autoRotate = state;
      this.config.autoRotate = state;
    }

    return this.config.autoRotate;
  }

  enableMaterial(state = true) {

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

  setStats(stats) {
    this.stats = stats;
  }

  static _setupContainer(domElm) {

    const vElm = document.createElement('div');
    vElm.style.height = '100%';
    vElm.style.width = '100%';
    domElm.appendChild(vElm);

    return vElm;
  }

  _setupCamera() {

    const height = this.container.clientHeight;
    const width = this.container.clientWidth;
    const camera = new THREE.PerspectiveCamera( 45, width / height, 1, 4000 );

    if (this.model) {

      const geometry = this.model.geometry;
      geometry.computeBoundingSphere();

      let g = this.model.geometry.boundingSphere.radius;
      let dist = g * 3;

      // fudge factor so you can see the boundaries
      camera.position.set(0, 0, (dist * this.config.fudge));
    }

    this.camera = camera;
  }

  _setupScene() {

    const scene = new THREE.Scene();
    const group = new THREE.Group();

    this.scene = scene;
    this.group = group;

    this.scene.add(this.group);
  }

  _setupControls() {

    this._setupCamera();

    if (this.model) {

      const container = this.container;
      container.removeEventListener( 'mouseup',    this._mouseUpListener, false );
      container.removeEventListener( 'mousemove',  this._mouseMoveListener, false );
      container.removeEventListener( 'mousedown',  this._mouseDownListener, false );
      container.removeEventListener( 'touchstart', this._touchStartListener, false );
      container.removeEventListener( 'touchmove',  this._touchMoveListener, false );

      this.controlsConfig = merge({}, this.controlsConfigDefault);

      // Controls
      this._mouseDownListener = (e) => { this._onMouseDown(e); };
      this._mouseMoveListener = (e) => { this._onMouseMove(e); };
      this._mouseUpListener = (e) => { this._onMouseUp(e); };
      this._mouseOutListener = (e) => { this._onMouseOut(e); };
      this._touchStartListener = (e) => { this._onTouchStart(e); };
      this._touchEndListener = (e) => { this._onTouchEnd(e); };
      this._touchMoveListener = (e) => { this._onTouchMove(e); };

      // Mouse / Touch events
      container.addEventListener( 'mousedown', this._mouseDownListener, false );
      container.addEventListener( 'touchstart', this._touchStartListener, false );
      container.addEventListener( 'touchmove', this._touchMoveListener, false );


      const controls = new OrbitControls(this.camera, this.container);

      controls.enableKeys = false;
      controls.enableRotate = false;
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.enableZoom = true;

      let bb = new THREE.Box3();
      bb.setFromObject(this.model);
      bb.center(controls.target);

      this.controls = controls;
    }
  }

  _setupRenderer() {

    const height = this.container.clientHeight;
    const width = this.container.clientWidth;
    const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    const devicePixelRatio = window.devicePixelRatio || 1;

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

  _setupLights() {

    // Ambient
    this.scene.add( new THREE.AmbientLight( 0xcccccc ) );

    // Light 3
    const light = new THREE.SpotLight( 0xcccccc );
    light.angle = 1.7;
    light.position.set(100, 500, 100);

    const target = new THREE.Object3D();
    target.position.set(0, 0, 0);
    light.target = target;

    this.scene.add( light );
  }

  _setupAxisHelper() {

    if (this.model) {

      if (this.axisHelper) {
        this.group.remove(this.axisHelper);
      }

      // Get max dimention and add 50% overlap for plane
      // with a gutter of 10
      const geometry = this.model.geometry;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      let maxDimension = max(this.model.geometry.boundingBox.max);
      maxDimension = Math.ceil(~~(maxDimension * 1.50) / 10) * 10;

      const axisHelper = new THREE.AxisHelper(maxDimension);
      axisHelper.position.x = geometry.boundingSphere.center.x;
      axisHelper.position.y = 0;
      axisHelper.position.z = geometry.boundingSphere.center.z;

      this.axisHelper = axisHelper;
      this.group.add( this.axisHelper );
      this.config.axis = true;
    }
  }

  _setupPlane() {

    if (this.model) {

      if (this.plane) {
        this.group.remove(this.plane);
      }

      // Getmax dimention and add 10% overlap for plane
      // with a gutter of 10
      let geometry = this.model.geometry;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      let maxDimension = max(this.model.geometry.boundingBox.max);
      maxDimension = Math.ceil(~~(maxDimension * 1.10) / 10) * 10;

      const plane = new THREE.GridHelper(maxDimension, 10);
      plane.position.x = geometry.boundingSphere.center.x;
      plane.position.y = 0;
      plane.position.z = geometry.boundingSphere.center.z;

      this.plane = plane;
      this.group.add(this.plane);
      this.config.plane = true;
    }
  }

  _setupSphereGrid() {

    if (this.model) {

      if (this.sphere) {
        this.group.remove(this.sphere);
      }

      let geometry = this.model.geometry;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      let {x, y, z} = this.model.geometry.boundingBox.max;
      let d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
      let maxDimension = Math.ceil(~~(d * 0.60) / 10) * 10;

      let geometrySphere = new THREE.SphereGeometry(maxDimension, 10, 10);
      let material = new THREE.MeshBasicMaterial({color: 0x4d635d, wireframe: true});
      let sphere = new THREE.Mesh(geometrySphere, material);

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      sphere.position.x = geometry.boundingSphere.center.x;
      sphere.position.y = geometrySphere.boundingSphere.radius / 2;
      sphere.position.z = geometry.boundingSphere.center.z;

      this.sphere = sphere;
      this.group.add(this.sphere);
      this.config.sphere = true;
    }
  }

  _setupBoundingBox() {

    if (this.model) {

      if (this.boundingBox) {
        this.group.remove(this.boundingBox);
      }

      let wireframe = new THREE.WireframeGeometry( this.model.geometry );
      let line = new THREE.LineSegments( wireframe );

      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = 0;

      this.boundingBox = new THREE.BoxHelper( line );

      this.group.add( this.boundingBox );
      this.config.boundingBox = true;
    }
  }

  _unload() {

    cancelAnimationFrame(this.animationId);

    if (this.scene !== null) {

      let objsToRemoveFromGroup = rest(this.group.children, 1);
      each(objsToRemoveFromGroup, (object) => {
        this.group.remove(object);
      });

      let objsToRemoveFromScene = rest(this.scene.children, 1);
      each(objsToRemoveFromScene, (object) => {
        this.scene.remove(object);
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


    if (this.progressBar) {
      this.progressBar.destroy();
      this.progressBar = null;
    }


    if (this.container !== null) {

      // Clear container
      const elem = this.container;

      while (elem.lastChild) {
        elem.removeChild(elem.lastChild);
      }
    }

    this.loaded = false;
    this.loaderPath = null;

    // Remove listener
    window.removeEventListener('resize', this._resizeListener, false);
    this._resizeListener = null;


    this.container.removeEventListener('drop', this._dropListener, false);
    this.container.removeEventListener('dragover', this._dragOverListener, false);

    if (this.progressBar) {
      this.progressBar.destroy();
    }

    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
  }

  _setupModelWireframe() {

    if (this.model) {

      if (this.modelWireframe) {
        this.group.remove(this.modelWireframe);
      }

      let material  = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 20, wireframe: true } );

      const mesh = this.model.clone();
      mesh.material = material;
      this.modelWireframe = mesh;
      this.group.add(mesh);
      this.config.wireframe = true;
    }
  }

  _setupListener() {

    this._resizeListener = (evt)=>{ this._onWindowResize(evt); };
    this._dropListener = (evt)=>{ this._onDrop(evt); };
    this._dragOverListener = (evt)=>{ return evt.preventDefault(); };

    window.addEventListener('resize', this._resizeListener, false);

    if (this.config.dragDrop === true) {
      const dropZone = this.container;
      dropZone.addEventListener('drop', this._dropListener, false);

      // for Firefox
      dropZone.addEventListener('dragover', this._dragOverListener, false);
    }

  }

  _restoreConfig() {

    const { wireframe, plane, boundingBox, sphere, axis } = this.config;

    if (wireframe) { this._setupModelWireframe(); }
    if (plane) { this._setupPlane(); }
    if (boundingBox) { this._setupBoundingBox(); }
    if (sphere) { this._setupSphereGrid(); }
    if (axis) { this._setupAxisHelper(); }
  }

  _initializeGeometry(geometry, cb) {

    const callb = cb || function() { };
    this._setupScene();
    this._setupRenderer();
    this._setupLights();

    const n = geometry;
    n.computeBoundingSphere();
    n.computeBoundingBox();

    n.applyMatrix((new THREE.Matrix4).makeRotationX(-Math.PI / 2));

    const material = new THREE.MeshPhongMaterial( { color: 0xb3b3b3, specular: 0x111111, shininess: 20 } );
    const mesh = new THREE.Mesh( geometry, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = material;

    // reset center point
    const box = new THREE.Box3().setFromObject(mesh);
    box.center(mesh.position);
    mesh.position.multiplyScalar(-1);


    this.model = mesh;

    if (this.config.material) {
      this.group.add(this.model);
    }

    this.scene.updateMatrixWorld();

    this._setupControls();

    this._restoreConfig();

    this.animate();
    this.loaded = true;
    callb();
  }

  _onWindowResize() {

    if (this.container) {

      let height = this.container.clientHeight;
      let width = this.container.clientWidth;

      if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }

      if (this.renderer) {
        this.renderer.setSize( width, height );
      }

      ['controlsConfig', 'controlsConfigDefault'].forEach((key)=>{

        if (this.hasOwnProperty(key)) {
          this[key].windowHalfX = (window.innerWidth / 2);
          this[key].windowHalfY = (window.innerHeight / 2);
        }
      });
    }
  }


  _onDrop(evt = {dataTransfer: { files: [] }}) {

    e.stopPropagation(); // Stops some browsers from redirecting.
    e.preventDefault();

    const files = evt.dataTransfer.files;

    let onLoaded = (e) => {
      this.parse(e.srcElement.result);
    };

    for (let i = 0; i < files.length; i++) {
      let f = files[i];

      // Read the File objects in this FileList.
      // console.log(f.name + " - " + f.type)
      if (/.*\.stl$/i.test(f.name)) {

        let reader = new FileReader();

        // Closure to capture the file information.
        reader.onloadend = onLoaded;

        reader.readAsArrayBuffer(f);
      }
    }
  }


  _onMouseDown(evt) {

    evt.preventDefault();

    const container = this.container;
    const cfg = this.controlsConfig;

    if (container) {

      const { clientX, clientY } = evt;

      container.addEventListener('mousemove', this._mouseMoveListener, false);
      container.addEventListener('mouseup', this._mouseUpListener, false);
      container.addEventListener('mouseout', this._mouseOutListener, false);

      cfg.mouseXOnMouseDown = clientX - cfg.windowHalfX;
      cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

      cfg.mouseYOnMouseDown = clientY - cfg.windowHalfY;
      cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
    }

  }

  _onMouseMove(evt) {

    if (evt) {

      const cfg = this.controlsConfig;

      cfg.mouseX = evt.clientX - cfg.windowHalfX;
      cfg.mouseY = evt.clientY - cfg.windowHalfY;

      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.02;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + (cfg.mouseX - cfg.mouseXOnMouseDown) * 0.02;
    }
  }


  _onMouseUp() {

    const {container} = this;

    if (container) {
      container.removeEventListener( 'mousemove', this._mouseMoveListener, false );
      container.removeEventListener( 'mouseup', this._mouseUpListener, false );
      container.removeEventListener( 'mouseout', this._mouseOutListener, false );
    }
  }

  _onMouseOut() {

    const {container} = this;

    if (container) {
      container.removeEventListener('mousemove', this._mouseMoveListener, false);
      container.removeEventListener('mouseup', this._mouseUpListener, false);
      container.removeEventListener('mouseout', this._mouseOutListener, false);
    }
  }

  _onTouchStart(evt = {touches: [] }) {

    const touches = evt.touches;
    const cfg = this.controlsConfig;

    if (touches.length === 1) {

      evt.preventDefault();
      const {pageX, pageY} = touches[0];

      cfg.mouseXOnMouseDown = pageX - cfg.windowHalfX;
      cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

      cfg.mouseYOnMouseDown = pageY - cfg.windowHalfY;
      cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
    }
  }

  _onTouchEnd(evt = {touches: [] }) {

    const touches = evt.touches;
    const cfg = this.controlsConfig;

    if (touches.length === 1) {

      evt.preventDefault();

      const {pageX, pageY} = touches[0];

      cfg.mouseX = pageX - cfg.windowHalfX;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + ( cfg.mouseX - cfg.mouseXOnMouseDown ) * 0.05;

      cfg.mouseY = pageY - cfg.windowHalfY;
      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;

    }
  }

  _onTouchMove(evt = {touches: [] }) {

    const touches = evt.touches;
    const cfg = this.controlsConfig;

    if (touches.length === 1 ) {

      evt.preventDefault();
      const {pageX, pageY} = touches[0];

      cfg.mouseX = pageX - cfg.windowHalfX;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + ( cfg.mouseX - cfg.mouseXOnMouseDown ) * 0.05;

      cfg.mouseY = pageY - cfg.windowHalfY;
      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;
    }
  }

  setModelColor(color) {

    if (this.model && color) {
      this.model.material.color = color;
    }
  }

  setModelColorByHexcode(hexcode) {

    if (hexcode) {
      const colorValue = hexcode.replace('#', '0x');
      const color = new THREE.Color(parseInt(colorValue, 16));
      this.setModelColor(color);
    }
  }

  render() {

    // horizontal rotation
    if (!this.group) {
      return;
    }

    const group = this.group;
    const cfg = this.controlsConfig;

    group.rotation.y += ( cfg.targetRotationX - group.rotation.y ) * 0.1;

    // vertical rotation
    cfg.finalRotationY = (cfg.targetRotationY - group.rotation.x);
    group.rotation.x += cfg.finalRotationY * 0.05;

    this.renderer.render(this.scene, this.camera);
  }


  animate() {

    if (this.stats) {
      this.stats.begin();
    }

    this.animationId = requestAnimationFrame(()=>{
      this.animate();
    });

    if (this.controls) {
      this.controls.update();
    }

    this.render();

    if (this.stats) {
      this.stats.end();
    }
  }

  destroy() {

    this._unload();
    this.container.remove();
  }
}