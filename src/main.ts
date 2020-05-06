import {vec3, vec2, mat4, vec4} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';

import Field from './field';
import Particle from './Particle';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  numberOfParticles: 150,
  trailSize: 150,
  width: 50.0,
  height: 40.0,
  depth: 40.0,
  colorTone: 0,
  randomFunction: 0,
  speed: 0.1,
  shape: 0,
  radius: 15.0,
  'Load Scene': loadScene,
};

let square: Square;
let square2: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

let particle: Particle;
let particles: Particle[];
let trailParticles: Particle[][];
let numParticles: number;
let field: Field;



function rotateX(rad: number) : mat4 {
  let m: mat4 = mat4.create();
  mat4.identity(m);

  m = mat4.fromValues(1.0, 0.0, 0.0, 0.0, 
                  0.0, Math.cos(rad), Math.sin(rad), 0.0, 
                  0.0, -Math.sin(rad), Math.cos(rad), 0.0,
                  0.0, 0.0, 0.0, 1.0);
  return m;
}

function rotateY(rad: number): mat4 {
  let m: mat4 = mat4.create();
  mat4.identity(m);

  m = mat4.fromValues(Math.cos(rad), 0.0, -Math.sin(rad), 0.0, 
                      0.0, 1.0, 0.0, 0.0, 
                      Math.sin(rad), 0.0, Math.cos(rad), 0.0,
                      0.0, 0.0, 0.0, 1.0);
  return m;
}

function rotateZ(rad: number): mat4 {
  let m: mat4 = mat4.create();
  mat4.identity(m);

  m = mat4.fromValues(Math.cos(rad), Math.sin(rad), 0.0, 0.0, 
                      -Math.sin(rad), Math.cos(rad), 0.0, 0.0, 
                      0.0, 0.0, 1.0, 0.0,
                      0.0, 0.0, 0.0, 1.0);
  return m;
}


