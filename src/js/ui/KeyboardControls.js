import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	/* SHADING_BECK, */ VIEW_PLAN,
} from '../core/constants';

import { Page } from './Page';

function KeyboardControls ( viewer, fileSelector, avenControls ) {

	document.addEventListener( 'keydown', keyDown );

	return this;

	function keyDown ( event ) {

		if ( ! viewer.surveyLoaded || ! viewer.mouseOver ) return;

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

				viewer.box = ! viewer.box;

				break;

			case 69: // 'E' - mouse wheel tilt

				event.preventDefault();
				viewer.wheelTilt = ! viewer.wheelTilt;

				break;

			case 70: // '<ctrl>F'

				event.preventDefault();
				if ( viewer.hasSurfaceLegs ) viewer.surfaceLegs = ! viewer.surfaceLegs;

				break;

			case 76: // '<ctrl>L'

				event.preventDefault();
				if ( viewer.hasLegs ) viewer.legs = ! viewer.legs;

				break;

			case 78: // '<ctrl>N' (not available in Chrome)

				event.preventDefault();
				if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

				break;

			case 88: // '<ctrl>X'

				viewer.stations = ! viewer.stations;
				break;

			}

		} else {

			switch ( event.keyCode ) {

			case 46: // '<delete>' reset view

				viewer.reset = true;

				break;

			case 13:

				viewer.autoRotate = true;

				break;

			case 32:

				viewer.autoRotate = ! viewer.autoRotate;

				break;

			case 76: // 'L' - plan

				viewer.polarAngle = Math.PI / 2;

				break;

			case 69: // 'E' - East

				viewer.azimuthAngle = 3 * Math.PI / 2;

				break;

			case 78: // 'N' - North

				viewer.azimuthAngle = 0;

				break;

			case 80: // 'P' - plan

				viewer.polarAngle = 0;

				break;

			case 82: // 'R' - reverse rotation direction

				viewer.autoRotateSpeed *= -1;

				break;

			case 83: // 'S' - South

				viewer.azimuthAngle = Math.PI;

				break;

			case 87: // 'W' - West

				viewer.azimuthAngle = Math.PI / 2;

				break;

			case 88: // 'X' - decrease rotation speed

				viewer.autoRotateSpeed -= 0.1;

				break;

			case 90: // 'Z' - increase rotation speed

				viewer.autoRotateSpeed += 0.1;

				break;

			}

		}

	}

	function handleKeyDefault( event ) {

		if ( event.ctrlKey ) return;

		switch ( event.keyCode ) {

		case 67: // toggle scraps visibility - 'c'

			if ( viewer.hasScraps ) viewer.scraps = ! viewer.scraps;

			break;

		case 68: // toggle dye traces visibility - 'd'

			if ( viewer.hasTraces ) viewer.traces = ! viewer.traces;

			break;

		case 70: // toggle full screen - 'f'

			viewer.fullscreen = ! viewer.fullscreen;

			break;

		case 74: // toggle entrance labels - 'j'

			if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

			break;

		case 76: // toggle entrance labels - 'l'

			if ( viewer.hasEntrances ) viewer.entrances = ! viewer.entrances;

			break;

		case 78: // load next cave in list - 'n'

			fileSelector.nextFile();

			break;

		case 79: // switch view to orthoganal - 'o'

			viewer.cameraType = CAMERA_ORTHOGRAPHIC;

			break;

		case 80: // switch view to perspective -'p'

			viewer.cameraType = CAMERA_PERSPECTIVE;

			break;

		case 81: // switch view to perspective -'q'

			if ( viewer.hasSplays ) viewer.splays = ! viewer.splays;

			break;

		case 82: // reset camera positions and settings to initial plan view -'r'

			viewer.view = VIEW_PLAN;

			break;

		case 83: // surface leg visibility - 's'

			if ( viewer.hasSurfaceLegs ) viewer.surfaceLegs = ! viewer.surfaceLegs;

			break;

		case 84: // switch terrain on/off - 't'

			if ( viewer.hasTerrain ) viewer.terrain = ! viewer.terrain;

			break;

		case 86: // cut selected survey section - 'v'

			Page.clear();
			viewer.cut = true;

			break;

		case 87: // switch walls on/off - 'w'

			if ( viewer.hasWalls ) viewer.walls = ! viewer.walls;

			break;

		case 88: // look ast last POI - 'x'

			viewer.setPOI = true; // actual value here is ignored.

			break;

		case 90: // show station markers - 'z'

			viewer.stations = ! viewer.stations;

			break;

		case 219: // '[' key

			viewer.cursorHeight++;

			break;

		case 221: // ']' key

			viewer.cursorHeight--;

			break;

		case 188: // decrease terrain opacity '<' key

			if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.max( viewer.terrainOpacity - 0.05, 0 );

			break;

		case 190: // increase terrain opacity '>' key

			if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.min( viewer.terrainOpacity + 0.05, 1 );

			break;

		}

	}

	function handleKeyCommon( event ) {

		if ( event.ctrlKey ) return false;

		var handled = true;

		if ( event.altKey ) {

			switch ( event.keyCode ) {

			case 83: // '<alt>S' - South

				viewer.svxControlMode = ! viewer.svxControlMode;
				break;

			case 88: // '<alt>X'

				viewer.zoomToCursor = ! viewer.zoomToCursor;
				break;

			default:

				handled = false;

			}

		} else {

			switch ( event.keyCode ) {

			case 48: // change colouring scheme to distance = '0'

				viewer.shadingMode = SHADING_DISTANCE;

				break;

			case 49: // change colouring scheme to depth - '1'

				viewer.shadingMode = SHADING_HEIGHT;

				break;

			case 50: // change colouring scheme to angle - '2'

				viewer.shadingMode = SHADING_INCLINATION;

				break;

			case 51: // change colouring scheme to length - '3'

				viewer.shadingMode = SHADING_LENGTH;

				break;

			case 52: // change colouring scheme to height cursor - '4'

				viewer.shadingMode = SHADING_CURSOR;

				break;

			case 53: // change colouring scheme to white - '5'

				viewer.shadingMode = SHADING_SINGLE;

				break;

			case 54: // change colouring scheme to per survey section - '6'

				viewer.shadingMode = SHADING_SURVEY;

				break;

			case 55: // change colouring scheme to per survey section - '7'

				viewer.shadingMode = SHADING_PATH;

				break;

			case 56: // change colouring scheme to per survey section - '8'

				viewer.shadingMode = SHADING_DEPTH;

				break;

			case 57: // change colouring scheme to depth - '9'

				viewer.shadingMode = SHADING_DEPTH_CURSOR;

				break;

			case 70: // toggle full screen - 'f'

				viewer.fullscreen = ! viewer.fullscreen;

				break;

			case 74: // toggle entrance labels - 'j'

				if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

				break;

			case 79: // switch view to orthoganal - 'o'

				viewer.cameraType = CAMERA_ORTHOGRAPHIC;

				break;

			case 81: // switch view to perspective -'q'

				if ( viewer.hasSplays ) viewer.splays = ! viewer.splays;

				break;

			case 84: // switch terrain on/off - 't'

				if ( viewer.hasTerrain ) viewer.terrain = ! viewer.terrain;

				break;

			case 107: // increase cursor depth - '+' (keypad)

				viewer.cursorHeight++;

				break;

			case 109: // decrease cursor depth - '-' (keypad)

				viewer.cursorHeight--;

				break;

			case 188: // decrease terrain opacity '<' key

				if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.max( viewer.terrainOpacity - 0.05, 0 );

				break;

			case 190: // increase terrain opacity '>' key

				if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.min( viewer.terrainOpacity + 0.05, 1 );

				break;

			default:

				handled = false;

			}

		}

		return handled;

	}

}

// export public interface

export { KeyboardControls };

// EOF