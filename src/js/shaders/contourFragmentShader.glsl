
uniform vec3 contourColor;
uniform vec3 contourColor10;
uniform float contourInterval;
uniform vec3 baseColor;
uniform float opacity;

varying float vPositionZ;
varying float vDotNL;

void main() {

	float f  = fract ( vPositionZ / contourInterval );
	float f10  = fract ( vPositionZ / ( contourInterval * 10.0 ) );

	float df = fwidth( vPositionZ / contourInterval );

	float contourColorSelection = step( 0.90, f10 );
	float c = smoothstep( df * 1.0, df * 2.0, f );

	vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );

	vec4 baseColorAlpha = vec4( baseColor, opacity );

	gl_FragColor = mix( finalColor, baseColorAlpha, c ) * vDotNL;

}

