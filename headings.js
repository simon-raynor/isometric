import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const FONT_SIZES = [
    25,
    20,
    15
]

export function getHeadingGeometry(heading, font) {
    const hNum = Number(heading.tagName.toLowerCase().replace('h', ''));

    const size = FONT_SIZES[hNum - 1];
    const depth = 2 * size / 5;

    const geom = new TextGeometry(
        heading.textContent.toUpperCase(),
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

    return geom;
}