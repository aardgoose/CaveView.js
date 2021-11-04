float f = fract( vPositionZ / contourInterval );if ( f > 0.5 ) f = 1.0 - f;
float f10 = fract( vPositionZ / ( contourInterval * 10.0 ) );
float df = fwidth( vPositionZ / contourInterval );
float contourColorSelection = step( 0.90, f10 );
float c = smoothstep( df * 0.5, df * 1.0, f );

vec4 finalColor = vec4( mix( contourColor, contourColor10, contourColorSelection ), 1.0 );
vec4 baseColorAlpha = vec4( baseColor, opacity );

diffuseColor = mix( finalColor, baseColorAlpha, c );