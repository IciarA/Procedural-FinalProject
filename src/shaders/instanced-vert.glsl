#version 300 es

uniform mat4 u_ViewProj;
uniform float u_Time;

uniform mat3 u_CameraAxes; // Used for rendering particles as billboards (quads that are always looking at the camera)
// gl_Position = center + vs_Pos.x * camRight + vs_Pos.y * camUp;

in vec4 vs_Pos; // Non-instanced; each particle is the same quad drawn in a different place
in vec4 vs_Nor; // Non-instanced, and presently unused
in vec4 vs_Col; // An instanced rendering attribute; each particle instance has a different color
in vec3 vs_Translate; // Another instance rendering attribute used to position each quad instance in the scene
in vec3 vs_Scale;
in vec2 vs_UV; // Non-instanced, and presently unused in main(). Feel free to use it for your meshes.

out vec4 fs_Col;
out vec4 fs_Pos;

mat4 rotateZ(float rad) {
    mat4 m = mat4(1.0);
    m[0][0] = cos(rad);
    m[1][0] = -sin(rad);
    m[0][1] = sin(rad);
    m[1][1] = cos(rad);
    return m;
}

void main()
{
    fs_Col = vs_Col;
    fs_Pos = vs_Pos;

    vec3 offset = vec3(vs_Translate.xy, 0.0);
    vec4 pos = vs_Pos; //vec3(vs_Pos.x, vs_Pos.y * 1.5, vs_Pos.z); // scale;
    pos = vec4(pos[0] * vs_Scale[1], pos[1] * vs_Scale[0], pos[2], 1.f);
    //offset.z = (sin((u_Time + offset.x) * 3.14159 * 0.1) + cos((u_Time + offset.y) * 3.14159 * 0.1)) * 1.5;

    //vec3 billboardPos = offset + vs_Pos.x * u_CameraAxes[0] + vs_Pos.y * u_CameraAxes[1];

    float angleZ = vs_Translate.z;
    //angleZ = angleZ * (3.1416 / 180.0);

    pos = rotateZ(angleZ) * pos;

    gl_Position = u_ViewProj * vec4(vec3(pos) + offset, 1.0);
}
