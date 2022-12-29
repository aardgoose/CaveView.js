class HeightMapLoader {

	constructor ( tileSpec ) {

		const tileSet = tileSpec.tileSet;
		const clip = tileSpec.clip;

		let x, y, z;

		if ( tileSpec.z > tileSet.maxZoom ) {

			const scale = Math.pow( 2, tileSpec.z - tileSet.maxZoom );

			x = Math.floor( tileSpec.x / scale );
			y = Math.floor( tileSpec.y / scale );
			z = tileSet.maxZoom;

			// calculate offset in terrain cells of covering DTM tile for this smaller image tile.

			const divisions = tileSet.divisions;

			const dtmOffsetX = ( divisions * ( tileSpec.x % scale ) ) / scale;
			const dtmOffsetY = ( divisions + 1 ) * ( divisions * ( tileSpec.y % scale ) ) / scale;

			clip.dtmOffset = dtmOffsetY + dtmOffsetX;
			clip.dtmWidth = divisions + 1;

		} else {

			x = tileSpec.x;
			y = tileSpec.y;
			z = tileSpec.z;

			clip.dtmOffset = 0;

		}

		const tileFile = `${tileSet.directory}/${z}/DTM-${x}-${y}.bin`;

		return fetch( tileFile )
			.then( response => {
				if ( ! response.ok ) throw TypeError;
				return response.arrayBuffer();
			} );

	}

}

export { HeightMapLoader };