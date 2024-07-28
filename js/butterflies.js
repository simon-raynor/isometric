import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';

/* const BFLY_VERTICES = [
    0, 0, 2,  -3, 0, 1,  0, 0, -2, // 0,1,2 - top left
    0, 0, 2,  0, 0, -2,  3, 0, 1, // 3,4,5 - top right
]; */
const BFLY_VERTICES = [
    0, 0, 0,  -4, 0, 1,  -3, 0, -3, // 0,1,2 - top left
    0, 0, 0,  3, 0, -3,  4, 0, 1, // 3,4,5 - top right
];
const BFLY_UVS = [
    0, 0,  1, 0,  0, 1,
    0, 0,  0, 1,  1, 0
];


const COMPUTE_TEX_WIDTH = 32;


export default class Butterflies {
    constructor(count = COMPUTE_TEX_WIDTH) {
        this.geom = new THREE.BufferGeometry();

        const vertices = [];
        const vertIndices = [];
        const uvs = [];
        const positions = [];

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                vertices.push(...BFLY_VERTICES);
                //vertIndices.push(...BFLY_VERTICES.map((v, idx) => idx));
                uvs.push(...BFLY_UVS);
                positions.push(
                    ...BFLY_UVS.map((v, idx) => (idx % 2) ? x / count : y / count)
                );

                for (let i = 0; i < BFLY_VERTICES.length; i += 3) {
                    vertIndices.push(i / 3);
                }
            }
        }


        this.geom.setAttribute(
            'position',
            new THREE.BufferAttribute(
                new Float32Array(vertices),
                3
            )
        );
        this.geom.setAttribute(
            'vidx',
            new THREE.BufferAttribute(
                new Float32Array(vertIndices),
                1
            )
        );
        this.geom.setAttribute(
            'uv',
            new THREE.BufferAttribute(
                new Float32Array(uvs),
                2
            )
        );
        this.geom.setAttribute(
            'posn',
            new THREE.BufferAttribute(
                new Float32Array(positions),
                2
            )
        );


        this.geom.rotateY(Math.PI / 2);
        this.geom.scale(0.1, 0.1, 0.1);


        this.uniforms = {
            t: { value: 0, type: 'f' },
            dt: { value: 0, type: 'f' },
            boundsX: { value: new THREE.Vector2(-20, 20) },
            boundsZ: { value: new THREE.Vector2(-10, 10) }
        };

        this.bflyUniforms = {
            texturePosition: { value: null },
            textureVelocity: { value: null },
        };
        
        this.material = new THREE.ShaderMaterial({
            vertexShader: `
            attribute float vidx;
            uniform float t;

            varying vec2 v_uv;

            uniform sampler2D texturePosition;
            uniform sampler2D textureVelocity;

            attribute vec2 posn;

            void main() {
                vec3 newPosn = position;

                vec3 pos = texture2D( texturePosition, posn ).xyz;
                vec3 velocity = normalize(texture2D( textureVelocity, posn ).xyz);

                float flap = (t + posn.x) * 15.0;

                float sinf1 = sin(flap);
                float cosf1 = cos(flap);
                mat3 flapmat1 = mat3(
                    1, 0, 0,
                    0, cosf1, -sinf1,
                    0, sinf1, cosf1
                );

                float sinf2 = sin(-flap);
                float cosf2 = cos(-flap);
                mat3 flapmat2 = mat3(
                    1, 0, 0,
                    0, cosf2, -sinf2,
                    0, sinf2, cosf2
                );

                if (
                    vidx == 1.0
                    || vidx == 2.0
                ) {
                    newPosn = newPosn * flapmat1;
                } else if (
                    vidx == 4.0
                    || vidx == 5.0
                ) {
                    newPosn = newPosn * flapmat2;
                }

                newPosn = mat3(modelMatrix) * newPosn;

                velocity.z *= -1.;
                float xz = length( velocity.xz );
                float xyz = 1.;
                float x = sqrt( 1. - velocity.y * velocity.y );

                float cosry = velocity.x / xz;
                float sinry = velocity.z / xz;

                float cosrz = x / xyz;
                float sinrz = velocity.y / xyz;

                mat3 maty =  mat3(
                    cosry, 0, -sinry,
                    0    , 1, 0     ,
                    sinry, 0, cosry
                );

                mat3 matz =  mat3(
                    cosrz , sinrz, 0,
                    -sinrz, cosrz, 0,
                    0     , 0    , 1
                );

                newPosn =  maty * matz * newPosn;

                newPosn += pos;

                gl_Position = projectionMatrix * viewMatrix * vec4(newPosn, 1.0);
                v_uv = uv;
            }
            `,
            fragmentShader: `
            varying vec2 v_uv;

            void main() {
                gl_FragColor = vec4(1.0 - v_uv.y, 1.0 - v_uv.x, v_uv.y - v_uv.x, 1.0);
            }
            `,
            uniforms: {
                ...this.uniforms,
                ...this.bflyUniforms
            },
            side: THREE.DoubleSide
        })

        this.mesh = new THREE.Mesh(
            this.geom,
            this.material
        );
    }

    initComputeRenderer(renderer) {
        this.computer = new GPUComputationRenderer(
            COMPUTE_TEX_WIDTH,
            COMPUTE_TEX_WIDTH,
            renderer
        );

        const posnTexture = this.computer.createTexture();
        const veloTexture = this.computer.createTexture();

        // fill textures
        const posnArr = posnTexture.image.data;
        const veloArr = veloTexture.image.data;

        for (let i = 0, l = posnArr.length; i < l; i += 4) {
            posnArr[ i + 0 ] = 25 - Math.random() * 50;
            posnArr[ i + 1 ] = Math.random() * 25;
            posnArr[ i + 2 ] = 25 - Math.random() * 50;
            posnArr[ i + 3 ] = 1;

            veloArr[ i + 0 ] = 0.5 - Math.random();
            veloArr[ i + 1 ] = 0.5 - Math.random();
            veloArr[ i + 2 ] = 0.5 - Math.random();
            veloArr[ i + 3 ] = 1;
        }


        this.posnVar = this.computer.addVariable(
            'texturePosition',
            `
            uniform float t;
            uniform float dt;

            void main() {

                vec2 uv = gl_FragCoord.xy / resolution.xy;
                vec4 tmpPos = texture2D( texturePosition, uv );
                vec3 position = tmpPos.xyz;
                vec3 velocity = texture2D( textureVelocity, uv ).xyz;

                float phase = tmpPos.w;

                phase = mod( ( phase + dt +
                    length( velocity.xz ) * dt * 3. +
                    max( velocity.y, 0.0 ) * dt * 6. ), 62.83 );

                gl_FragColor = vec4( position + velocity * dt * 15., phase );
            }
            `,
            posnTexture
        );

        this.veloVar = this.computer.addVariable(
            'textureVelocity',
            `
            uniform float t;
            uniform float dt;
            uniform vec2 boundsX;
            uniform vec2 boundsZ;

            const float width = resolution.x;
            const float height = resolution.y;

            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;

                vec3 myPosition = texture2D( texturePosition, uv ).xyz;
                vec3 myVelocity = texture2D( textureVelocity, uv ).xyz;

                if (myPosition.x < boundsX.x) {
                    myVelocity.x += 0.05;
                    myVelocity.y += 0.01;
                } else if (myPosition.x > boundsX.y) {
                    myVelocity.x -= 0.05;
                    myVelocity.z -= 0.01;
                }

                if (myPosition.y < 0.0) {
                    myVelocity.y += 0.01;
                    myVelocity.z += 0.01;
                } else if (myPosition.y > 10.0) {
                    myVelocity.y -= 0.01;
                    myVelocity.x -= 0.01;
                }

                if (myPosition.z < boundsZ.x) {
                    myVelocity.z += 0.05;
                    myVelocity.x += 0.01;
                } else if (myPosition.z > boundsZ.y) {
                    myVelocity.z -= 0.05;
                    myVelocity.y -= 0.01;
                }

                if (length(myVelocity.xyz) > 1.0) {
                    myVelocity *= 1.0 / length(myVelocity.xyz);
                }

                gl_FragColor = vec4( myVelocity, 1.0 );
            }
            `,
            veloTexture
        );

        this.computer.setVariableDependencies( this.posnVar, [ this.posnVar, this.veloVar ]);
        this.computer.setVariableDependencies( this.veloVar, [ this.posnVar, this.veloVar ]);

        this.posnVar.material.uniforms = this.uniforms;
        this.veloVar.material.uniforms = this.uniforms;

        this.posnVar.wrapS = THREE.RepeatWrapping;
        this.posnVar.wrapT = THREE.RepeatWrapping;
        this.veloVar.wrapS = THREE.RepeatWrapping;
        this.veloVar.wrapT = THREE.RepeatWrapping;

        const error = this.computer.init();
        if (error !== null) console.error(error);
    }

    setBounds(minx, maxx, minz, maxz) {
        this.uniforms.boundsX.value.set(minx, maxx);
        this.uniforms.boundsZ.value.set(minz, maxz);
    }

    tick(dt) {
        this.uniforms.t.value += dt;
        this.uniforms.dt.value = dt;

        this.computer.compute();

        this.bflyUniforms.texturePosition.value = this.computer.getCurrentRenderTarget(
            this.posnVar
        ).texture;
        this.bflyUniforms.textureVelocity.value = this.computer.getCurrentRenderTarget(
            this.veloVar
        ).texture;
    }
}