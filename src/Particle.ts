import {vec3, quat} from 'gl-matrix';
import {vec2} from 'gl-matrix';

function getAngle(vec: vec2): number {
    return Math.atan2(vec[0], vec[1]);
}

function setLength(vec: vec2, length: number): vec2 {
    let angle = getAngle(vec);
    let x = Math.cos(angle) * length;
    let y = Math.sin(angle) * length;
    return vec2.fromValues(x, y);
}

class Particle {
    pos: vec2;
    vel: vec2;
    acc: vec2;
    size: number;

    height: number;
    width: number;
    depth: number;

    constructor(x: number, y: number) {
        this.width = 30.0;
        this.height = 20.0;
        this.depth = 10.0;

        this.pos = vec2.fromValues(x, y);
        this.vel = vec2.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0);
        this.acc = vec2.fromValues(0.0, 0.0);
        this.size = 1.0;
    }

    simpleMove() {
        vec2.add(this.vel, this.vel, this.acc);
        vec2.add(this.pos, this.pos, this.vel);
        vec2.multiply(this.acc, this.acc, vec2.fromValues(0.0, 0.0));

        if (this.vel.length > 0.2) {
            this.vel = setLength(this.vel, 0.2);
        }
    }

    applyForce(force: vec2) {
        if (force) {
            vec2.add(this.acc, this.acc, force);
        }
    }

    move(acc: vec2) {
        if (acc) {
            vec2.add(this.acc, this.acc, acc);
        }

        vec2.add(this.vel, this.vel, this.acc);
        vec2.multiply(this.vel, this.vel, vec2.fromValues(0.2, 0.2)); // Slow particles down
        
        vec2.add(this.pos, this.pos, this.vel);

        if (this.vel.length > 0.2) {
            this.vel = setLength(this.vel, 0.2);
        }

        this.acc = setLength(this.acc, 0.0);
        vec2.multiply(this.acc, this.acc, vec2.fromValues(0.0, 0.0));


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
    }
}

export default Particle;