	// get terrain height in model space

	vec2 terrainCoords = vec2( ( position.x - modelMin.x ) * scaleX, ( position.y - modelMin.y ) * scaleY );
	float terrainHeight = unpackRGBAToFloat( texture2D( depthMap, terrainCoords ) );

	terrainHeight = terrainHeight * rangeZ + modelMin.z + datumShift;

	vDepth = ( terrainHeight - position.z );