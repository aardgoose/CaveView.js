class TerrainMeshLoader {

	constructor ( tileSpec ) {

		const tileFile = `${tileSpec.url}${tileSpec.z}/${tileSpec.x}/${tileSpec.y}.terrain`;

		const options = {
			headers: {
				'Accept': 'application/vnd.quantized-mesh;extensions=octvertexnormals,metadata;q=0.9;access_token=' + tileSpec.accessToken
			}
		};

		return fetch( tileFile, options )
			.then( response => {
				if ( ! response.ok ) throw TypeError;
				return response.arrayBuffer();
			} );
	}

}

export { TerrainMeshLoader };