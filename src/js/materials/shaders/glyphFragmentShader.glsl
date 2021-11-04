#include <fog_pars_fragment>

uniform sampler2D atlas;

varying vec2 vUv;

void main() {

	gl_FragColor = texture2D( atlas, vUv );

	#include <fog_fragment>

}