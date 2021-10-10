#include <fog_pars_vertex>
#include <wall_vertex_pars>
#include <depth_vertex_pars>

uniform float depthScale;

void main() {

	#include <wall_vertex>
	#include <depth_vertex>

	// depth below terrain for this vertex, scaled in 0.0 - 1.0 range

	vDepth *= depthScale;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * mvPosition;

	#include <fog_vertex>

}
