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
        this.geom.scale(0.2, 0.2, 0.2);


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
    }


    static #vertexShader;
    static #fragmentShader;
    static #positionShader;
    static #velocityShader;
    static fetchShaders() {
        // TODO: some sort of centralised loader
        const urls = [
            './assets/shaders/butterflies/vertex.glsl',
            './assets/shaders/butterflies/fragment.glsl',
            './assets/shaders/butterflies/position.glsl',
            './assets/shaders/butterflies/velocity.glsl',
        ];

        return Promise.all(
            urls.map(url => fetch(url).then(r => r.text()))
        ).then(([vert, frag, posn, velo]) => {
            Butterflies.#vertexShader = vert;
            Butterflies.#fragmentShader = frag;
            Butterflies.#positionShader = posn;
            Butterflies.#velocityShader = velo;
        });
    }

    initMesh() {
        this.material = new THREE.ShaderMaterial({
            vertexShader: Butterflies.#vertexShader,
            fragmentShader: Butterflies.#fragmentShader,
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

        const xmin = this.uniforms.boundsX.value.x;
        const width = this.uniforms.boundsX.value.y - xmin;
        const zmin = this.uniforms.boundsZ.value.x;
        const depth = this.uniforms.boundsZ.value.y - zmin;

        for (let i = 0, l = posnArr.length; i < l; i += 4) {
            posnArr[ i + 0 ] = xmin + Math.random() * width;
            posnArr[ i + 1 ] = Math.random() * 25;
            posnArr[ i + 2 ] = zmin + Math.random() * depth;
            posnArr[ i + 3 ] = 1;

            veloArr[ i + 0 ] = 0.5 - Math.random();
            veloArr[ i + 1 ] = 0.5 - Math.random();
            veloArr[ i + 2 ] = 0.5 - Math.random();
            veloArr[ i + 3 ] = 1;
        }


        this.posnVar = this.computer.addVariable(
            'texturePosition',
            Butterflies.#positionShader,
            posnTexture
        );

        this.veloVar = this.computer.addVariable(
            'textureVelocity',
            Butterflies.#velocityShader,
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
        if (!this.computer) return;

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