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
    } else if (myPosition.y > 25.0) {
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