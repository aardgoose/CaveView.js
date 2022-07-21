	// lighting for underground surfaces

	vec3 sNormal = normalMatrix * normal;
	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

	vPosition = position;
