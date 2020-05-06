/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */
// From: https://codepen.io/DonKarlssonSan/pen/jBWaad

import {vec3} from 'gl-matrix';

class Grad {
    x: number;
    y: number;
    z: number;


    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    dot2(x: number, y: number) : number {
        return this.x * x + this.y * y;
    }

    dot3(x: number, y: number, z: number) : number {
        return this.x * x + this.y * y + this.z * z;
    }
}


var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
    new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
    new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];


var p = [151,160,137,91,90,15,
    131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
    190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
    88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
    102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
    135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
    5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
    223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
    129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
    251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
    49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
    138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];

// To remove the need for index wrapping, double the permutation table length
var perm = new Array(512);
var gradP = new Array(512);

// Skewing and unskewing factors for 2, 3, and 4 dimensions
var F2 = 0.5*(Math.sqrt(3)-1);
var G2 = (3-Math.sqrt(3))/6;

var F3 = 1/3;
var G3 = 1/6;


// ##### Perlin noise stuff
  
function fade(t : number) : number {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a: number, b: number, t: number) : number {
    return (1 - t) * a + t * b;
}


class Noise {
    seed: number;

    constructor() {
        this.calcSeed(0);
    }

    calcSeed(seed: number) {
        if(seed > 0 && seed < 1) {
            // Scale the seed out
            seed *= 65536;
        }
    
        seed = Math.floor(seed);
        if(seed < 256) {
            seed |= seed << 8;
        }
    
        for(var i = 0; i < 256; i++) {
            var v;
            if (i & 1) {
                v = p[i] ^ (seed & 255);
            } else {
                v = p[i] ^ ((seed >> 8) & 255);
            }
    
            perm[i] = perm[i + 256] = v;
            gradP[i] = gradP[i + 256] = grad3[v % 12];
        }

        this.seed = seed;
    }

    // 2D simplex noise
    simplex2(xin: number, yin: number) : number {
        var n0, n1, n2; // Noise contributions from the three corners
        
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin - j + t;

        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if(x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
            i1 = 1; 
            j1 = 0;
        } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
            i1 = 0; 
            j1 = 1;
        }

        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1 + 2 * G2;
        
        // Work out the hashed gradient indices of the three simplex corners
        i &= 255;
        j &= 255;
        var gi0 = gradP[i + perm[j]];
        var gi1 = gradP[i + i1 + perm[j + j1]];
        var gi2 = gradP[i + 1 + perm[j + 1]];
        
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0*x0-y0*y0;
        if(t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
        }

        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if(t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot2(x1, y1);
        }

        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if(t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot2(x2, y2);
        }

        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70 * (n0 + n1 + n2);
    }


    // 3D simplex noise
    simplex3(xin: number, yin: number, zin:number) : number {
        var n0, n1, n2, n3; // Noise contributions from the four corners
  
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Hairy factor for 2D
        var i = Math.floor(xin+s);
        var j = Math.floor(yin+s);
        var k = Math.floor(zin+s);
    
        var t = (i + j + k) * G3;
        var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
        var y0 = yin - j + t;
        var z0 = zin - k + t;
    
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if(x0 >= y0) {
            if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
            else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
            else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
        } else {
            if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
            else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
            else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
        }

        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
    
        var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
        var y2 = y0 - j2 + 2 * G3;
        var z2 = z0 - k2 + 2 * G3;
    
        var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
        var y3 = y0 - 1 + 3 * G3;
        var z3 = z0 - 1 + 3 * G3;
    
        // Work out the hashed gradient indices of the four simplex corners
        i &= 255;
        j &= 255;
        k &= 255;
        var gi0 = gradP[i+   perm[j+   perm[k   ]]];
        var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
        var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
        var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];
    
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
        if(t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
        if(t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
        }
        var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
        if(t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
        }
        var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
        if(t3 < 0) {
            n3 = 0;
        } else {
            t3 *= t3;
            n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 32 * (n0 + n1 + n2 + n3);
    }




    // 2D Perlin Noise
    perlin2(x: number, y: number) : number {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y);
        // Get relative xy coordinates of point within that cell
        x = x - X; 
        y = y - Y;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; 
        Y = Y & 255;
    
        // Calculate noise contributions from each of the four corners
        var n00 = gradP[X+perm[Y]].dot2(x, y);
        var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
        var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
        var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);
    
        // Compute the fade curve value for x
        var u = fade(x);
    
        // Interpolate the four results
        return lerp(lerp(n00, n10, u), lerp(n01, n11, u), fade(y));
    }


    // 3D Perlin Noise
    perlin3 = function(x: number, y: number, z: number) : number {
        // Find unit grid cell containing point
        var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
        // Get relative xyz coordinates of point within that cell
        x = x - X; y = y - Y; z = z - Z;
        // Wrap the integer cells at 255 (smaller integer period can be introduced here)
        X = X & 255; Y = Y & 255; Z = Z & 255;
    
        // Calculate noise contributions from each of the eight corners
        var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
        var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
        var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
        var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
        var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
        var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
        var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
        var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);
    
        // Compute the fade curve value for x, y, z
        var u = fade(x);
        var v = fade(y);
        var w = fade(z);
    
        // Interpolate
        return lerp(
            lerp(
              lerp(n000, n100, u),
              lerp(n001, n101, u), w),
            lerp(
              lerp(n010, n110, u),
              lerp(n011, n111, u), w),
           v);
    }


