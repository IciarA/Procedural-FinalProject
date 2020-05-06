import Noise from './perlin';
import {vec2} from 'gl-matrix';
import { throws } from 'assert';

let noise: Noise;

class Field {
    flowField: number[][][][];
    size: number;
    noiseZ: number;
    height: number;
    width: number;
    depth: number;
    columns: number;
    rows: number;
    colDepth: number;

    randType: number;

    constructor(w: number, h: number, d: number) {
        noise = new Noise(); // Do I need this?

        this.size = 1.0;
        this.noiseZ = 0.0;
        this.width = w;
        this.height = h;
        this.depth = d;
        noise.calcSeed(Math.random());
        this.columns = Math.floor(this.width / this.size) + 1;
        this.rows = Math.floor(this.height / this.size) + 1;
        this.colDepth = Math.floor(this.depth / this.size) + 1;

        this.randType = 0;

        this.initField();
    }

    initField() {
        this.flowField = [];
        for(let x = 0; x < this.columns; x++) {
            this.flowField[x] = [];
            for(let y = 0; y < this.rows; y++) {
                this.flowField[x][y] = [];
                for (let z = 0; z < this.colDepth; z++) {
                    this.flowField[x][y][z] = [0.0, 0.0, 0.0, 0.0];
                }
            }
        }
    }

    calculateField() {
        for(let x = 0; x < this.columns; x++) {
            for(let y = 0; y < this.rows; y++) {
                for (let z = 0; z < this.colDepth; z++) {
                    
                    let angleZ: number;
                    let angleY: number; 
                    let angleX: number;
                    let length: number;

                    if (this.randType == 0) {
                        angleZ = noise.perlin3(x / 50.0, y / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleY = noise.perlin3(x / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleX = noise.perlin3(y / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        length = noise.perlin3(x / 100.0 + 40000, y / 100.0 + 40000, this.noiseZ);
                    }
                    else if (this.randType == 1) {
                        angleZ = noise.simplex3(x / 50.0, y / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleY = noise.simplex3(x / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleX = noise.simplex3(y / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        length = noise.simplex3(x / 100.0 + 40000, y / 100.0 + 40000, this.noiseZ);
                    }
                    else if (this.randType == 2) {
                        angleZ = noise.perlin3(x / 50.0, y / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleY = noise.perlin3(x / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        angleX = noise.perlin3(y / 50.0, z / 50.0, this.noiseZ) * Math.PI * 2.0;
                        length = noise.fbm3(x, y, this.noiseZ / 100.0);
                    }

                    this.flowField[x][y][z][0] = length;
                    this.flowField[x][y][z][1] = angleX;
                    this.flowField[x][y][z][2] = angleY;
                    this.flowField[x][y][z][3] = angleZ;
                }
            }
        }
    }
}

export default Field;