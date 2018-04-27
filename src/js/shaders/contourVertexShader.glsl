#define saturate(a) clamp( a, 0.0, 1.0 )

uniform float zAdjust;
uniform vec3 uLight;

varying float vPositionZ;
varying float vDotNL;

void main() {

	vDotNL = saturate( dot( normal, uLight ) );

	vPositionZ = position.z + zAdjust;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
