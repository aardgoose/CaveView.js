#include <fog_pars_fragment>
#include <wall_fragment_pars>

uniform sampler2D cmap;
varying float vDepth;

void main() {

	gl_FragColor = texture2D( cmap, vec2( vDepth, 1.0 ) ) * vec4( vColor, 1.0 );

	#include <fog_fragment>

}