function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  square2 = new Square();
  square2.create();

  let width: number;
  let height: number;
  let depth: number;

  if (controls.shape == 0) {
    width = controls.width;
    height = controls.height;
    depth = controls.depth;
  }
  else  {
    width = controls.radius * 2.1;
    height = controls.radius * 2.1;
    depth = controls.radius * 2.1;
  }

  console.log(controls.shape);
  console.log(width);
  console.log(height);
  console.log(depth);

  field = new Field(width, height, depth);

  numParticles = 300;
  particles = [];
  trailParticles = [];
  for (let i = 0; i < 500; i++) {
    particles.push(new Particle(Math.random() * width, Math.random() * height, Math.random() * depth,
                    vec4.fromValues(Math.random(), Math.random(), Math.random(), 1.0), width, height, depth));
    trailParticles[i] = [];
  }

  field.calculateField();
  field.noiseZ += 0.001;

  // Set up instanced rendering data arrays here.
  // This example creates a set of positional
  // offsets and gradiated colors for a 100x100 grid
  // of squares, even though the VBO data for just
  // one square is actually passed to the GPU
  let offsetsArray = [];
  let colorsArray = [];
  let scaleArray = [];
  let anglesArray = [];
  let n: number = 100.0;

  for (let i = 0; i < controls.numberOfParticles; i++) {
    //particles[i].simpleMove();
    //particles[i].wrap();

    offsetsArray.push(particles[i].pos[0]);
    offsetsArray.push(particles[i].pos[1]);
    offsetsArray.push(particles[i].pos[2]);

    scaleArray.push(0.3);
    scaleArray.push(0.3);
    scaleArray.push(0.3);

    anglesArray.push(0.0);
    anglesArray.push(0.0);
    anglesArray.push(0.0);

    colorsArray.push(1.0);
    colorsArray.push(0.0);
    colorsArray.push(1.0);
    colorsArray.push(1.0); // Alpha channel
  }


  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  let scale: Float32Array = new Float32Array(scaleArray);
  let angles: Float32Array = new Float32Array(anglesArray);
  square.setInstanceVBOs(offsets, colors, scale, angles);
  square.setNumInstances(offsetsArray.length / 3); // grid of "particles"
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  
  gui.add(controls, 'numberOfParticles', 0, 500).step(1);
  gui.add(controls, 'trailSize', 0, 500).step(1);
  gui.add(controls, 'speed', 0.0, 1.0).step(0.1);
  gui.add(controls, 'colorTone', { Random: 0, Warm: 1, Cold: 2 } );
  gui.add(controls, 'randomFunction', { Perlin: 0, Simplex: 1} );
  gui.add(controls, 'shape', { Cube: 0, Sphere: 1} );
  var f1 = gui.addFolder('Cube Dimensions');
  f1.add(controls, 'width', 1, 100).step(1);
  f1.add(controls, 'height', 1, 100).step(1);
  f1.add(controls, 'depth', 1, 100).step(1);
  f1.add(controls, 'Load Scene');
  f1.open();
  var f2 = gui.addFolder('Sphere Dimensions');
  f2.add(controls, 'radius', 1, 20).step(1);
  f2.add(controls, 'Load Scene');
  f2.open();

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  //const camera = new Camera(vec3.fromValues(50, 50, 10), vec3.fromValues(50, 50, 0));
  const camera = new Camera(vec3.fromValues(10.0, 10.0, -10.0), vec3.fromValues(10.0, 10.0, 20.0));

  // const renderer = new OpenGLRenderer(canvas);
  // renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    field.randType = controls.randomFunction;
    field.calculateField();
    field.noiseZ += 0.002;



    let offsetsArray = [];
    let colorsArray = [];
    let scaleArray = [];
    let anglesArray = [];

    /* Uncomment this to visualize flow field */

    // for (let x = 0; x < field.columns; x++) {
    //   for (let y = 0; y < field.rows; y++) {
    //     for (let z = 0; z < field.colDepth; z++) {
    //       let x1 = x * field.size;
    //       let y1 = y * field.size;
    //       let z1 = z * field.size;
    //       //offsetsArray.push(x1 + field.flowField[i][j][0] * field.size * 2.0);
    //       //offsetsArray.push(y1 + field.flowField[i][j][1] * field.size * 2.0);
    //       offsetsArray.push(x1);
    //       offsetsArray.push(y1);
    //       offsetsArray.push(z1);
    //       //offsetsArray.push(field.flowField[i][j][0]);
  
    //       scaleArray.push(0.1);
    //       scaleArray.push(field.flowField[x][y][z][0]);
    //       scaleArray.push(0.1);

    //       anglesArray.push(field.flowField[x][y][z][1]);
    //       anglesArray.push(field.flowField[x][y][z][2]);
    //       anglesArray.push(field.flowField[x][y][z][3]);
  
    //       colorsArray.push(0.5);
    //       colorsArray.push(0.5);
    //       colorsArray.push(0.5);
    //       colorsArray.push(1.0); // Alpha channel
    //     }
    //   }
    // }

    for (let i = 0; i < controls.numberOfParticles; i++) {
      //trailParticles.push(new Particle(particles[i].pos[0], particles[i].pos[1], particles[i].pos[2]));
      trailParticles[i].push(new Particle(particles[i].pos[0], particles[i].pos[1], particles[i].pos[2], 
            vec4.fromValues(particles[i].color[0], particles[i].color[1], particles[i].color[2], particles[i].color[3]),
            controls.width, controls.height, controls.depth));

      let pos = vec3.fromValues(0.0, 0.0, 0.0);
      vec3.divide(pos, particles[i].pos, vec3.fromValues(field.size, field.size, field.size));

      
      let v: vec4 = vec4.create();
      let m: mat4 = mat4.create();
      
      if (pos[0] >= 0.0 && pos[0] < field.columns && pos[1] >= 0.0 && pos[1] < field.rows && pos[2] >= 0.0 && pos[2] < field.colDepth) {
        let length: number = 0.0;
        let angleX: number = 0.0;
        let angleY: number = 0.0;
        let angleZ: number = 0.0;

        length = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][Math.floor(pos[2])][0];
        angleX = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][Math.floor(pos[2])][1];
        angleY = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][Math.floor(pos[2])][2];
        angleZ = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][Math.floor(pos[2])][3];

        mat4.multiply(m, rotateX(angleX), rotateY(angleY));
        mat4.multiply(m, m, rotateZ(angleZ));

        vec4.transformMat4(v, vec4.fromValues(length, length, length, 0.0), rotateX(angleX));
      }

      particles[i].shape = controls.shape;
      particles[i].radius = controls.radius;
      particles[i].speed = controls.speed;
      particles[i].move(vec3.fromValues(v[0], v[1], v[2]));
      particles[i].wrap();
      particles[i].tone = controls.colorTone;
      particles[i].changeColor();

      offsetsArray.push(particles[i].pos[0]);
      offsetsArray.push(particles[i].pos[1]);
      offsetsArray.push(particles[i].pos[2]);

      scaleArray.push(0.3);
      scaleArray.push(0.3);
      scaleArray.push(0.3);

      anglesArray.push(0.0);
      anglesArray.push(0.0);
      anglesArray.push(0.0);

      colorsArray.push(particles[i].color[0]);
      colorsArray.push(particles[i].color[1]);
      colorsArray.push(particles[i].color[2]);
      colorsArray.push(1.0); // Alpha channel
    }

    if (trailParticles.length > 500) {
      trailParticles = trailParticles.slice(trailParticles.length - 500, trailParticles.length);
    }

    for (let i = 0; i < controls.numberOfParticles; i++) {
      let startCond: number = trailParticles[i].length - 1;
      let endCond: number = trailParticles[i].length - controls.trailSize;
      for (let j = startCond; j > endCond && j > 0; j--) {
        offsetsArray.push(trailParticles[i][j].pos[0]);
        offsetsArray.push(trailParticles[i][j].pos[1]);
        offsetsArray.push(trailParticles[i][j].pos[2]);

        let alpha: number;
        if (endCond >= 0.0) {
          alpha = (j - endCond) / (startCond - endCond);
        }
        else {
          alpha = j / startCond;
        }

        scaleArray.push(0.3 * alpha);
        scaleArray.push(0.3 * alpha);
        scaleArray.push(0.3 * alpha);

        anglesArray.push(0.0);
        anglesArray.push(0.0);
        anglesArray.push(0.0);

        colorsArray.push(trailParticles[i][j].color[0]);
        colorsArray.push(trailParticles[i][j].color[1]);
        colorsArray.push(trailParticles[i][j].color[2]);
        colorsArray.push(alpha); // Alpha channel
      }
    }

    let offsets: Float32Array = new Float32Array(offsetsArray);
    let colors: Float32Array = new Float32Array(colorsArray);
    let scale: Float32Array = new Float32Array(scaleArray);
    let angles: Float32Array = new Float32Array(anglesArray);
    square.setInstanceVBOs(offsets, colors, scale, angles);
    square.setNumInstances(offsetsArray.length / 3); // grid of "particles"


    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      square,
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
