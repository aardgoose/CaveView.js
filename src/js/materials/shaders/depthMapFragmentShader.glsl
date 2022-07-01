#include <packRGBA>

varying float vHeight;

void main() {

	gl_FragColor = packFloatToRGBA( vHeight );

}