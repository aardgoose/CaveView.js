
/*
* BingProvider.js (c) Angus Sawyer, 2017.
*/

class BingProvider {

	crsSupported = [ 'EPSG:3857' ];

	constructor ( imagerySet, key ) {

		this.urlTemplate = null;
		this.subdomains = [];
		this.subdomainIndex = 0;
		this.subdomainCount = 0;

		this.minZoom = null;
		this.maxZoom = null;

		// attribution DOM (added to async)
		const div = document.createElement( 'div' );

		div.classList.add( 'overlay-branding' );
		div.style.lineHeight = '30px';

		this.attribution = div;
		this.OS = ( imagerySet === 'OrdnanceSurvey' );

		// coverage in WGS84
		if ( this.OS ) {

			this.coverage = {
				minX: -8,
				minY: 50,
				maxX: 2,
				maxY: 62
			};

		} else {

			this.coverage = {
				minX: -180,
				minY: -90,
				maxX: 180,
				maxY: 90
			};

		}

		const self = this;
		const uriScheme = window.location.protocol.replace( ':' , '' );
		const metaUrl = uriScheme + `://dev.virtualearth.net/REST/v1/Imagery/Metadata/${imagerySet}?include=imageryProviders&uriScheme=${uriScheme}&key=${key}`;
		const req = new XMLHttpRequest();

		req.open( 'GET', metaUrl );
		req.responseType = 'text';
		req.addEventListener( 'load', () => {

			const metadata = JSON.parse( req.response );

			const rss = metadata.resourceSets;

			for ( let i = 0; i < rss.length; i++ ) {

				const rs = rss[ i ].resources;

				for ( let j = 0; j < rs.length; j++ ) {

					const r = rs[ j ];

					this.subdomains = r.imageUrlSubdomains;
					this.urlTemplate = r.imageUrl;

					this.minZoom = r.zoomMin;
					this.maxZoom = r.zoomMax;
					this.subdomainCount = this.subdomains.length;

					_setAttribution( metadata, r );

					if ( this.OS ) {

						// work around for poor values for OS Maps
						this.minZoom = 13;
						this.maxZoom = 17;

					}

				}

			}

		} );

		req.send();

		return;

		function _setAttribution( metadata, resourceSet ) {

			const span = document.createElement( 'span' );

			span.style.paddingRight = '4px';

			if ( self.OS ) {

				span.textContent = 'Ordnance Survey © Crown Copyright 2022';

			} else {

				span.textContent = resourceSet.imageryProviders[ 0 ].attribution;

			}

			self.attribution.appendChild( span );

			const img = document.createElement( 'img' );

			img.src = metadata.brandLogoUri.replace( /^https?:/, window.location.protocol );
			img.style.backgroundColor = 'white';
			img.style.verticalAlign = 'middle';

			self.attribution.appendChild ( img );

		}

	}

	quadkey ( x, y, z ) {

		const quadKey = [];

		for ( let i = z; i > 0; i-- ) {

			const mask = 1 << ( i - 1 );
			let digit = '0';

			if ( ( x & mask ) != 0 ) {

				digit++;

			}

			if ( ( y & mask ) != 0 ) {

				digit++;
				digit++;

			}

			quadKey.push( digit );

		}

		return quadKey.join( '' );

	}

	getAttribution () {

		return this.attribution;

	}

	getUrl ( x, y, z ) {

		const urlTemplate = this.urlTemplate;

		if ( urlTemplate === null ) return null;

		this.subdomainIndex = ++this.subdomainIndex % this.subdomainCount;

		return urlTemplate
			.replace( '{subdomain}', this.subdomains[ this.subdomainIndex ] )
			.replace( '{quadkey}', this.quadkey( x, y, z ) );

	}

}
