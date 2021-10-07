import {
	CAMERA_PERSPECTIVE,
	SHADING_HEIGHT, SHADING_RELIEF,
	VIEW_PLAN, MOUSE_MODE_NORMAL, SHADING_DUPLICATE
} from '../core/constants';

const defaultView = {
	autoRotate: false,
	autoRotateSpeed: 0.5,
	box: true,
	cameraType: CAMERA_PERSPECTIVE,
	view: VIEW_PLAN,
	editMode: MOUSE_MODE_NORMAL,
	shadingMode: SHADING_HEIGHT,
	surfaceShading: SHADING_HEIGHT,
	duplicateShading: SHADING_DUPLICATE,
	linewidth: 0,
	scaleLinewidth: false,
	terrainShading: SHADING_RELIEF,
	terrainDirectionalLighting: true,
	terrainOpacity: 0.5,
	terrainDatumShift: false,
	surfaceLegs: false,
	walls: false,
	scraps: false,
	splays: false,
	grid: false,
	stations: false,
	stationLabels: false,
	entrances: true,
	entrance_dots: true,
	terrain: false,
	traces: false,
	HUD: true,
	fog: false,
	warnings: false,
	fullscreen: false,
	zoomToCursor: true
};

function ViewState ( viewer ) {

	const properties = [];

	Object.keys( viewer ).forEach( name => {

		const pDesc = Object.getOwnPropertyDescriptor( viewer, name );

		if ( pDesc.set !== undefined && pDesc.get !== undefined ) {

			properties.push( name );

		}

	} );

	this.saveState = function () {

		const savedState = {};

		properties.forEach( name => {

			const value = viewer[ name ];

			if ( typeof value === 'object' ) return;

			savedState[ name ] = value;

		} );

		return savedState;

	};

}

export { ViewState, defaultView };