#define saturate(a) clamp( a, 0.0, 1.0 )
#include <fog_pars_vertex>

uniform vec3 uLight;

varying vec3 vColor;
varying float height;

void main() {

	vec3 sNormal = normalMatrix * normal;

	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

	height = position.z;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	#include <fog_vertex>

}
