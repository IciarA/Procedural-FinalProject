import {vec3, vec2} from 'gl-matrix';
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
};

let square: Square;
let square2: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;

let particle: Particle;
let particles: Particle[];
let field: Field;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();

  square2 = new Square();
  square2.create();

  particle = new Particle(5.0, 3.5);
  field = new Field();

  particles = [];
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle(Math.random() * 20.0, Math.random() * 20.0));
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
  let n: number = 100.0;
  // for(let i = 0; i < n; i++) {
  //   for(let j = 0; j < n; j++) {
  //     offsetsArray.push(i);
  //     offsetsArray.push(j);
  //     offsetsArray.push(0);

  //     colorsArray.push(i / n);
  //     colorsArray.push(j / n);
  //     colorsArray.push(1.0);
  //     colorsArray.push(1.0); // Alpha channel
  //   }
  // }

  for (let i = 0; i < field.columns; i++) {
    for (let j = 0; j < field.rows; j++) {
      let x1 = i * field.size;
      let y1 = j * field.size;
      //offsetsArray.push(x1 + field.flowField[i][j][0] * field.size * 2.0);
      //offsetsArray.push(y1 + field.flowField[i][j][1] * field.size * 2.0);
      offsetsArray.push(x1);
      offsetsArray.push(y1);
      offsetsArray.push(field.flowField[i][j][0]);

      scaleArray.push(0.1);
      scaleArray.push(field.flowField[i][j][1]);
      scaleArray.push(1.0);

      colorsArray.push(1.0);
      colorsArray.push(1.0);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }
  }

  for (let i = 0; i < 10; i++) {
    //particles[i].simpleMove();
    //particles[i].wrap();

    offsetsArray.push(particles[i].pos[0]);
    offsetsArray.push(particles[i].pos[1]);
    offsetsArray.push(0);

    scaleArray.push(0.3);
    scaleArray.push(0.3);
    scaleArray.push(1.0);

    colorsArray.push(1.0);
    colorsArray.push(0.0);
    colorsArray.push(1.0);
    colorsArray.push(1.0); // Alpha channel
  }

  offsetsArray.push(particle.pos[0]);
  offsetsArray.push(particle.pos[1]);
  offsetsArray.push(0);

  scaleArray.push(0.3);
  scaleArray.push(0.3);
  scaleArray.push(1.0);

  colorsArray.push(1.0);
  colorsArray.push(0.0);
  colorsArray.push(1.0);
  colorsArray.push(1.0); // Alpha channel

  let offsets: Float32Array = new Float32Array(offsetsArray);
  let colors: Float32Array = new Float32Array(colorsArray);
  let scale: Float32Array = new Float32Array(scaleArray);
  square.setInstanceVBOs(offsets, colors, scale);
  square.setNumInstances(offsetsArray.length / 3); // grid of "particles"



  // let offsetsArray2 = [];
  // let colorsArray2 = [];
  // let scaleArray2 = [];

  // offsetsArray2.push(particle.pos[0]);
  // offsetsArray2.push(particle.pos[1]);
  // offsetsArray2.push(0);

  // scaleArray2.push(1.0);
  // scaleArray2.push(1.0);
  // scaleArray2.push(1.0);

  // colorsArray2.push(1.0);
  // colorsArray2.push(0.0);
  // colorsArray2.push(1.0);
  // colorsArray2.push(1.0); // Alpha channel

  // let offsets2: Float32Array = new Float32Array(offsetsArray2);
  // let colors2: Float32Array = new Float32Array(colorsArray2);
  // let scale2: Float32Array = new Float32Array(scaleArray2);
  // square.setInstanceVBOs(offsets2, colors2, scale2);
  // square.setNumInstances(1); // grid of "particles"
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
  const camera = new Camera(vec3.fromValues(10.0, 10.0, 5), vec3.fromValues(10.0, 10.0, 0));

  // const renderer = new OpenGLRenderer(canvas);
  // renderer.setClearColor(0.2, 0.2, 0.2, 1);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

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
    field.calculateField();
    field.noiseZ += 0.002;

    let pos = vec2.fromValues(0.0, 0.0);
    vec2.divide(pos, particle.pos, vec2.fromValues(field.size, field.size));

    let v: vec2;
    if (pos[0] >= 0.0 && pos[0] < field.columns && pos[1] >= 0.0 && pos[1] < field.rows) {
      // v = vec2.fromValues(field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][0], 
      //                     field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][1]);
      let angle: number;
      let length: number;
      angle = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][0];
      length = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][1];
      //console.log("pos: " + pos);
      //console.log("length:");
      //console.log(length);
      //console.log("angle: " + angle);
      v = vec2.fromValues(Math.cos(angle) * length, Math.sin(angle) * length);
    }
    //console.log(v);
    
    particle.move(v);
    //particle.applyForce(v);
    //particle.simpleMove();
    particle.wrap();

    let offsetsArray = [];
    let colorsArray = [];
    let scaleArray = [];
    let n: number = 100.0;

    for (let i = 0; i < field.columns; i++) {
      for (let j = 0; j < field.rows; j++) {
        let x1 = i * field.size;
        let y1 = j * field.size;
        //offsetsArray.push(x1 + field.flowField[i][j][0] * particle.size * 2.0);
        //offsetsArray.push(y1 + field.flowField[i][j][1] * particle.size * 2.0);
        offsetsArray.push(x1);
        offsetsArray.push(y1);
        offsetsArray.push(field.flowField[i][j][0]);

        scaleArray.push(0.1);
        scaleArray.push(field.flowField[i][j][1]);
        scaleArray.push(1.0);

        colorsArray.push(1.0);
        colorsArray.push(1.0);
        colorsArray.push(1.0);
        colorsArray.push(1.0); // Alpha channel
      }
    }

    for (let i = 0; i < 5; i++) {
      let pos = vec2.fromValues(0.0, 0.0);
      vec2.divide(pos, particles[i].pos, vec2.fromValues(field.size, field.size));
      let v: vec2;
      if (pos[0] >= 0.0 && pos[0] < field.columns && pos[1] >= 0.0 && pos[1] < field.rows) {
        // v = vec2.fromValues(field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][0], 
        //                     field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][1]);
        let angle: number;
        let length: number;
        angle = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][0];
        length = field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][1];
        v = vec2.fromValues(Math.cos(angle) * length, Math.sin(angle) * length);
        //v = vec2.fromValues(field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][0], 
        //                     field.flowField[Math.floor(pos[0])][Math.floor(pos[1])][1]);
      }


      //particles[i].simpleMove();
      particles[i].move(v);
      particles[i].wrap();

      offsetsArray.push(particles[i].pos[0]);
      offsetsArray.push(particles[i].pos[1]);
      offsetsArray.push(0);

      scaleArray.push(0.3);
      scaleArray.push(0.3);
      scaleArray.push(1.0);

      colorsArray.push(1.0);
      colorsArray.push(0.0);
      colorsArray.push(1.0);
      colorsArray.push(1.0); // Alpha channel
    }

    offsetsArray.push(particle.pos[0]);
    offsetsArray.push(particle.pos[1]);
    offsetsArray.push(0);

    scaleArray.push(0.3);
    scaleArray.push(0.3);
    scaleArray.push(1.0);

    colorsArray.push(1.0);
    colorsArray.push(0.0);
    colorsArray.push(1.0);
    colorsArray.push(1.0); // Alpha channel

    let offsets: Float32Array = new Float32Array(offsetsArray);
    let colors: Float32Array = new Float32Array(colorsArray);
    let scale: Float32Array = new Float32Array(scaleArray);
    square.setInstanceVBOs(offsets, colors, scale);
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
