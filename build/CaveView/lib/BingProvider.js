
/*
* BingProvider.js (c) Angus Sawyer, 2017.
*/


function BingProvider ( imagerySet ) {

	this.urlTemplate = null;
	this.subdomains = [];
	this.subdomainIndex = 0;
	this.subdomainCount = 0;

	var self = this;

	var metadata;

	var key = 'Ap8PRYAyAVcyoSPio8EaFtDEpYJVNwEA70GqYj31EXa6jkT_SduFHMKeHnvyS4D_';
	var metaUrlTemplate = 'http://dev.virtualearth.net/REST/v1/Imagery/Metadata/{imagerySet}?inc=imageryProviders&key={key}';

	var metaUrl = metaUrlTemplate.replace( '{key}', key ).replace( '{imagerySet}', imagerySet );

	var req = new XMLHttpRequest();

	req.responseType = 'json';

	req.addEventListener( 'load', _getTemplate );

	req.open( 'GET', metaUrl );
	req.send();

	return;

	function _getTemplate () {

		metadata = req.response;

		var rss = metadata.resourceSets;

		for ( var i = 0; i < rss.length; i++ ) {

			var rs = rss[ i ].resources;

			for ( var j = 0; j < rs.length; j++ ) {

				var r = rs[ j ];

				self.subdomains = r.imageUrlSubdomains;
				self.urlTemplate = r.imageUrl;

				self.subdomainCount = self.subdomains.length;

				return;

			}

		}

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

}
 
BingProvider.prototype.getAttribution = function () {

	var img = document.createElement( 'img' );

	img.src = 'https://www.microsoft.com/maps/images/branding/bing_maps_logo_white_125px_27px.png';
	img.classList.add( 'overlay-branding' );

	return img;

};

BingProvider.prototype.getUrl = function ( x, y, z ) {

	var urlTemplate = this.urlTemplate;

	if ( urlTemplate === null ) return null;

	var qk = BingProvider.quadkey( x, y, z );

	thissubdomainIndex = ++this.ubdomainIndex % this.subdomainCount;

	var url = urlTemplate.replace( '{subdomain}', this.subdomains[ this.subdomainIndex ] ).replace( '{quadkey}', qk );

	return url;

};

