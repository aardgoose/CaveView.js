#define saturate(a) clamp( a, 0.0, 1.0 )

// uniform sampler2D cmap;

uniform float minZ;
uniform float scaleZ;
uniform float datumShift;
uniform vec3 uLight;

varying float zMap;
varying float vDotNL;

void main() {

	vDotNL = saturate( dot( normal, uLight ) );

	zMap = ( position.z - minZ - datumShift ) * scaleZ;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}