import {vec3, vec4} from 'gl-matrix';
import {vec2} from 'gl-matrix';


function sdSphere(p: vec3, s: number) : number
{
  return vec3.length(p) - s;
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

    shape: number;
    radius: number;

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
        this.shape = 0;
        this.radius = 15.0;
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

        if (vec3.length(this.vel) > 2.0) {
            //this.vel = setLength(this.vel, 0.2);
            vec3.normalize(this.vel, this.vel);
            vec3.multiply(this.vel, this.vel, vec3.fromValues(2.0, 2.0, 2.0));

        }
        vec3.multiply(this.acc, this.acc, vec3.fromValues(0.0, 0.0, 0.0));
    }

    // Wrap particle at the edges 
    wrap() {
        //function sdSphere(p: vec3, s: number)
        if (this.shape == 1) {
            let sdfVal: number;
            //let radius: number = 20.0;
            let spherePos: vec3 = vec3.fromValues(25.0, 20.0, 20.0);
            let temp: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
            vec3.subtract(temp, this.pos, spherePos);
            sdfVal = sdSphere(temp, this.radius);
            

            if (sdfVal > 0.001) {
                var d, x, y, z;
                do {
                    x = Math.random() * (this.radius * 2.0) + (spherePos[0] - this.radius);
                    y = Math.random() * (this.radius * 2.0) + (spherePos[1] - this.radius);
                    z = Math.random() * (this.radius * 2.0) + (spherePos[2] - this.radius);
                    d = Math.sqrt(Math.pow(x - spherePos[0], 2) + Math.pow(y - spherePos[1], 2) + Math.pow(z - spherePos[2], 2));
                } while(d > this.radius);
                this.pos[0] = x;
                this.pos[1] = y;
                this.pos[2] = z;
            }
         }

        else {
            if (this.pos[0] > this.width) {
                this.pos[0] = 0.0;
            } 
            else if (this.pos[0] < 0.0) {
                this.pos[0] = this.width - 1.0;
            }

            if (this.pos[1] > this.height) {
                this.pos[1] = 0.0;
            }
            else if (this.pos[1] < 0.0) {
                this.pos[1] = this.height - 1.0;
            }

            if (this.pos[2] > this.depth) {
                this.pos[2] = 0.0;
            }
            else if (this.pos[2] < 0.0) {
                this.pos[2] = this.depth - 1.0;
            }
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