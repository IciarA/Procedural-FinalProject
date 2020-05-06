import {vec3, vec4} from 'gl-matrix';
import {vec2} from 'gl-matrix';
import { throws } from 'assert';

function getAngle(vec: vec2): number {
    return Math.atan2(vec[0], vec[1]);
}

function setLength(vec: vec3, length: number): vec3 {
    let angle = getAngle(vec2.fromValues(vec[0], vec[1]));
    let x = Math.cos(angle) * length;
    let y = Math.sin(angle) * length;
    let z = Math.sin(angle) * length;
    return vec3.fromValues(x, y, z);
}

function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}


class Particle {
    pos: vec3;
    vel: vec3;
    acc: vec3;
    size: number;

    color: vec4;
    goalColor: vec4;
    colorStep: number;
    tone: number;

    height: number;
    width: number;
    depth: number;

    speed: number;

    constructor(x: number, y: number, z: number, col: vec4, w: number, h: number, d: number) {
        this.width = w;
        this.height = h;
        this.depth = d;

        this.pos = vec3.fromValues(x, y, z);
        this.vel = vec3.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0);
        this.acc = vec3.fromValues(0.0, 0.0, 0.0);
        this.size = 1.0;

        this.color = vec4.fromValues(col[0], col[1], col[2], col[3]);
        this.colorStep = 1.1;
        this.tone = 0;

        this.speed = 0.1;
    }

    movePos(v: vec3) {
        vec3.multiply(this.pos, this.pos, v);
    }

    simpleMove() {
        vec3.add(this.vel, this.vel, this.acc);
        vec3.add(this.pos, this.pos, this.vel);
        vec3.multiply(this.acc, this.acc, vec3.fromValues(0.0, 0.0, 0.0));

        if (this.vel.length > 0.2) {
            //this.vel = setLength(this.vel, 0.2);
        }
    }

    applyForce(force: vec3) {
        if (force) {
            vec3.add(this.acc, this.acc, force);
        }
    }

    move(acc: vec3) {
        if (acc) {
            vec3.add(this.acc, this.acc, acc);
        }

        vec3.add(this.vel, this.vel, this.acc);
        vec3.multiply(this.vel, this.vel, vec3.fromValues(this.speed, this.speed, this.speed)); // Slow particles down
        
        vec3.add(this.pos, this.pos, this.vel);

        if (this.vel.length > 0.2) {
            //this.vel = setLength(this.vel, 0.2);
            vec3.normalize(this.vel, this.vel);
            vec3.multiply(this.vel, this.vel, vec3.fromValues(0.2, 0.2, 0.2));

        }

        //this.acc = setLength(this.acc, 0.0);
        vec3.multiply(this.acc, this.acc, vec3.fromValues(0.0, 0.0, 0.0));


        // if (acc) {
        //     let axis: vec2 = vec2.create();
        //     let orient: vec2 = vec2.create();
        //     axis= vec2.fromValues(1.0, 0.0);
        //     orient = vec2.fromValues(axis[0] * Math.cos(acc[0]) - axis[1] * Math.sin(acc[0]),
        //                                 axis[0] * Math.sin(acc[0]) + axis[1] * Math.cos(acc[0]));
        //     vec2.scale(orient, orient, acc[1] / 2.0);
        //     vec2.add(this.pos, this.pos, orient);
        // }
    }

    // Wrap particle at the edges 
    wrap() {
        if (this.pos[0] > this.width) {
            this.pos[0] = 0.0;
        } 
        else if (this.pos[0] < -this.size) {
            this.pos[0] = this.width - 1.0;
        }

        if (this.pos[1] > this.height) {
            this.pos[1] = 0.0;
        }
        else if (this.pos[1] < -this.size) {
            this.pos[1] = this.height - 1.0;
        }

        if (this.pos[2] > this.depth) {
            this.pos[2] = 0.0;
        }
        else if (this.pos[2] < -this.size) {
            this.pos[2] = this.depth - 1.0;
        }
    }

    changeColor() {
        if (this.colorStep > 1.0) {
            this.colorStep = 0.0;
            if (this.tone == 0) {
                this.goalColor = vec4.fromValues(Math.random(), Math.random(), Math.random(), 1.0);
            }
            else if (this.tone == 1) {
                
                let red: number = (Math.random() / 2.0) + 0.6;
                let green: number = (Math.random() / 2.0);
                let blue: number = (Math.random() / 2.0);
                this.goalColor = vec4.fromValues(red, green, blue, 1.0);
            }
            else if (this.tone == 2) {
                let red: number = (Math.random() / 2.0);
                let green: number = (Math.random() / 2.0);
                let blue: number = (Math.random() / 2.0) + 0.6;
                this.goalColor = vec4.fromValues(red, green, blue, 1.0);
            }
        }

        this.color[0] = this.color[0] * (1 - this.colorStep) + this.goalColor[0] * this.colorStep;
        this.color[1] = this.color[1] * (1 - this.colorStep) + this.goalColor[1] * this.colorStep;
        this.color[2] = this.color[2] * (1 - this.colorStep) + this.goalColor[2] * this.colorStep;

        this.colorStep += 0.005;
    }
}

export default Particle;