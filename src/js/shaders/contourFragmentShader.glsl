
uniform vec3 contourColor;
uniform vec3 contourColor10;
uniform float contourInterval;

varying vec3 vPosition;

void main() {

	float f  = fract ( vPosition.z / contourInterval );
	float f10  = fract ( ( vPosition.z + 10.0 ) / ( contourInterval * 10.0 ) );

	float df = fwidth( vPosition.z / contourInterval );

	float contourColourSelection = step( 0.90, f10 );
	float c = 1.0 - smoothstep( df * 1.0, df * 2.0, f );

	gl_FragColor = vec4( c * mix( contourColor, contourColor10, contourColourSelection ), c );

}

