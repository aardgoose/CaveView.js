import { CaveLoader } from '../loaders/CaveLoader.js';

onmessage = onMessage;

function onMessage ( event ) {

	console.log( event );
	var file = event.data;

	console.log("load file:", file );

	var loader = new CaveLoader( _caveLoaded );

	loader.loadURL( file );

	function _caveLoaded( cave ) {

		postMessage( { status: "ok", survey: cave.getSurvey() } );

	}

}
