	// lighting for underground surfaces

	vec3 sNormal = normalMatrix * normal;
	float dotNL = dot( normalize( sNormal ), uLight );

	vColor = saturate( dotNL ) * color + vec3( 0.3, 0.3, 0.3 );

	vPosition = position;

	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

	gl_Position = projectionMatrix * mvPosition;