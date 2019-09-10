import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	/* SHADING_BECK, */ VIEW_PLAN,
} from '../core/constants';

import { Page } from './Page';
import { Viewer } from '../viewer/Viewer';

var avenControls;
var fileSelector;

function initKeyboardControls ( fileSelectorIn, avenControlsIn ) {

	avenControls = avenControlsIn;
	fileSelector = fileSelectorIn;

	document.addEventListener( 'keydown', keyDown );

}

function keyDown ( event ) {

	if ( ! Viewer.surveyLoaded ) return;

	if ( handleKeyCommon( event ) ) return;

	if ( avenControls ) {

		handleKeyAven( event );

	} else {

		handleKeyDefault( event );

	}

}

function handleKeyAven( event ) {

	if ( event.ctrlKey ) {

		switch ( event.keyCode ) {

		case 66: // '<ctrl>B'

			Viewer.box = ! Viewer.box;

			break;

		case 69: // 'E' - mouse wheel tilt

			event.preventDefault();
			Viewer.wheelTilt = ! Viewer.wheelTilt;

			break;

		case 70: // '<ctrl>F'

			event.preventDefault();
			if ( Viewer.hasSurfaceLegs ) Viewer.surfaceLegs = ! Viewer.surfaceLegs;

			break;

		case 76: // '<ctrl>L'

			event.preventDefault();
			if ( Viewer.hasLegs ) Viewer.legs = ! Viewer.legs;

			break;

		case 78: // '<ctrl>N' (not available in Chrome)

			event.preventDefault();
			if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

			break;

		case 88: // '<ctrl>X'

			Viewer.stations = ! Viewer.stations;
			break;

		}

	} else {

		switch ( event.keyCode ) {

		case 46: // '<delete>' reset view

			Viewer.reset = true;

			break;

		case 13:

			Viewer.autoRotate = true;

			break;

		case 32:

			Viewer.autoRotate = ! Viewer.autoRotate;

			break;

		case 76: // 'L' - plan

			Viewer.polarAngle = Math.PI / 2;

			break;

		case 69: // 'E' - East

			Viewer.azimuthAngle = 3 * Math.PI / 2;

			break;

		case 78: // 'N' - North

			Viewer.azimuthAngle = 0;

			break;

		case 80: // 'P' - plan

			Viewer.polarAngle = 0;

			break;

		case 82: // 'R' - reverse rotation direction

			Viewer.autoRotateSpeed *= -1;

			break;

		case 83: // 'S' - South

			Viewer.azimuthAngle = Math.PI;

			break;

		case 87: // 'W' - West

			Viewer.azimuthAngle = Math.PI / 2;

			break;

		case 88: // 'X' - decrease rotation speed

			Viewer.autoRotateSpeed -= 0.1;

			break;

		case 90: // 'Z' - increase rotation speed

			Viewer.autoRotateSpeed += 0.1;

			break;

		}

	}

}

