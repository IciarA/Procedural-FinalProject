import Noise from './perlin';
import {vec2} from 'gl-matrix';

let noise: Noise;

class Field {
    flowField: number[][][];
    size: number;
    noiseZ: number;
    height: number;
    width: number;
    columns: number;
    rows: number;

    constructor() {
        noise = new Noise(); // Do I need this?

        this.size = 1.0;
        this.noiseZ = 0.0;
        this.width = 30.0;
        this.height = 20.0;
        noise.calcSeed(Math.random());
        this.columns = Math.floor(this.width / this.size) + 1;
        this.rows = Math.floor(this.height / this.size) + 1;
        this.initField();
    }

    initField() {
        this.flowField = [];
        for(let x = 0; x < this.columns; x++) {
            this.flowField[x] = [];
            for(let y = 0; y < this.rows; y++) {
                this.flowField[x][y] = [0.0, 0.0];
            }
        }
    }

    calculateField() {
        for(let x = 0; x < this.columns; x++) {
            for(let y = 0; y < this.rows; y++) {
                let angle = noise.simplex3(x / 50.0, y / 50.0, this.noiseZ) * Math.PI * 2.0;
                let length = noise.simplex3(x / 100.0 + 40000, y / 100.0 + 40000, this.noiseZ);

                this.flowField[x][y][0] = angle;
                this.flowField[x][y][1] = length;
            }
        }
    }
}

export default Field;