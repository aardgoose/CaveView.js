
float zLine = vPositionZ / contourInterval;

float f = fract( zLine );
float f10 = fract( zLine / 10.0 );

float df = fwidth( zLine );

if ( f > 0.5 ) {

    f = 1.0 - f;
    f10 = 1.0 - f10;

}

float contourColorSelection = step( 0.91, f10 );

float c = smoothstep( df * 0.5, df * 1.0, f );

vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );
vec4 baseColorAlpha = vec4( baseColor, opacity );

diffuseColor = mix( finalColor, baseColorAlpha, c );