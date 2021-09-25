#define saturate(a) clamp( a, 0.0, 1.0 )

#include <fog_pars_vertex>

uniform sampler2D cmap;

uniform float minZ;
uniform float scaleZ;
uniform vec3 uLight;

varying vec3 vColor;
varying float zMap;
varying vec3 vMvPosition;

void main() {

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

	zMap = ( position.z - minZ ) * scaleZ;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	vMvPosition = mvPosition.xyz;

	gl_Position = projectionMatrix * mvPosition;

	#include <fog_vertex>

}