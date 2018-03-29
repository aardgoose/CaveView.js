
uniform vec3 contourColor;
uniform vec3 contourColor10;
uniform float contourInterval;
uniform float opacity;

varying vec3 vBaseColor;
varying float vPositionZ;

void main() {

	float f  = fract ( vPositionZ / contourInterval );
	float f10  = fract ( vPositionZ / ( contourInterval * 10.0 ) );

	float df = fwidth( vPositionZ / contourInterval );

	float contourColorSelection = step( 0.90, f10 );
	float c = 1.0 - smoothstep( df * 1.0, df * 2.0, f );

	vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );

	vec4 baseColorAlpha = vec4( vBaseColor, opacity );

	gl_FragColor = mix( baseColorAlpha, finalColor, c );

}

