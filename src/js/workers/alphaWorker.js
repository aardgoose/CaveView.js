
import alphaShape from '../../../node_modules/alpha-shape/alpha';

onmessage = onMessage;

function onMessage ( event ) {

	const points = event.data.points;
	const alpha = event.data.alpha;

	console.log( 'alphaWorker: points: ' + points.length + ' alpha: ' + alpha );

	const cells = alphaShape( alpha, points );

	postMessage( { status: 'ok', cells: cells } );

}