//     float hash( float n )
// {
//     return fract(sin(n)*758.5453);
// }

// float noise( in vec3 x )
// {
//     vec3 p = floor(x);
//     vec3 f = fract(x); 
//     float n = p.x + p.y*57.0 + p.z*800.0;
//     float res = mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x), mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
// 		    mix(mix( hash(n+800.0), hash(n+801.0),f.x), mix( hash(n+857.0), hash(n+858.0),f.x),f.y),f.z);
//     return res;
// }

// float fbm( vec3 p )
// {
//     float f = 0.0;
//     f += 0.50000*noise( p ); p = p*2.02;
//     f -= 0.25000*noise( p ); p = p*2.03;
//     f += 0.12500*noise( p ); p = p*3.01;
//     f += 0.06250*noise( p ); p = p*3.04;
//     f += 0.03500*noise( p ); p = p*4.01;
//     f += 0.01250*noise( p ); p = p*4.04;
//     f -= 0.00125*noise( p );
//     return f/0.984375;
// }

    fract(n: number) : number {
        return n - Math.floor(n);
    }

    mix(x: number, y: number, a: number) : number {
        //x×(1−a)+y×a 
        return x * (1 - a) + y * a;
    }

    hash(n: number) : number {
        //fract: x - floor(x)
        let val = Math.sin(n) * 758.5453;
        return this.fract(val);
    }

    noise(x: number, y: number, z: number) : number {
        let p: vec3 = vec3.fromValues(Math.floor(x), Math.floor(y), Math.floor(z));
        let f: vec3 = vec3.fromValues(this.fract(x), this.fract(y), this.fract(z));
        let n: number = x + y * 57.0 + z * 800.0;
        let res: number = this.mix(this.mix( this.mix(this.hash(n + 0.0), this.hash(n + 1.0), f[0]), 
                                            this.mix(this.hash(n + 57.0), this.hash(n + 58.0), f[0]), f[1] ), 
                                            this.mix(this.mix( this.hash(n + 800.0), this.hash(n + 801.0), f[0]), 
                                            this.mix(this.hash(n + 857.0), this.hash(n + 858.0), f[0]), f[1]), f[2]);

        return res;
    }

    fbm3 = function(x: number, y: number, z: number) : number {
        let f: number = 0.0;
        let p: vec3 = vec3.fromValues(x, y, z);

        f += 0.50000 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(2.02, 2.02, 2.02));

        f -= 0.25000 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(2.03, 2.03, 2.03));

        f += 0.12500 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(3.01, 3.01, 3.01));

        f += 0.06250 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(3.04, 3.04, 3.04));

        f += 0.03500 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(4.01, 4.01, 4.01));

        f += 0.01250 * this.noise(p[0], p[1], p[2]);
        vec3.multiply(p, p, vec3.fromValues(4.04, 4.04, 4.04));

        f -= 0.00125 * this.noise(p[0], p[1], p[2]);

        return f / 0.984375;
    }

//     float noise3D(vec3 p)
// {
// 	return fract(sin(dot(p ,vec3(12.9898,78.233,126.7378))) * 43758.5453)*2.0-1.0;
// }

// float linear3D(vec3 p)
// {
// 	vec3 p0 = floor(p);
// 	vec3 p1x = vec3(p0.x+1.0, p0.y, p0.z);
// 	vec3 p1y = vec3(p0.x, p0.y+1.0, p0.z);
// 	vec3 p1z = vec3(p0.x, p0.y, p0.z+1.0);
// 	vec3 p1xy = vec3(p0.x+1.0, p0.y+1.0, p0.z);
// 	vec3 p1xz = vec3(p0.x+1.0, p0.y, p0.z+1.0);
// 	vec3 p1yz = vec3(p0.x, p0.y+1.0, p0.z+1.0);
// 	vec3 p1xyz = p0+1.0;
	
// 	float r0 = noise3D(p0);
// 	float r1x = noise3D(p1x);
// 	float r1y = noise3D(p1y);
// 	float r1z = noise3D(p1z);
// 	float r1xy = noise3D(p1xy);
// 	float r1xz = noise3D(p1xz);
// 	float r1yz = noise3D(p1yz);
// 	float r1xyz = noise3D(p1xyz);
	
// 	float a = mix(r0, r1x, p.x-p0.x);
// 	float b = mix(r1y, r1xy, p.x-p0.x);
// 	float ab = mix(a, b, p.y-p0.y);
// 	float c = mix(r1z, r1xz, p.x-p0.x);
// 	float d = mix(r1yz, r1xyz, p.x-p0.x);
// 	float cd = mix(c, d, p.y-p0.y);
	
	
// 	float res = mix(ab, cd, p.z-p0.z);
	
// 	return res;
// }

// float fbm(vec3 p)
// {
// 	float f = 0.5000*linear3D(p*1.0); 
// 		  f+= 0.2500*linear3D(p*2.01); 
// 		  f+= 0.1250*linear3D(p*4.02); 
// 		  f+= 0.0625*linear3D(p*8.03);
// 		  f/= 0.9375;
// 	return f;
// }
    
}
export default Noise;