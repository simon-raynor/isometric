varying vec2 v_uv;

void main() {
    gl_FragColor = vec4(1.0 - v_uv.y, 1.0 - v_uv.x, v_uv.y - v_uv.x, 1.0);
}