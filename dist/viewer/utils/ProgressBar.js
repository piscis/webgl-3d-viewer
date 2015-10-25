import template from 'lodash/string/template';
import merge from 'lodash/object/merge';
import each from 'lodash/collection/each';

export default class ProgressBar {

  constructor(domElm, config={}){

    this._container = domElm;
    this._progressElm = null;

    this._defaultConfig = {
      visibility: 'hidden',
      progress: 0,
      unit: '%',
      text: 'Loading: '
    };
    this.template = template(`
      <div class="progress-bar progress-bar--<%- visibility %>">
        <div class="progress-bar__container">
          <span class="progress-bar__text"><%- text %></span>
          <span class="progress-bar__count"><%- progress %></span>
          <span class="progress-bar__unit"><%- unit %></span>
        </div>
      </div>
    `.trim());

    this._config = merge({},this._defaultConfig, config);
    this._updateProgress();
  }

  show(){
    this._config.visibility = 'visible';
    if(this._progressElm.classList){
      this._progressElm.classList.remove('progress-bar--hidden');
      this._progressElm.classList.add('progress-bar--visible');
    }else {
      this._updateProgress();
    }
  }

  hide(){
    this._config.visibility = 'hidden';

    if(this._progressElm.classList){
      this._progressElm.classList.add('progress-bar--hidden');
      this._progressElm.classList.remove('progress-bar--visible');
    }else {
      this._updateProgress();
    }
  }

  _updateProgress(){

    let elm = this.template(this._config);


    if(this._progressElm){

      let domNodes = this._container.getElementsByClassName('progress-bar');

      each(domNodes,(node)=>{
        node.remove();
      });

      this._progressElm = null;
    }

    var el = document.createElement('div');
    el.innerHTML = elm;

    this._container.appendChild(el.childNodes[0]);
    this._progressElm = elm;
  }

  set progress(progress) {

    if(progress){
      this._config.progress = parseInt(progress);
      this._updateProgress();
    }
  }

  get progress() {
    return this._config.progress;
  }

  destroy() {

    if(this._progressElm){
      this._progressElm.remove();
    }
  }
}