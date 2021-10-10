#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <cursor_fragment_pars>

varying float vDepth;

void main() {

	float vCursor = vDepth;

	#include <cursor_fragment>
	#include <fog_fragment>

}