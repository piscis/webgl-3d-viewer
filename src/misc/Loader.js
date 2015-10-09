export default function() {

  var workerFacadeMessage;

  var Thingiloader = function (event) {
    console.log(event);

    // Code from https://developer.mozilla.org/En/Using_XMLHttpRequest#Receiving_binary_data
    this.load_binary_resource = function (url) {
      var req = new XMLHttpRequest();
      req.open('GET', url, false);
      // The following line says we want to receive data as Binary and not as Unicode
      req.overrideMimeType('text/plain; charset=x-user-defined');
      req.send(null);
      if (req.status != 200) return '';

      return req.responseText;
    };

    this.loadSTL = function (url) {
      var looksLikeBinary = function (reader) {
        // STL files don't specify a way to distinguish ASCII from binary.
        // The usual way is checking for "solid" at the start of the file --
        // but Thingiverse has seen at least one binary STL file in the wild
        // that breaks this.

        // The approach here is different: binary STL files contain a triangle
        // count early in the file.  If this correctly predicts the file's length,
        // it is most probably a binary STL file.

        reader.seek(80);  // skip the header
        var count = reader.readUInt32();

        var predictedSize = 80 /* header */ + 4 /* count */ + 50 * count;
        return reader.getSize() == predictedSize;
      };

      workerFacadeMessage({'status': 'message', 'content': 'Downloading ' + url});
      var file = this.load_binary_resource(url);
      var reader = new BinaryReader(file);

      if (looksLikeBinary(reader)) {
        this.loadSTLBinary(reader);
      } else {
        this.loadSTLString(file);
      }
    };

    this.loadOBJ = function (url) {
      workerFacadeMessage({'status': 'message', 'content': 'Downloading ' + url});
      var file = this.load_binary_resource(url);
      this.loadOBJString(file);
    };

    this.loadJSON = function (url) {
      workerFacadeMessage({'status': 'message', 'content': 'Downloading ' + url});
      var file = this.load_binary_resource(url);
      this.loadJSONString(file);
    };

    this.loadPLY = function (url) {
      workerFacadeMessage({'status': 'message', 'content': 'Downloading ' + url});

      var file = this.load_binary_resource(url);

      if (file.match(/format ascii/i)) {
        this.loadPLYString(file);
      } else {
        this.loadPLYBinary(file);
      }
    };

    this.loadSTLString = function (STLString) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing STL String...'});
      workerFacadeMessage({'status': 'complete', 'content': this.ParseSTLString(STLString)});
    };

    this.loadSTLBinary = function (STLBinary) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing STL Binary...'});

      if (STLBinary instanceof BinaryReader) {
        workerFacadeMessage({'status': 'complete', 'content': this.ParseSTLBinary(STLBinary)});
      } else {
        workerFacadeMessage({'status': 'complete', 'content': this.ParseSTLBinary(new BinaryReader(STLBinary))});
      }
    };

    this.loadOBJString = function (OBJString) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing OBJ String...'});
      workerFacadeMessage({'status': 'complete', 'content': this.ParseOBJString(OBJString)});
    };

    this.loadJSONString = function (JSONString) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing JSON String...'});
      workerFacadeMessage({'status': 'complete', 'content': eval(JSONString)});
    };

    this.loadPLYString = function (PLYString) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing PLY String...'});
      workerFacadeMessage({'status': 'complete_points', 'content': this.ParsePLYString(PLYString)});
    };

    this.loadPLYBinary = function (PLYBinary) {
      workerFacadeMessage({'status': 'message', 'content': 'Parsing PLY Binary...'});
      workerFacadeMessage({'status': 'complete_points', 'content': this.ParsePLYBinary(PLYBinary)});
    };

    this.ParsePLYString = function (input) {
      var properties = [];
      var vertices = [];
      var colors = [];

      var vertex_count = 0;

      var header = /ply\n([\s\S]+)\nend_header/ig.exec(input)[1];
      var data = /end_header\n([\s\S]+)$/ig.exec(input)[1];

      // workerFacadeMessage({'status':'message', 'content':'header:\n' + header});
      // workerFacadeMessage({'status':'message', 'content':'data:\n' + data});

      header_parts = header.split("\n");

      for (i in header_parts) {
        if (/element vertex/i.test(header_parts[i])) {
          vertex_count = /element vertex (\d+)/i.exec(header_parts[i])[1];
        } else if (/property/i.test(header_parts[i])) {
          properties.push(/property (.*) (.*)/i.exec(header_parts[i])[2]);
        }
      }

      // workerFacadeMessage({'status':'message', 'content':'properties: ' + properties});

      data_parts = data.split("\n");

      for (i in data_parts) {
        data_line = data_parts[i];
        data_line_parts = data_line.split(" ");

        vertices.push([
          parseFloat(data_line_parts[properties.indexOf("x")]),
          parseFloat(data_line_parts[properties.indexOf("y")]),
          parseFloat(data_line_parts[properties.indexOf("z")])
        ]);

        colors.push([
          parseInt(data_line_parts[properties.indexOf("red")]),
          parseInt(data_line_parts[properties.indexOf("green")]),
          parseInt(data_line_parts[properties.indexOf("blue")])
        ]);
      }

      // workerFacadeMessage({'status':'message', 'content':'vertices: ' + vertices});

      return [vertices, colors];
    };

    this.ParsePLYBinary = function (input) {
      return false;
    };

    this.ParseSTLBinary = function (input) {
      // Skip the header.
      input.seek(80);

      // Load the number of vertices.
      var count = input.readUInt32();

      // During the parse loop we maintain the following data structures:
      var vertices = [];   // Append-only list of all unique vertices.
      var vert_hash = {};  // Mapping from vertex to index in 'vertices', above.
      var faces = [];   // List of triangle descriptions, each a three-element
                        // list of indices in 'vertices', above.

      for (var i = 0; i < count; i++) {
        if (i % 100 == 0) {
          workerFacadeMessage({
            'status': 'message',
            'content': 'Parsing ' + (i + 1) + ' of ' + count + ' polygons...'
          });
          workerFacadeMessage({
            'status': 'progress',
            'content': parseInt(i / count * 100) + '%'
          });
        }

        // Skip the normal (3 single-precision floats)
        input.seek(input.getPosition() + 12);

        var face_indices = [];
        for (var x = 0; x < 3; x++) {
          var vertex = [input.readFloat(), input.readFloat(), input.readFloat()];

          var vertexIndex = vert_hash[vertex];
          if (vertexIndex == null) {
            vertexIndex = vertices.length;
            vertices.push(vertex);
            vert_hash[vertex] = vertexIndex;
          }

          face_indices.push(vertexIndex);
        }
        faces.push(face_indices);

        // Skip the "attribute" field (unused in common models)
        input.readUInt16();
      }

      return [vertices, faces];
    };

    // build stl's vertex and face arrays
    this.ParseSTLString = function (STLString) {
      var vertexes = [];
      var faces = [];

      var face_vertexes = [];
      var vert_hash = {}

      // console.log(STLString);

      // strip out extraneous stuff
      STLString = STLString.replace(/\r/, "\n");
      STLString = STLString.replace(/^solid[^\n]*/, "");
      STLString = STLString.replace(/\n/g, " ");
      STLString = STLString.replace(/facet normal /g, "");
      STLString = STLString.replace(/outer loop/g, "");
      STLString = STLString.replace(/vertex /g, "");
      STLString = STLString.replace(/endloop/g, "");
      STLString = STLString.replace(/endfacet/g, "");
      STLString = STLString.replace(/endsolid[^\n]*/, "");
      STLString = STLString.replace(/\s+/g, " ");
      STLString = STLString.replace(/^\s+/, "");

      // console.log(STLString);

      var facet_count = 0;
      var block_start = 0;

      var points = STLString.split(" ");

      workerFacadeMessage({'status': 'message', 'content': 'Parsing vertices...'});
      for (var i = 0; i < points.length / 12 - 1; i++) {
        if ((i % 100) == 0) {
          workerFacadeMessage({'status': 'progress', 'content': parseInt(i / (points.length / 12 - 1) * 100) + '%'});
        }

        var face_indices = [];
        for (var x = 0; x < 3; x++) {
          var vertex = [parseFloat(points[block_start + x * 3 + 3]), parseFloat(points[block_start + x * 3 + 4]), parseFloat(points[block_start + x * 3 + 5])];

          var vertexIndex = vert_hash[vertex];
          if (vertexIndex == null) {
            vertexIndex = vertexes.length;
            vertexes.push(vertex);
            vert_hash[vertex] = vertexIndex;
          }

          face_indices.push(vertexIndex);
        }
        faces.push(face_indices);

        block_start = block_start + 12;
      }

      return [vertexes, faces];
    };

    this.ParseOBJString = function (OBJString) {
      var vertexes = [];
      var faces = [];

      var lines = OBJString.split("\n");

      // var normal_position = 0;

      for (var i = 0; i < lines.length; i++) {
        workerFacadeMessage({'status': 'progress', 'content': parseInt(i / lines.length * 100) + '%'});

        line_parts = lines[i].replace(/\s+/g, " ").split(" ");

        if (line_parts[0] == "v") {
          vertexes.push([parseFloat(line_parts[1]), parseFloat(line_parts[2]), parseFloat(line_parts[3])]);
        } else if (line_parts[0] == "f") {
          faces.push([parseFloat(line_parts[1].split("/")[0]) - 1, parseFloat(line_parts[2].split("/")[0]) - 1, parseFloat(line_parts[3].split("/")[0] - 1), 0])
        }
      }

      return [vertexes, faces];
    };

    switch (event.data.cmd) {
      case "loadSTL":
        this.loadSTL(event.data.param);
        break;
      case "loadSTLString":
        this.loadSTLString(event.data.param);
        break;
      case "loadSTLBinary":
        this.loadSTLBinary(event.data.param);
        break;
      case "loadOBJ":
        this.loadOBJ(event.data.param);
        break;
      case "loadOBJString":
        this.loadOBJString(event.data.param);
        break;
      case "loadJSON":
        this.loadJSON(event.data.param);
        break;
      case "loadPLY":
        this.loadPLY(event.data.param);
        break;
      case "loadPLYString":
        this.loadPLYString(event.data.param);
        break;
      case "loadPLYBinary":
        this.loadPLYBinary(event.data.param);
        break;
    }

  };

