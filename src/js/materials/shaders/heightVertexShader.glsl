#include <fog_pars_vertex>
#include <wall_vertex_pars>

uniform sampler2D cmap;
uniform float minZ;
uniform float scaleZ;

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