function handleKeyDefault( event ) {

	if ( event.ctrlKey ) return;

	switch ( event.keyCode ) {

	case 67: // toggle scraps visibility - 'c'

		if ( Viewer.hasScraps ) Viewer.scraps = ! Viewer.scraps;

		break;

	case 68: // toggle dye traces visibility - 'd'

		if ( Viewer.hasTraces ) Viewer.traces = ! Viewer.traces;

		break;

	case 70: // toggle full screen - 'f'

		Viewer.fullscreen = ! Viewer.fullscreen;

		break;

	case 74: // toggle entrance labels - 'j'

		if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

		break;

	case 76: // toggle entrance labels - 'l'

		if ( Viewer.hasEntrances ) Viewer.entrances = ! Viewer.entrances;

		break;

	case 78: // load next cave in list - 'n'

		fileSelector.nextFile();

		break;

	case 79: // switch view to orthoganal - 'o'

		Viewer.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		Viewer.cameraType = CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( Viewer.hasSplays ) Viewer.splays = ! Viewer.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		Viewer.view = VIEW_PLAN;

		break;

	case 83: // surface leg visibility - 's'

		if ( Viewer.hasSurfaceLegs ) Viewer.surfaceLegs = ! Viewer.surfaceLegs;

		break;

	case 84: // switch terrain on/off - 't'

		if ( Viewer.hasTerrain ) Viewer.terrain = ! Viewer.terrain;

		break;

	case 86: // cut selected survey section - 'v'

		Page.clear();
		Viewer.cut = true;

		break;

	case 87: // switch walls on/off - 'w'

		if ( Viewer.hasWalls ) Viewer.walls = ! Viewer.walls;

		break;

	case 88: // look ast last POI - 'x'

		Viewer.setPOI = true; // actual value here is ignored.

		break;

	case 90: // show station markers - 'z'

		Viewer.stations = ! Viewer.stations;

		break;

	case 219: // '[' key

		Viewer.cursorHeight++;

		break;

	case 221: // ']' key

		Viewer.cursorHeight--;

		break;

	case 188: // decrease terrain opacity '<' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.max( Viewer.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity '>' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.min( Viewer.terrainOpacity + 0.05, 1 );

		break;

	}

}

function handleKeyCommon( event ) {

	if ( event.ctrlKey ) return false;

	var handled = true;

	switch ( event.keyCode ) {

	case 48: // change colouring scheme to distance = '0'

		Viewer.shadingMode = SHADING_DISTANCE;

		break;

	case 49: // change colouring scheme to depth - '1'

		Viewer.shadingMode = SHADING_HEIGHT;

		break;

	case 50: // change colouring scheme to angle - '2'

		Viewer.shadingMode = SHADING_INCLINATION;

		break;

	case 51: // change colouring scheme to length - '3'

		Viewer.shadingMode = SHADING_LENGTH;

		break;

	case 52: // change colouring scheme to height cursor - '4'

		Viewer.shadingMode = SHADING_CURSOR;

		break;

	case 53: // change colouring scheme to white - '5'

		Viewer.shadingMode = SHADING_SINGLE;

		break;

	case 54: // change colouring scheme to per survey section - '6'

		Viewer.shadingMode = SHADING_SURVEY;

		break;

	case 55: // change colouring scheme to per survey section - '7'

		Viewer.shadingMode = SHADING_PATH;

		break;

	case 56: // change colouring scheme to per survey section - '8'

		Viewer.shadingMode = SHADING_DEPTH;

		break;

	case 57: // change colouring scheme to depth - '9'

		Viewer.shadingMode = SHADING_DEPTH_CURSOR;

		break;

	case 70: // toggle full screen - 'f'

		Viewer.fullscreen = ! Viewer.fullscreen;

		break;

	case 74: // toggle entrance labels - 'j'

		if ( Viewer.hasStationLabels ) Viewer.stationLabels = ! Viewer.stationLabels;

		break;

	case 79: // switch view to orthoganal - 'o'

		Viewer.cameraType = CAMERA_ORTHOGRAPHIC;

		break;

	case 81: // switch view to perspective -'q'

		if ( Viewer.hasSplays ) Viewer.splays = ! Viewer.splays;

		break;

	case 84: // switch terrain on/off - 't'

		if ( Viewer.hasTerrain ) Viewer.terrain = ! Viewer.terrain;

		break;

	case 107: // increase cursor depth - '+' (keypad)

		Viewer.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)

		Viewer.cursorHeight--;

		break;

	case 188: // decrease terrain opacity '<' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.max( Viewer.terrainOpacity - 0.05, 0 );

		break;

	case 190: // increase terrain opacity '>' key

		if ( Viewer.hasTerrain ) Viewer.terrainOpacity = Math.min( Viewer.terrainOpacity + 0.05, 1 );

		break;

	default:

		handled = false;

	}

	return handled;

}

// export public interface

export { initKeyboardControls };

// EOF