// BinaryReader
// Refactored by Vjeux <vjeuxx@gmail.com>
// http://blog.vjeux.com/2010/javascript/javascript-binary-reader.html

// Original
//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/classes/binary-parser [rev. #1]

  var BinaryReader = function (data) {
    this._buffer = data;
    this._pos = 0;
  };

  BinaryReader.prototype = {

    /* Public */

    readInt8: function () {
      return this._decodeInt(8, true);
    },
    readUInt8: function () {
      return this._decodeInt(8, false);
    },
    readInt16: function () {
      return this._decodeInt(16, true);
    },
    readUInt16: function () {
      return this._decodeInt(16, false);
    },
    readInt32: function () {
      return this._decodeInt(32, true);
    },
    readUInt32: function () {
      return this._decodeInt(32, false);
    },

    readFloat: function () {
      return this._decodeFloat(23, 8);
    },
    readDouble: function () {
      return this._decodeFloat(52, 11);
    },

    readChar: function () {
      return this.readString(1);
    },
    readString: function (length) {
      this._checkSize(length * 8);
      var result = this._buffer.substr(this._pos, length);
      this._pos += length;
      return result;
    },

    seek: function (pos) {
      this._pos = pos;
      this._checkSize(0);
    },

    getPosition: function () {
      return this._pos;
    },

    getSize: function () {
      return this._buffer.length;
    },


    /* Private */

    _decodeFloat: function (precisionBits, exponentBits) {
      var length = precisionBits + exponentBits + 1;
      var size = length >> 3;
      this._checkSize(length);

      var bias = Math.pow(2, exponentBits - 1) - 1;
      var signal = this._readBits(precisionBits + exponentBits, 1, size);
      var exponent = this._readBits(precisionBits, exponentBits, size);
      var significand = 0;
      var divisor = 2;
      // var curByte = length + (-precisionBits >> 3) - 1;
      var curByte = 0;
      do {
        var byteValue = this._readByte(++curByte, size);
        var startBit = precisionBits % 8 || 8;
        var mask = 1 << startBit;
        while (mask >>= 1) {
          if (byteValue & mask) {
            significand += 1 / divisor;
          }
          divisor *= 2;
        }
      } while (precisionBits -= startBit);

      this._pos += size;

      return exponent == (bias << 1) + 1 ? significand ? NaN : signal ? -Infinity : +Infinity
        : (1 + signal * -2) * (exponent || significand ? !exponent ? Math.pow(2, -bias + 1) * significand
        : Math.pow(2, exponent - bias) * (1 + significand) : 0);
    },

    _decodeInt: function (bits, signed) {
      var x = this._readBits(0, bits, bits / 8), max = Math.pow(2, bits);
      var result = signed && x >= max / 2 ? x - max : x;

      this._pos += bits / 8;
      return result;
    },

    //shl fix: Henri Torgemane ~1996 (compressed by Jonas Raoni)
    _shl: function (a, b) {
      for (++b; --b; a = ((a %= 0x7fffffff + 1) & 0x40000000) == 0x40000000 ? a * 2 : (a - 0x40000000) * 2 + 0x7fffffff + 1);
      return a;
    },

    _readByte: function (i, size) {
      return this._buffer.charCodeAt(this._pos + size - i - 1) & 0xff;
    },

    _readBits: function (start, length, size) {
      var offsetLeft = (start + length) % 8;
      var offsetRight = start % 8;
      var curByte = size - (start >> 3) - 1;
      var lastByte = size + (-(start + length) >> 3);
      var diff = curByte - lastByte;

      var sum = (this._readByte(curByte, size) >> offsetRight) & ((1 << (diff ? 8 - offsetRight : length)) - 1);

      if (diff && offsetLeft) {
        sum += (this._readByte(lastByte++, size) & ((1 << offsetLeft) - 1)) << (diff-- << 3) - offsetRight;
      }

      while (diff) {
        sum += this._shl(this._readByte(lastByte++, size), (diff-- << 3) - offsetRight);
      }

      return sum;
    },

    _checkSize: function (neededBits) {
      if (!(this._pos + Math.ceil(neededBits / 8) < this._buffer.length)) {
        throw new Error("Index out of bound");
      }
    }
  };

  if (typeof(window) === "undefined") {
    self.onmessage = Thingiloader;
    workerFacadeMessage = self.postMessage;
    //importScripts('binaryReader.js');
  } else {
    //workerFacadeMessage = WorkerFacade.add(thingiurlbase + "/thingiloader.js", Thingiloader);
  }

}