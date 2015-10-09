/* A facade for the Web Worker API that fakes it in case it's missing.
 Good when web workers aren't supported in the browser, but it's still fast enough, so execution doesn't hang too badly (e.g. Opera 10.5).
 By Stefan Wehrmeyer, licensed under MIT
 */

var WorkerFacade;

if(!!window.Worker){
  WorkerFacade = (function(){
    return function(path){
      return new window.Worker(path);
    };
  }());

} else {

  WorkerFacade = (function(){
    var workers = {}, masters = {}, loaded = false;
    var that = function(path){
      var theworker = {}, loaded = false, callings = [];
      theworker.postToWorkerFunction = function(args){
        try{
          workers[path]({"data":args});
        }catch(err){
          theworker.onerror(err);
        }
      };
      theworker.postMessage = function(params){
        if(!loaded){
          callings.push(params);
          return;
        }
        theworker.postToWorkerFunction(params);
      };
      masters[path] = theworker;
      var scr = document.createElement("SCRIPT");
      scr.src = path;
      scr.type = "text/javascript";
      scr.onload = function(){
        loaded = true;
        while(callings.length > 0){
          theworker.postToWorkerFunction(callings[0]);
          callings.shift();
        }
      };
      document.body.appendChild(scr);

      var binaryscr = document.createElement("SCRIPT");
      binaryscr.src = thingiurlbase + '/binaryReader.js';
      binaryscr.type = "text/javascript";
      document.body.appendChild(binaryscr);

      return theworker;
    };
    that.fake = true;
    that.add = function(pth, worker){
      workers[pth] = worker;
      return function(param){
        masters[pth].onmessage({"data": param});
      };
    };
    that.toString = function(){
      return "FakeWorker('"+path+"')";
    };
    return that;
  }());
}

export default WorkerFacade;