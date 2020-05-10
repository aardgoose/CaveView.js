
onmessage = onMessage;


function onMessage ( event ) {

	const data = event.data;

	const legs = data.legs;
	const limits = data.limits;

	const l = legs.length;
	var i;
	var lastV2 = null;
	var path = '';
	var points = '';

	// FIXME - use polylines
	for ( i = 0; i < l; ) {

		const v1 = legs[ i++ ];
		const v2 = legs[ i++ ];

		if ( v1 != lastV2 ) {

			if ( points !== '' ) path += '<polyline points="' + points + '"  fill="none" />';
			points += v1.x + ',' + -v1.y + ' ';

		}

		points += v2.x + ',' + -v2.y + ' ';
		lastV2 = v2;

	}

	if ( points !== null ) path += path + '<polyline points="' + points + '"/>';

	//path += ' z';

	const viewbox = limits.min.x + ' ' + limits.min.y + ' ' + limits.max.x * 2 + ' ' + limits.max.y * 2;
	const test = '<svg viewBox="' + viewbox + '" xmlns="http://www.w3.org/2000/svg">' + path + '</svg>';

	postMessage( { status: 'ok', svg: test } );

}
