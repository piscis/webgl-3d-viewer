import THREE from 'three';
import Logger from './Logger';

export default class STLGeometry extends THREE.Geometry {

  constructor(stlArray){

    super();

    this.stlArray = stlArray;

    this.min_x = 0;
    this.min_y = 0;
    this.min_z = 0;

    this.max_x = 0;
    this.max_y = 0;
    this.max_z = 0;


    for (var i=0; i<stlArray[0].length; i++) {
      this.v(stlArray[0][i][0], stlArray[0][i][1], stlArray[0][i][2]);
    }

    for (var i=0; i<stlArray[1].length; i++) {
      this.f3(stlArray[1][i][0], stlArray[1][i][1], stlArray[1][i][2]);
    }

    this.computeCentroids();
    // Logger.log("computing normals...");
    // this.computeNormals();
    this.computeFaceNormals();
    //this.sortFacesByMaterial();

    for (var v = 0, vl = this.vertices.length; v < vl; v ++) {

      this.max_x = Math.max(this.max_x, this.vertices[v].x);
      this.max_y = Math.max(this.max_y, this.vertices[v].y);
      this.max_z = Math.max(this.max_z, this.vertices[v].z);

      this.min_x = Math.min(this.min_x, this.vertices[v].x);
      this.min_y = Math.min(this.min_y, this.vertices[v].y);
      this.min_z = Math.min(this.min_z, this.vertices[v].z);
    }

    this.center_x = (this.max_x + this.min_x)/2;
    this.center_y = (this.max_y + this.min_y)/2;
    this.center_z = (this.max_z + this.min_z)/2;
  }


  f3(a, b, c){
    // Logger.log("adding face: " + a + "," + b + "," + c)
    this.faces.push( new THREE.Face3( a, b, c ) );
  }

  v(x, y, z){
    // Logger.log("adding vertex: " + x + "," + y + "," + z);
    this.vertices.push( new THREE.Vector3( x, y, z ) );
  }
}