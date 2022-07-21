#include <fog_pars_vertex>
#include <wall_vertex_pars>
#include <depth_vertex_pars>

varying float vCursor;

void main() {

	#include <wall_vertex>
	#include <depth_vertex>
	#include <fog_vertex>

}