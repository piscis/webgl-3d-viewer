import max from 'lodash/max';
import merge from 'lodash/merge';

export default class ModelViewer {

  constructor(domElm, config={}) {

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
      material: true
    };

    // Prepare config
    this.config = merge(this.config, this.defaultConfig, config);


    if(this.config.stats){
      this.stats = this.config.stats;
    }

    // Loading state
    this.loaded = false;

    // Listener
    this._resizeListener = null
    this._dropListener = null;
    this._dragOverListener = null;

    // Setup listener
    this._setupListener();


  }

  getControls(){
    return this.controls || null;
  }


  load(path, cb){

    if(this.loaded){
      this._unload();
    }

    cb = cb || function(){};
    var loader = new THREE.STLLoader();
    loader.load(path,(geometry)=>{this._initializeGeometry(geometry,cb)});
  }

  parse(fileContent, cb){

    if(this.loaded){
      this._unload();
    }

    cb = cb || function(){};
    var loader = new THREE.STLLoader();
    var geometry = loader.parse(fileContent);
    this._initializeGeometry(geometry, cb);
  }


  togglePlane(){

    if(this.plane){
      this.scene.remove(this.plane);
      this.plane = null;
      this.config.plane = false;
    }else{
      this._setupPlane();
    }
  }

  toggleModelWireframe(){

    if(this.modelWireframe){
      this.scene.remove(this.modelWireframe);
      this.modelWireframe = null;
      this.config.wireframe = false;
    }else{
      this._setupModelWireframe();
    }
  }

  toggleAxis(){

    if(this.axisHelper){
      this.scene.remove(this.axisHelper);
      this.axisHelper = null;
      this.config.axis = false;
    }else{
      this._setupAxisHelper();
    }
  }

  toggleSphere(){

    if(this.sphere){
      this.scene.remove(this.sphere);
      this.sphere = null;
      this.config.sphere = false;
    }else{
      this._setupSphereGrid();
    }
  }

  toggleBoundingBox(){

    if(this.boundingBox){
      this.scene.remove(this.boundingBox);
      this.boundingBox = null;
      this.config.boundingBox = false;
    }else{
      this._setupBoundingBox();
    }
  }

  toggleAutoRotate(){

    if(this.model){
      this.controls.autoRotate = !this.controls.autoRotate;
      this.config.autoRotate = this.controls.autoRotate;
    }
  }

  toggleMaterial(){

    if(this.model){

      if(this.config.material){
        this.scene.remove(this.model);
        this.config.material = false;
      }else{
        this.scene.add(this.model);
        this.config.material = true;
      }
    }
  }

  setStats(stats){
    this.stats = stats;
  }

  _setupCamera(){

    var height = this.container.clientHeight;
    var width = this.container.clientWidth;
    var camera = new THREE.PerspectiveCamera( 45, width / height, 1, 4000 );

    if(this.model){

      var geometry = this.model.geometry;
      geometry.computeBoundingSphere();

      var g = this.model.geometry.boundingSphere.radius;
      var dist= g * 8;
      var center = geometry.boundingSphere.center;

      camera.position.set(0, 190, dist * 1.1); // fudge factor so you can see the boundaries
      camera.lookAt(center.x,center.y,center.z);

      window.camera = camera;
    }

    this.camera = camera;
  }

  _setupScene(){

    var scene = new THREE.Scene();
    scene.add( new THREE.AmbientLight( 0x777777 ) );
    this.scene = scene;
  }

  _setupControls(){

    this._setupCamera();

    var controls = new THREE.OrbitControls( this.camera );

    controls.rotateSpeed = 0.9;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    controls.enableZoom = true;
    controls.enablePan = true;

    controls.enableDamping = true;
    controls.dampingFactor = 0.3;

    controls.autoRotate = this.config.autoRotate;

    controls.keys = [ 65, 83, 68 ];

    if(this.model){

      //var pos =this.model.position;
      var geometry =  this.model.geometry;
      geometry.computeBoundingSphere();
      controls.target.set(0,0,0 );

      var center = geometry.boundingSphere.center;
      controls.target.set(center.x,center.y,center.z );
    }

    this.controls = controls;
  }

  _setupRenderer(){

    var height = this.container.clientHeight;
    var width = this.container.clientWidth;
    var renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );

    renderer.setClearColor( 0x000000, 0 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( width, height );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.cullFace = THREE.CullFaceBack;

    this.container.appendChild(renderer.domElement);

    this.renderer = renderer;
  }

  _setupLights(){

    var light1 = new THREE.DirectionalLight( 0xffffff );
    light1.position.set( 1, 1, 1 );
    this.scene.add( light1 );

    var light2 = new THREE.DirectionalLight( 0x002288 );
    light2.position.set( -1, -1, -1 );
    this.scene.add( light2 );

    var light3 = new THREE.AmbientLight( 0x222222 );
    this.scene.add( light3 );
  }

  _setupAxisHelper(){

    if(this.model){

      if(this.axisHelper){
        this.scene.remove(this.axisHelper);
      }

      // Get max dimention and add 50% overlap for plane
      // with a gutter of 10
      var n = this.model.geometry;
      n.computeBoundingBox();
      n.computeBoundingSphere();

      var maxDimension = max(this.model.geometry.boundingBox.max);
      maxDimension = Math.ceil(~~(maxDimension*1.50)/10)*10;

      var axisHelper = new THREE.AxisHelper(maxDimension);
      axisHelper.position.x = n.boundingSphere.center.x;
      axisHelper.position.y = 0;
      axisHelper.position.z = n.boundingSphere.center.z;

      this.axisHelper = axisHelper;
      this.scene.add( this.axisHelper );
      this.config.axis = true;
    }
  }

  _setupPlane(){

    if(this.model){

      if(this.plane){
        this.scene.remove(this.plane);
      }

      // Getmax dimention and add 10% overlap for plane
      // with a gutter of 10
      var n = this.model.geometry;
      n.computeBoundingBox();
      n.computeBoundingSphere();

      var maxDimension = max(this.model.geometry.boundingBox.max);
      maxDimension = Math.ceil(~~(maxDimension*1.10)/10)*10;

      var plane = new THREE.GridHelper(maxDimension, 10);
      plane.position.x = n.boundingSphere.center.x
      plane.position.y = 0
      plane.position.z = n.boundingSphere.center.z

      this.plane = plane;
      this.scene.add(this.plane);
      this.config.plane = true;
    }
  }

  _setupSphereGrid(){

    if(this.model) {

      if (this.sphere) {
        this.scene.remove(this.sphere);
      }

      var n = this.model.geometry;
      n.computeBoundingBox();
      n.computeBoundingSphere();

      var {x,y,z} = this.model.geometry.boundingBox.max;
      var d = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2) + Math.pow(z, 2));
      var maxDimension = Math.ceil(~~(d * 0.60) / 10) * 10;

      var geometry = new THREE.SphereGeometry(maxDimension, 10, 10);
      var material = new THREE.MeshBasicMaterial({color: 0x4d635d, wireframe: true});
      var sphere = new THREE.Mesh(geometry, material);

      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();

      sphere.position.x = n.boundingSphere.center.x
      sphere.position.y = geometry.boundingSphere.radius / 2;
      sphere.position.z = n.boundingSphere.center.z

      this.sphere = sphere;
      this.scene.add(this.sphere);
      this.config.sphere = true;
    }
  }

  _setupBoundingBox(){

    if(this.model){

      if(this.boundingBox){
        this.scene.remove(this.boundingBox);
      }

      var wireframe = new THREE.WireframeGeometry( this.model.geometry );
      var line = new THREE.LineSegments( wireframe );

      line.material.depthTest = false;
      line.material.opacity = 0.25;
      line.material.transparent = true;
      line.position.x = 0;

      this.boundingBox = new THREE.BoxHelper( line );

      this.scene.add( this.boundingBox );
      this.config.boundingBox = true;
    }
  }

  _unload(){

    cancelAnimationFrame(this.animationId);

    var objsToRemove = _.rest(this.scene.children, 1);
    _.each(objsToRemove, (object) =>{
      this.scene.remove(object);
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

    while (elem.lastChild){
      elem.removeChild(elem.lastChild);
    }

    this.loaded = false;

    // Remove listener
    window.removeEventListener('resize',this._resizeListener,false);
    this._resizeListener=null;
  }

  _setupModelWireframe(){

    if(this.model){

      if(this.modelWireframe){
        this.scene.remove(this.modelWireframe);
      }

      var material  = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 200, wireframe: true } );

      var mesh = this.model.clone();
      mesh.material = material;
      this.modelWireframe = mesh;
      this.scene.add(mesh);
      this.config.wireframe = true;
    }
  }

  _setupListener() {

    this._resizeListener = (ev)=>{
      this._onWindowResize(ev);
    };

    window.addEventListener('resize', this._resizeListener, false);

    this._dropListener = (ev)=>{
      this._onDrop(ev);
    };

    this._dragOverListener = (ev)=>{
      this._onDragOver(ev);
    };

    var dropZone = this.container;
    dropZone.addEventListener('drop', this._dropListener, false);

    // for Firefox
    dropZone.addEventListener('dragover', this._dragOverListener, false);
  }

  _restoreConfig(){
    if(this.config.wireframe){ this._setupModelWireframe() }
    if(this.config.plane){ this._setupPlane() }
    if(this.config.boundingBox){ this._setupBoundingBox() }
    if(this.config.sphere){ this._setupSphereGrid() }
    if(this.config.axis){ this._setupAxisHelper() }
  }

  _initializeGeometry(geometry,cb) {

    cb = cb || function(){};
    this._setupScene();
    this._setupRenderer();
    this._setupLights();

    var n = geometry;
    n.computeBoundingSphere();
    n.computeBoundingBox();

    n.applyMatrix((new THREE.Matrix4).makeRotationX(-Math.PI/2));

    var material = new THREE.MeshPhongMaterial( { color: 0xb3b3b3, specular: 0x111111, shininess: 200 } );
    var mesh = new THREE.Mesh( geometry, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material = material;
    this.model = mesh;

    if(this.config.material){
      this.scene.add(this.model);
    }

    this._setupControls();

    this._restoreConfig();

    this.animate();
    this.loaded = true;
    cb()
  }

  _onWindowResize() {

    if(this.container) {

      var height = this.container.clientHeight;
      var width = this.container.clientWidth;

      if(this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }

      if(this.renderer){
        this.renderer.setSize( width, height );
      }
    }
  }


  _onDrop(e){

    var self = this;

    e.stopPropagation(); // Stops some browsers from redirecting.
    e.preventDefault();

    var files = e.dataTransfer.files;

    for (var i = 0, f; f = files[i]; i++) {
      // Read the File objects in this FileList.
      //console.log(f.name + " - " + f.type)

      if (!/.*\.stl$/i.test(f.name)){
        alert('File type not recognised.');
        continue;
      }

      var reader = new FileReader();

      // Closure to capture the file information.
      reader.onloadend = function(e) {

        self.parse(e.srcElement.result);
      };

      reader.readAsArrayBuffer(f);
    }
  }

  _onDragOver(e){
    e.preventDefault();
  }

  setModelColor(color){

    if(this.model){
      this.model.material.color = color;
    }
  }

  setModelColorByHexcode(hexcode){

    var colorValue=hexcode.replace( '#','0x' );
    var color = new THREE.Color(parseInt(colorValue, 16));
    this.setModelColor(color);
  }

  // @TODO: implement
  setBackgroundColor(){}

  render(){

    if(this.scene, this.camera){

      this.renderer.render(this.scene, this.camera);
    }
  }


  animate() {

    if(this.stats){this.stats.begin()}
    this.animationId = requestAnimationFrame(()=>{ this.animate()});

    if(this.controls){
      this.controls.update();
    }

    this.render();
    if(this.stats){this.stats.end()}
  }

  destroy() {

    this._unload();

    this.container.removeEventListener('drop',     this._dropListener, false);
    this.container.removeEventListener('dragover', this._dragOverListener, false);
  }
}
