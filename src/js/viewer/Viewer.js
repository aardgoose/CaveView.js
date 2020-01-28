
import { CaveViewer } from './CaveViewer';

// export public interface

var viewer;

function init ( domID, configuration ) {

	viewer = new CaveViewer( domID, configuration );
	CV.Viewer = viewer;

}

var Viewer = {
	init: init
};

export { Viewer };

// EOF