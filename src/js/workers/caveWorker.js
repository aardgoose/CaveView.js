import { CaveLoader } from '../loaders/CaveLoader';

onmessage = onMessage;

function onMessage ( event ) {

	var file = event.data;

	var loader = new CaveLoader( _caveLoaded );

	loader.loadURL( file );

	function _caveLoaded( cave ) {

		postMessage( { status: 'ok', survey: cave.getSurvey() } );

	}

}
