#include <fog_pars_vertex>
#include <wall_vertex_pars>
#include <depth_vertex_pars>

void main() {

	#include <wall_vertex>
	#include <depth_vertex>

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * mvPosition;

	#include <fog_vertex>

}