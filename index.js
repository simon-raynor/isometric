import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'three/addons/libs/stats.module.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { getHeadingGeometry } from './headings.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';


const stats = new Stats();
document.body.appendChild( stats.dom )


const scene = new THREE.Scene();


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.pixelRatio = window.devicePixelRatio;
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
    0.01,
    100000
);

camera.position.set(-100, 100, 100);
camera.lookAt(scene.position);



/* const controls = new OrbitControls( camera, renderer.domElement );
controls.target = new THREE.Vector3(0, 0, 0);
controls.update(); */





const composer = new EffectComposer( renderer );

const PIXEL_SIZE = 2;
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





const alight = new THREE.AmbientLight( 0x202020 ); // soft white light
scene.add( alight );

const dlight = new THREE.DirectionalLight( 0xffffff, 0.5 );
dlight.position.set(10, 100, 10);
scene.add( dlight );



const content = document.getElementById('content');
content.style.display = 'none'; // TODO: better to hide offscreen?



const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({
        color: 0x443322
    })
);
floor.rotateX(-Math.PI / 2);

scene.add(floor);



const letters = 'simon raynor'
                .toUpperCase()
                .split('');

const lettermeshes = [];

const floader = new FontLoader();
floader.load(
    './assets/font/LilitaOne_Regular.json',
    font => {
        const grp = new THREE.Group();

        const size = 10;
        const depth = 2 * size / 5;

        let left = 0;

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
                        new THREE.MeshPhongMaterial({
                            color: 0xffdd11
                        })
                    );

                    mesh.position.setY(100);
                    
                    mesh.position.setX(left);
                    left += /* 2 +  */geom.boundingBox.max.x;

                    grp.add(mesh);
                    lettermeshes.push(mesh);
                } else {
                    left += 3;
                }
            }
        );

        grp.position.setX(-left/2);

        scene.add(grp);
    }
);



function animate(_dt) {
    const dt = _dt / 1000;

    requestAnimationFrame(animate);

    //controls.update();
    stats.update();


    //trees.forEach(t => t.tick(dt));
    if (lettermeshes[0]) {
        if (lettermeshes[0].position.y <= 0) {
            lettermeshes.shift().position.setY(0);
        } else {
            lettermeshes[0].position.y -= dt;
        }
    }


    //renderer.render( scene, camera );
    composer.render( scene, camera );
}

animate();