import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Square extends Drawable {
  indices: Uint32Array;
  positions: Float32Array;
  colors: Float32Array;
  offsets: Float32Array; // Data for bufTranslate
  scale: Float32Array;
  angle: Float32Array;


  constructor() {
    super(); // Call the constructor of the super class. This is required.
  }

  create() {

  this.indices = new Uint32Array([0, 1, 2,
                                  0, 2, 3,
                                  3, 2, 4,
                                  3, 4, 5,
                                  1, 6, 4,
                                  1, 4, 2,
                                  6, 7, 5,
                                  6, 5, 4,
                                  7, 0, 1,
                                  7, 1, 6,
                                  7, 5, 3,
                                  7, 3, 0]);
  this.positions = new Float32Array([-0.5, -0.5, 0.5, 1,
                                     0.5, -0.5, 0.5, 1,
                                     0.5, 0.5, 0.5, 1,
                                     -0.5, 0.5, 0.5, 1,
                                     0.5, 0.5, -0.5, 1,
                                     -0.5, 0.5, -0.5, 1,
                                     0.5, -0.5, -0.5, 1,
                                     -0.5, -0.5, -0.5, 1]);

    this.generateIdx();
    this.generatePos();
    this.generateCol();
    this.generateTranslate();
    this.generateScale();
    this.generateAngle();

    this.count = this.indices.length;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    console.log(`Created square`);
  }

  setInstanceVBOs(offsets: Float32Array, colors: Float32Array, scale: Float32Array, angle: Float32Array) {
    this.colors = colors;
    this.offsets = offsets;
    this.scale = scale;
    this.angle = angle;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufCol);
    gl.bufferData(gl.ARRAY_BUFFER, this.colors, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufTranslate);
    gl.bufferData(gl.ARRAY_BUFFER, this.offsets, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufScale);
    gl.bufferData(gl.ARRAY_BUFFER, this.scale, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufAngle);
    gl.bufferData(gl.ARRAY_BUFFER, this.angle, gl.STATIC_DRAW);
  }
};

export default Square;
