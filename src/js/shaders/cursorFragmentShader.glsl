#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <cursor_fragment_pars>

varying float height;

void main() {

	float vCursor = height;

	#include <cursor_fragment>
	#include <fog_fragment>

}