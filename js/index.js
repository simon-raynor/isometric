import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import Butterflies from './butterflies.js';


const stats = new Stats();
document.body.appendChild( stats.dom )


const scene = new THREE.Scene();


const renderer = new THREE.WebGLRenderer();
//renderer.pixelRatio = window.devicePixelRatio;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
//renderer.shadowMap.enabled = true;

document.getElementById('stage').appendChild(renderer.domElement);

const aspect = window.innerWidth / window.innerHeight;

/* const camera = new THREE.PerspectiveCamera(
    75,
    aspect,
    0.1,
    2500
); */

const d = 25;

const camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    0.0001,
    20000
);

camera.position.set(0, 3000, 4000);
camera.lookAt(scene.position);



const controls = new OrbitControls( camera, renderer.domElement );
controls.target = new THREE.Vector3(0, 0, 0);
controls.update();





const composer = new EffectComposer( renderer );

const PIXEL_SIZE = 2 * window.devicePixelRatio;
const pixelPass = new RenderPixelatedPass(PIXEL_SIZE, scene, camera);
pixelPass.normalEdgeStrength = 0.05;
pixelPass.depthEdgeStrength = 0.1;

composer.addPass(
    pixelPass
);

const bloomPass = new UnrealBloomPass(
    new THREE.Vector2( window.innerWidth, window.innerHeight ),
    1.5,
    0.4,
    0.85
);
bloomPass.threshold = 0.25;
bloomPass.strength = 0.33;
bloomPass.radius = 0;

composer.addPass(bloomPass);

composer.addPass(
    new OutputPass()
);





const alight = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( alight );

const dlight = new THREE.DirectionalLight( 0xffffff, 1 );
dlight.position.set(10, 1000, 100);
scene.add( dlight );



const content = document.getElementById('content');
content.style.display = 'none'; // TODO: better to hide offscreen?



const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({
        color: 0x442211,
        visible: false
    })
);
floor.rotateX(-Math.PI / 2);

scene.add(floor);

composer.render( scene, camera );




const screenCorners = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1]
];

const raycaster = new THREE.Raycaster();

const planeCorners = screenCorners.map(
    ([x, y]) => {
        raycaster.setFromCamera({x, y}, camera);

        const hits = raycaster.intersectObject(floor, false);
        console.log([x, y], hits);

        if (hits[0]) {
            /* const s = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshBasicMaterial()
            );
            s.position.copy(hits[0].point);
            scene.add(s); */

            return new THREE.Vector3().copy(hits[0].point);
        }
    }
);

const minx = Math.min.apply(null, planeCorners.map(v => v.x));
const minz = Math.min.apply(null, planeCorners.map(v => v.z));
const maxx = Math.max.apply(null, planeCorners.map(v => v.x));
const maxz = Math.max.apply(null, planeCorners.map(v => v.z));

const planewidth = maxx - minx;


/* document.body.addEventListener(
    'click',
    evt => {
        const x = (evt.pageX / window.innerWidth) * 2 - 1;
        const y = 1 - (evt.pageY / window.innerHeight) * 2;
        raycaster.setFromCamera({x, y}, camera);

        const hits = raycaster.intersectObject(floor, false);
        console.log([x, y], hits);

        if (hits[0]) {
            const s = new THREE.Mesh(
                new THREE.SphereGeometry(1),
                new THREE.MeshBasicMaterial()
            );
            s.position.copy(hits[0].point);
            scene.add(s);
        }
    }
) */




/* document.body.addEventListener(
    'wheel',
    evt => {
        console.log(evt);
        camera.position.z += evt.deltaY / 10;
    }
) */




const butterflies = new Butterflies();
console.log(butterflies);
scene.add(butterflies.mesh);

butterflies.initComputeRenderer(renderer);

butterflies.setBounds(
    minx,
    maxx,
    minz,
    maxz
);




const letters = 'simon raynor'
                .toUpperCase()
                .split('');

const lettermeshes = [];




const floader = new FontLoader();

const fontPromise = new Promise(
    (resolve, reject) => {
        floader.load(
            './assets/font/LilitaOne_Regular.json',
            resolve
        );
    }
);

const tloader = new THREE.TextureLoader();

const texturePromise = new Promise(
    (resolve, reject) => {
        tloader.load(
            './assets/img/test.png',
            resolve
        );
    }
)


Promise.all([
    fontPromise,
    texturePromise
]).then(([font, texture]) => {
    const grp = new THREE.Group();

    const size = 10;
    const depth = 2 * size / 5;

    let left = 0;

    //texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    letters.forEach(
        (letter, idx) => {
            if (letter.trim()) {
                const geom = new TextGeometry(
                    letter,
                    {
                        font,
                        size,
                        depth,
                        bevelEnabled: true,
                        bevelThickness: size / 50,
                        bevelSize: size / 50,
                        bevelOffset: 0,
                        bevelSegments: 1
                    }
                );
                geom.computeBoundingSphere();
                geom.computeBoundingBox();
        
                const mesh = new THREE.Mesh(
                    geom,
                    new THREE.MeshLambertMaterial({
                        //color: 0xffdd11,
                        map: texture
                        //emissive: 0xccbb00
                    })
                );

                mesh.position.setY(50);
                
                mesh.position.setX(left);
                left += /* 2 +  */geom.boundingBox.max.x;

                grp.add(mesh);
                lettermeshes.push(mesh);
            } else {
                left += 3;
            }
        }
    );

    const boundingBox = new THREE.Box3().setFromObject(grp);
    const scale = planewidth / (boundingBox.max.x - boundingBox.min.x);
    
    grp.children.forEach(
        letter => {
            letter.geometry.scale(scale, scale, scale);
            letter.position.multiplyScalar(scale)
        }
    )

    grp.position.setX(-left*scale/2);

    scene.add(grp);
});



let t = 0;

function animate(_t) {
    const dt = (_t - t) / 1000;
    t = _t;

    requestAnimationFrame(animate);



    //controls.update();
    stats.update();

    butterflies.tick(dt);

    //trees.forEach(t => t.tick(dt));
    if (lettermeshes[0]) {
        if (lettermeshes[0].position.y <= 0) {
            lettermeshes.shift().position.setY(0);
        } else {
            lettermeshes[0].position.y -= dt * 200;
        }
    }


    //renderer.render( scene, camera );
    composer.render( scene, camera );
}

animate(t);