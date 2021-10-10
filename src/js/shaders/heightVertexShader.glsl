#define saturate(a) clamp( a, 0.0, 1.0 )

#include <fog_pars_vertex>

uniform sampler2D cmap;

uniform float minZ;
uniform float scaleZ;

#include <wall_vertex_pars>

varying float zMap;
varying vec3 vMvPosition;

void main() {

	#include <wall_vertex>

	zMap = ( position.z - minZ ) * scaleZ;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	vMvPosition = mvPosition.xyz;

	gl_Position = projectionMatrix * mvPosition;

	#include <fog_vertex>

}