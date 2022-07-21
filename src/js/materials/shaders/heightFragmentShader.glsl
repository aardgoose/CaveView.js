#include <fog_pars_fragment>
#include <wall_fragment_pars>
#include <location_fade_fragment_pars>

uniform sampler2D cmap;

varying float zMap;

void main() {

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

	#include <location_fade_fragment>
	#include <fog_fragment>

}