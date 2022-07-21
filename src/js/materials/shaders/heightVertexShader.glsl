#include <fog_pars_vertex>
#include <wall_vertex_pars>

uniform float minZ;
uniform float scaleZ;

varying float zMap;

void main() {

	#include <wall_vertex>

	zMap = ( position.z - minZ ) * scaleZ;

	#include <fog_vertex>

}