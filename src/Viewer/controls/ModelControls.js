import merge from 'lodash/object/merge';
import OrbitControls from './OrbitControls';
import TWEEN from 'tween.js';

export default class ModelControls {

  constructor(container, camera, group, config = {}) {

    this.container = container;
    this.camera = camera;
    this.group = group;

    this._animations = [];

    // Default configuration params
    this.controlsConfigDefault = {

      startupAnimation: true,

      targetRotationX: 0,
      targetRotationOnMouseDownX: 0,

      targetRotationY: 0,
      targetRotationOnMouseDownY: 0,

      mouseX: 0,
      mouseXOnMouseDown: 0,

      mouseY: 0,
      mouseYOnMouseDown: 0,

      clientHalfX: (this.container.clientWidth / 2),
      clientHalfY: (this.container.clientHeight / 2),

      finalRotationY: null
    };

    this.controlsConfig = merge({}, this.controlsConfigDefault, config);

    this._init();

    if (this.controlsConfig.startupAnimation === true) {
      this._createStartUpAnimation();
    }
  }

  update(time) {

    const group = this.group;

    if (this.controls) {
      this.controls.update();
    }

    // Do tweening
    TWEEN.update(time);

    if (group) {

      const cfg = this.controlsConfig;

      group.rotation.y += ( cfg.targetRotationX - group.rotation.y ) * 0.1;

      // vertical rotation
      cfg.finalRotationY = (cfg.targetRotationY - group.rotation.x);
      group.rotation.x += cfg.finalRotationY * 0.05;
    }
  }

  destroy() {
    this._removeEventListener();

    // Remove orbit control
    if (this.controls) {
      this.controls.dispose();
    }

    this._clearAnimations();
    this._animations = [];
  }

  _clearAnimations() {

    if (this.animations && this._animations.length > 0) {

      while (this._animations.length > 0) {
        TWEEN.remove(this._animations.pop());
      }
    }
  }

  _createStartUpAnimation() {

    const {targetRotationY, targetRotationX} = this.controlsConfig;
    const self = this;

    const coords = {
      x: targetRotationX / Math.PI * 180,
      y: targetRotationY / Math.PI * 180
    };

    this._clearAnimations();

    let tween1 = new TWEEN.Tween(coords)
      .easing(TWEEN.Easing.Back.InOut)
      .to({ x: 405, y: 45 }, 3500)
      .onUpdate(function() {
        self.controlsConfig.targetRotationX = this.x * Math.PI / 180;
      })
      .start();

    this._animations.push(tween1);

    let tween2 = new TWEEN.Tween(coords)
      .easing(TWEEN.Easing.Exponential.Out)
      .to({ x: 360, y: 45 }, 1500)
      .onUpdate(function() {
        self.controlsConfig.targetRotationY = this.y * Math.PI / 180;
      })
      .start();

    this._animations.push(tween2);
  }

  _init() {

    // Clean registered event listener
    this._removeEventListener();
    this.controlsConfig = merge({}, this.controlsConfigDefault);
    this._setupListener();

    // Delecate to orbit controls
    const controls = new OrbitControls(this.camera, this.container);

    controls.enableKeys = false;
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.enableZoom = true;

    let bb = new THREE.Box3();
    bb.setFromObject(this.group);
    bb.center(controls.target);

    this.controls = controls;
  }

  _setupListener() {

    const container = this.container;

    // Add resize listener
    this._resizeListener = (evt)=>{ this._onWindowResize(evt); };
    window.addEventListener('resize', this._resizeListener, false);

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
  }

  _removeEventListener() {

    const container = this.container;

    // Remove resize listener
    window.removeEventListener('resize', this._resizeListener, false);
    this._resizeListener = null;

    // Remove model spinning controls
    container.removeEventListener( 'mouseup',    this._mouseUpListener, false );
    container.removeEventListener( 'mousemove',  this._mouseMoveListener, false );
    container.removeEventListener( 'mousedown',  this._mouseDownListener, false );
    container.removeEventListener( 'touchstart', this._touchStartListener, false );
    container.removeEventListener( 'touchmove',  this._touchMoveListener, false );
  }

  _onWindowResize() {

    ['controlsConfig', 'controlsConfigDefault'].forEach((key)=>{

      if (this.hasOwnProperty(key)) {
        this[key].clientHalfX = (this.container.clientWidth / 2);
        this[key].clientHalfY = (this.container.clientHeight / 2);
      }
    });
  }

  _onMouseDown(evt) {

    evt.preventDefault();

    const container = this.container;
    const cfg = this.controlsConfig;

    if (container) {

      const { clientX, clientY } = evt;

      this._clearAnimations();

      container.addEventListener('mousemove', this._mouseMoveListener, false);
      container.addEventListener('mouseup', this._mouseUpListener, false);
      container.addEventListener('mouseout', this._mouseOutListener, false);

      cfg.mouseXOnMouseDown = clientX - cfg.clientHalfX;
      cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

      cfg.mouseYOnMouseDown = clientY - cfg.clientHalfY;
      cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
    }

  }

  _onMouseMove(evt) {

    if (evt) {

      const cfg = this.controlsConfig;

      cfg.mouseX = evt.clientX - cfg.clientHalfX;
      cfg.mouseY = evt.clientY - cfg.clientHalfY;

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

      cfg.mouseXOnMouseDown = pageX - cfg.clientHalfX;
      cfg.targetRotationOnMouseDownX = cfg.targetRotationX;

      cfg.mouseYOnMouseDown = pageY - cfg.clientHalfY;
      cfg.targetRotationOnMouseDownY = cfg.targetRotationY;
    }
  }

  _onTouchEnd(evt = {touches: [] }) {

    const touches = evt.touches;
    const cfg = this.controlsConfig;

    if (touches.length === 1) {

      evt.preventDefault();

      const {pageX, pageY} = touches[0];

      cfg.mouseX = pageX - cfg.clientHalfX;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + ( cfg.mouseX - cfg.mouseXOnMouseDown ) * 0.05;

      cfg.mouseY = pageY - cfg.clientHalfY;
      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;

    }
  }

  _onTouchMove(evt = {touches: [] }) {

    const touches = evt.touches;
    const cfg = this.controlsConfig;

    if (touches.length === 1 ) {

      evt.preventDefault();
      const {pageX, pageY} = touches[0];

      cfg.mouseX = pageX - cfg.clientHalfX;
      cfg.targetRotationX = cfg.targetRotationOnMouseDownX + ( cfg.mouseX - cfg.mouseXOnMouseDown ) * 0.05;

      cfg.mouseY = pageY - cfg.clientHalfY;
      cfg.targetRotationY = cfg.targetRotationOnMouseDownY + (cfg.mouseY - cfg.mouseYOnMouseDown) * 0.05;
    }
  }
}
