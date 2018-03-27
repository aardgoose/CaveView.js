
uniform vec3 contourColor;
uniform vec3 contourColor10;
uniform float contourInterval;

varying float vPositionZ;

void main() {

	float f  = fract ( vPositionZ / contourInterval );
	float f10  = fract ( ( vPositionZ ) / ( contourInterval * 10.0 ) );

	float df = fwidth( vPositionZ / contourInterval );

	float contourColourSelection = step( 0.90, f10 );
	float c = 1.0 - smoothstep( df * 1.0, df * 2.0, f );

	vec3 finalColour = mix( contourColor, contourColor10, contourColourSelection );

	gl_FragColor = vec4( c * finalColour, c );

}

