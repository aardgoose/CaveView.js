
/*
* BingProvider.js (c) Angus Sawyer, 2017.
*/


function BingProvider ( imagerySet, key ) {

	this.urlTemplate = null;
	this.subdomains = [];
	this.subdomainIndex = 0;
	this.subdomainCount = 0;

	this.minZoom = null;
	this.maxZoom = null;

	// attribution DOM (added to async)
	var div = document.createElement( 'div' );

	div.classList.add( 'overlay-branding' );
	div.style.lineHeight = '30px';

	this.attribution = div;
	this.OS = ( imagerySet === 'OrdnanceSurvey' );

	var self = this;

	var metadata;

	var uriScheme = window.location.protocol.replace( ':' , '' );

	var metaUrlTemplate = uriScheme + '://dev.virtualearth.net/REST/v1/Imagery/Metadata/{imagerySet}?include=imageryProviders&uriScheme={uriScheme}&key={key}';

	var metaUrl = metaUrlTemplate.replace( '{key}', key ).replace( '{imagerySet}', imagerySet ).replace( '{uriScheme}', uriScheme );

	var req = new XMLHttpRequest();

	req.open( 'GET', metaUrl );

	req.responseType = 'text';

	req.addEventListener( 'load', _getTemplate );

	req.send();

	return;

	function _getTemplate () {

		metadata = JSON.parse( req.response );

		var rss = metadata.resourceSets;


		for ( var i = 0; i < rss.length; i++ ) {

			var rs = rss[ i ].resources;

			for ( var j = 0; j < rs.length; j++ ) {

				var r = rs[ j ];

				self.subdomains = r.imageUrlSubdomains;
				self.urlTemplate = r.imageUrl;

				self.minZoom = r.zoomMin;
				self.maxZoom = r.zoomMax;

				self.subdomainCount = self.subdomains.length;

				_setAttribution( r );

				return;

			}

		}

	}

	function _setAttribution( resourceSet ) {

		var span = document.createElement( 'span' );

		span.style.paddingRight = '4px';

		if ( self.OS ) {

			span.textContent = 'Ordnance Survey © Crown Copyright 2017';

		} else {

			span.textContent = resourceSet.imageryProviders[ 0 ].attribution;

		}

		self.attribution.appendChild( span );

		var img = document.createElement( 'img' );

		img.src = metadata.brandLogoUri;
		img.style.backgroundColor = 'white';
		img.style.verticalAlign = 'middle';

		self.attribution.appendChild ( img );

	}

}

BingProvider.quadkey = function ( x, y, z ) {

	var quadKey = [];

	for ( var i = z; i > 0; i-- ) {

		var digit = '0';
		var mask = 1 << ( i - 1 );

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

};

BingProvider.prototype.getAttribution = function () {

	return this.attribution;

};

BingProvider.prototype.getUrl = function ( x, y, z ) {

	var urlTemplate = this.urlTemplate;

	if ( urlTemplate === null ) return null;

	var qk = BingProvider.quadkey( x, y, z );

	this.subdomainIndex = ++this.subdomainIndex % this.subdomainCount;

	var url = urlTemplate.replace( '{subdomain}', this.subdomains[ this.subdomainIndex ] ).replace( '{quadkey}', qk );

	return url;

};

