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