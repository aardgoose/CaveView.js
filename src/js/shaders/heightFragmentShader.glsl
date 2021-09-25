#include <fog_pars_fragment>

uniform sampler2D cmap;
uniform float distanceTransparency;

varying float zMap;
varying vec3 vColor;
varying vec3 vMvPosition;

void main() {

	gl_FragColor = texture2D( cmap, vec2( 1.0 - zMap, 1.0 ) ) * vec4( vColor, 1.0 );

	if ( distanceTransparency > 0.0 ) {

		gl_FragColor.a = 1.0 - length( vMvPosition.xyz ) / distanceTransparency;

	}

	#include <fog_fragment>

}