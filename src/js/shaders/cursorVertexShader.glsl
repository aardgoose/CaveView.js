#define saturate(a) clamp( a, 0.0, 1.0 )

#include <fog_pars_vertex>
#include <wall_vertex_pars>

varying float vCursor;

void main() {

	#include <wall_vertex>

	vCursor = position.z;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

	#include <fog_vertex>

}
