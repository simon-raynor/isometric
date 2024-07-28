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