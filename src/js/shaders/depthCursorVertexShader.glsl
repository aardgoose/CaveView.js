#include <fog_pars_vertex>
#include <wall_vertex_pars>
#include <depth_vertex_pars>
varying float vCursor;

void main() {

	#include <wall_vertex>
	#include <depth_vertex>

	vCursor = vDepth;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	#include <fog_vertex>

}