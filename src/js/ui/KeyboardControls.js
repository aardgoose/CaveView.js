import {
	CAMERA_ORTHOGRAPHIC, CAMERA_PERSPECTIVE,
	SHADING_CURSOR, SHADING_DEPTH, SHADING_HEIGHT, SHADING_INCLINATION, SHADING_LENGTH,
	SHADING_SINGLE, SHADING_SURVEY, SHADING_PATH, SHADING_DEPTH_CURSOR, SHADING_DISTANCE,
	VIEW_PLAN,
} from '../core/constants';

import { Page } from './Page';

function KeyboardControls ( viewer, fileSelector, avenControls ) {

	document.addEventListener( 'keydown', keyDown );

	function keyDown ( event ) {

		if ( ! viewer.surveyLoaded || ! viewer.mouseOver ) return;

		event.preventDefault(); // enables F5, ctrl+<F5>, ctrl+<F> and other keys on the control's host page

		if ( handleKeyCommon( event ) ) return;

		if ( avenControls ) {

			handleKeyAven( event );

		} else {

			handleKeyDefault( event );

		}

	}

	function handleKeyAven( event ) {

		if ( event.ctrlKey ) {

			switch ( event.key ) {

			case 'b':

				viewer.box = ! viewer.box;

				break;

			case 'e':

				viewer.wheelTilt = ! viewer.wheelTilt;

				break;

			case 'f':

				if ( viewer.hasSurfaceLegs ) viewer.surfaceLegs = ! viewer.surfaceLegs;

				break;

			case 'l':

				if ( viewer.hasLegs ) viewer.legs = ! viewer.legs;

				break;

			case 'n': // (not available in Chrome)

				if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

				break;

			case 'x':

				viewer.stations = ! viewer.stations;

				break;

			}

		} else {

			switch ( event.key ) {

			case 'Delete': // '<delete>' reset view

				viewer.reset = true;

				break;

			case 'Enter':

				viewer.autoRotate = true;

				break;

			case ' ':

				viewer.autoRotate = ! viewer.autoRotate;

				break;

			case 'l': // elevation

				viewer.polarAngle = Math.PI / 2;

				break;

			case 'e': // East

				viewer.azimuthAngle = 3 * Math.PI / 2;

				break;

			case 'n': // North

				viewer.azimuthAngle = 0;

				break;

			case 'p': // plan

				viewer.polarAngle = 0;

				break;

			case 'r': // reverse rotation direction

				viewer.autoRotateSpeed *= -1;

				break;

			case 's': // South

				viewer.azimuthAngle = Math.PI;

				break;

			case 'w': // West

				viewer.azimuthAngle = Math.PI / 2;

				break;

			case 'x': // decrease rotation speed

				viewer.autoRotateSpeed -= 0.1;

				break;

			case 'z': // increase rotation speed

				viewer.autoRotateSpeed += 0.1;

				break;

			}

		}

	}

	function handleKeyDefault( event ) {

		if ( event.ctrlKey ) return;

		switch ( event.key ) {

		case 'c': // toggle scraps visibility

			if ( viewer.hasScraps ) viewer.scraps = ! viewer.scraps;

			break;

		case 'd': // toggle dye traces visibility

			if ( viewer.hasTraces ) viewer.traces = ! viewer.traces;

			break;

		case 'f': // toggle full screen

			viewer.fullscreen = ! viewer.fullscreen;

			break;

		case 'j': // toggle entrance labels

			if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

			break;

		case 'l': // toggle entrance labels

			if ( viewer.hasEntrances ) viewer.entrances = ! viewer.entrances;

			break;

		case 'n': // load next cave in list

			fileSelector.nextFile();

			break;

		case 'o': // switch view to orthoganal'

			viewer.cameraType = CAMERA_ORTHOGRAPHIC;

			break;

		case 'p': // switch view to perspective

			viewer.cameraType = CAMERA_PERSPECTIVE;

			break;

		case 'q': // switch view to perspective

			if ( viewer.hasSplays ) viewer.splays = ! viewer.splays;

			break;

		case 'r': // reset camera positions and settings to initial plan view

			viewer.view = VIEW_PLAN;

			break;

		case 's': // surface leg visibility

			if ( viewer.hasSurfaceLegs ) viewer.surfaceLegs = ! viewer.surfaceLegs;

			break;

		case 't': // switch terrain on/off

			if ( viewer.hasTerrain ) viewer.terrain = ! viewer.terrain;

			break;

		case 'v': // cut selected survey section

			Page.clear();
			viewer.cut = true;

			break;

		case 'w': // switch walls on/off

			if ( viewer.hasWalls ) viewer.walls = ! viewer.walls;

			break;

		case 'x': // look at last POI

			viewer.setPOI = true; // actual value here is ignored.

			break;

		case 'z': // show station markers

			viewer.stations = ! viewer.stations;

			break;

		case ']':

			viewer.cursorHeight++;

			break;

		case '[':

			viewer.cursorHeight--;

			break;

		}

	}

	function handleKeyCommon( event ) {

		if ( event.ctrlKey ) return false;

		let handled = true;

		if ( event.altKey ) {

			switch ( event.key ) {

			case 's':

				viewer.svxControlMode = ! viewer.svxControlMode;

				break;

			case 'f':

				viewer.flatShading = ! viewer.flatShading;

				break;

			case 'h':

				viewer.hideMode = ! viewer.hideMode;

				break;

			case 'x':

				viewer.zoomToCursor = ! viewer.zoomToCursor;

				break;

			default:

				handled = false;

			}

		} else {

			switch ( event.key ) {

			case '0': // change colouring scheme to distance

				viewer.shadingMode = SHADING_DISTANCE;

				break;

			case '1': // change colouring scheme to depth

				viewer.shadingMode = SHADING_HEIGHT;

				break;

			case '2': // change colouring scheme to angle

				viewer.shadingMode = SHADING_INCLINATION;

				break;

			case '3': // change colouring scheme to length

				viewer.shadingMode = SHADING_LENGTH;

				break;

			case '4': // change colouring scheme to height cursor

				viewer.shadingMode = SHADING_CURSOR;

				break;

			case '5': // change colouring scheme to white

				viewer.shadingMode = SHADING_SINGLE;

				break;

			case '6': // change colouring scheme to per survey section

				viewer.shadingMode = SHADING_SURVEY;

				break;

			case '7': // change colouring scheme to per survey section

				viewer.shadingMode = SHADING_PATH;

				break;

			case '8': // change colouring scheme to per survey section

				viewer.shadingMode = SHADING_DEPTH;

				break;

			case '9': // change colouring scheme to depth

				viewer.shadingMode = SHADING_DEPTH_CURSOR;

				break;

			case 'f': // toggle full screen

				viewer.fullscreen = ! viewer.fullscreen;

				break;

			case 'j': // toggle entrance labels

				if ( viewer.hasStationLabels ) viewer.stationLabels = ! viewer.stationLabels;

				break;

			case 'o': // switch view to orthoganal

				viewer.cameraType = CAMERA_ORTHOGRAPHIC;

				break;

			case 'q': // switch view to perspective

				if ( viewer.hasSplays ) viewer.splays = ! viewer.splays;

				break;

			case 't': // switch terrain on/off

				if ( viewer.hasTerrain ) viewer.terrain = ! viewer.terrain;

				break;

			case '+': // increase cursor depth

				viewer.cursorHeight++;

				break;

			case '-': // decrease cursor depth

				viewer.cursorHeight--;

				break;

			case '<': // decrease terrain opacity

				if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.max( viewer.terrainOpacity - 0.05, 0 );

				break;

			case '>': // increase terrain opacity

				if ( viewer.hasTerrain ) viewer.terrainOpacity = Math.min( viewer.terrainOpacity + 0.05, 1 );

				break;

			case '(':

				viewer.focalLength = Math.max( 10, viewer.focalLength - 10 );

				break;

			case ')':

				viewer.focalLength = Math.min( 300, viewer.focalLength + 10 );

				break;

			default:

				handled = false;

			}

		}

		return handled;

	}

	this.dispose = function () {

		document.removeEventListener( 'keydown', keyDown );

	};

}

export { KeyboardControls };