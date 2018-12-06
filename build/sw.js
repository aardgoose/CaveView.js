
console.log( 'sw started' );

var urlsToCache = [
	'/',
	'/CaveView/js/CaveView.js',
	'/CaveView/css/caveview.css',
	'/CaveView/images/icons.png',
	'/CaveView/images/disc.png',
	'/CaveView/images/ic_location.png',
	'/index.html',
	'/surveys/P8_Master.3d',
	'/surveys/P8_Master.json'
];

self.addEventListener( 'install', function ( event ) {
	// Perform install steps
	event.waitUntil(
		caches.open( 'cvtest9' )
			.then( function ( cache ) {
				console.log( 'Opened cache', cache );
				return cache.addAll( urlsToCache );
			} )

	);

} );

self.addEventListener( 'fetch', function ( event ) {
	event.respondWith(

		caches.match( event.request )
			.then ( function ( response ) {
				// Cache hit - return response
				if ( response ) {
					return response;
				}

				console.log( 'fetch', event, response );
				return fetch( event.request );

			} )

	);

});

