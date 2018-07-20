
import alphaShape from 'alpha-shape';

onmessage = onMessage;

function onMessage ( event ) {

	const points = event.data.points;
	const alpha = event.data.alpha;
	const segment = event.data.segment;

	console.log( 'alphaWorker: points: ' + points.length + ' alpha: ' + alpha );

	const cells = alphaShape( alpha, points );

	postMessage( { status: 'ok', segment: segment, cells: cells } );

}
