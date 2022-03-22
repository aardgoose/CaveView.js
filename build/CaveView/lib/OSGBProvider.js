'use strict';

class OSGBProvider {

	crsSupported = [ 'EPSG:3857' ];

	minZoom = 12;
	maxZoom = 18;

	coverage = {
		minX: -8,
		minY: 50,
		maxX: 2,
		maxY: 62
	};

	constructor ( tokenSource ) {

		this.tokenSource = tokenSource;
	}

	getPromise ( x, y, z ) {

		if ( ! this.tokenPromise ) {
			// FIXME add error handling
			this.tokenPromise = new Promise( resolve => {

				if ( this.accessToken ) {

					resolve( this.accessToken );

				} else {

					resolve(
						fetch( this.tokenSource, { mode: 'no-cors' } ).then( response => response.json() ).then( osToken => {

							this.accessToken = osToken.access_token;
							return this.accessToken;

						} )
					);

				}

			} );

		}

		return this.tokenPromise.then( accessToken => {

			const fetchOptions = { headers: { 'Authorization': 'Bearer ' + accessToken } };
			const srcUrl = `https://api.os.uk/maps/raster/v1/zxy/Outdoor_3857/${z}/${x}/${y}.png`;

			return fetch ( srcUrl, fetchOptions )
				.then( response => {

					if ( response.ok ) {

						return response.blob();

					} else {

						throw new Error( response.status );

					}

				} )
				.then( blob => URL.createObjectURL( blob ) )
				.catch( err => {
					if ( err.message == 429 ) {

						console.log( 'exceeded allowance' );

					} else if ( err.message == 401 ) {

						this.accessToken = undefined;
						this.tokenPromise = undefined;
						return this.getPromise( x, y, x);

					}
				} );

		} );

	}

	getAttribution () {

		const a = document.createElement( 'a' );

		a.href = 'http://www.bgs.ac.uk/data/services/wms.html';
		a.textContent = 'Contains British Geological Survey materials © NERC 2017';

		return a;

	}

}
