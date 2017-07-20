
/*
* BingProvider.js (c) Angus Sawyer, 2017.
*/

function BingProvider ( metaUrl ) {

	var urlTemplate;
	var subdomains = [];
	var subdomainIndex = 0;
	var subdomainCount = 0;
	var metadata;

	var req = new XMLHttpRequest();

	req.responseType = 'json';

	req.addEventListener( 'load', function ( ev ) { metadata = req.response } );

	req.open( 'GET', metaUrl );
	req.send();

	function quadkey ( x, y, z ) {

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

	function getTemplate () {

		var rss = metadata.resourceSets;

		for ( var i = 0; i < rss.length; i++ ) {

			var rs = rss[ i ].resources;

			for ( var j = 0; j < rs.length; j++ ) {

				var r = rs[ j ];

				subdomains = r.imageUrlSubdomains;
				urlTemplate = r.imageUrl;
				subdomainCount = subdomains.length;

				return;

			}

		}

	}

	return function BingProvider( x, y, z ) {

		if ( metadata === undefined ) return false;

		if ( urlTemplate === undefined ) getTemplate();

		var qk = quadkey( x, y, z );

		subdomainIndex = ++subdomainIndex % subdomainCount;

		var url = urlTemplate.replace( '{subdomain}', subdomains[ subdomainIndex ] ).replace( '{quadkey}', qk );

		return url;

	};

};

function getBingProvider( imagerySet ) {

	var key = 'Ap8PRYAyAVcyoSPio8EaFtDEpYJVNwEA70GqYj31EXa6jkT_SduFHMKeHnvyS4D_';
	var metaUrlTemplate = 'http://dev.virtualearth.net/REST/v1/Imagery/Metadata/{imagerySet}?key={key}';

	var metaUrl = metaUrlTemplate.replace( '{key}', key ).replace( '{imagerySet}', imagerySet );

	return BingProvider( metaUrl );

}
