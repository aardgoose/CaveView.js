#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <location_fade_fragment_pars>

void main() {

	gl_FragColor = vec4( vColor, 1.0 );

	#include <location_fade_fragment>
	#include <fog_fragment>

}