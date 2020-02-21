import { CaveViewer } from './CaveViewer';

var viewer;

function init ( domID, configuration ) {

	viewer = new CaveViewer( domID, configuration );
	CV.Viewer = viewer;

}

var Viewer = {
	init: init
};

export { Viewer };