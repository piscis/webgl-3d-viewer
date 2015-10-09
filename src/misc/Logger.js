export default class Logger {

  static log(msg){

    if(this.console) {
      console.log(msg);
    }
  }
}