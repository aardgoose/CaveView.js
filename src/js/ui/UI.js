import { CaveViewUI } from './CaveViewUI';

// export public interface
var UI = {
	init: function ( domID, configuration ) {
		CV.Viewer.init( domID, configuration );
		var UI = new CaveViewUI( CV.Viewer );
		CV.UI = UI;
	}
};

export { UI };