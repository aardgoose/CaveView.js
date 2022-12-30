import {
	CAMERA_PERSPECTIVE, LM_SINGLE, MOUSE_MODE_NORMAL, SHADING_DUPLICATE,
	SHADING_HEIGHT, SHADING_RELIEF, VIEW_PLAN
} from '../core/constants';

class ViewState {

	static default = {
		autoRotate: false,
		autoRotateSpeed: 0.5,
		box: true,
		cameraType: CAMERA_PERSPECTIVE,
		duplicateShading: SHADING_DUPLICATE,
		editMode: MOUSE_MODE_NORMAL,
		entrances: true,
		entrance_dots: true,
		fog: false,
		fullscreen: false,
		grid: false,
		HUD: true,
		linewidth: 0,
		model: true,
		scaleLinewidth: false,
		scraps: false,
		shadingMode: SHADING_HEIGHT,
		splays: false,
		stations: false,
		stationLabels: false,
		stationLabelOver: false,
		surfaceLegs: false,
		surfaceShading: SHADING_HEIGHT,
		terrain: false,
		terrainDatumShift: false,
		terrainLightingMode: LM_SINGLE,
		terrainOpacity: 0.5,
		terrainShading: SHADING_RELIEF,
		traces: false,
		view: VIEW_PLAN,
		walls: false,
		warnings: false,
		zoomToCursor: true
	};

	constructor ( cfg, viewer ) {

		const properties = [];

		Object.keys( viewer ).forEach( name => {

			const pDesc = Object.getOwnPropertyDescriptor( viewer, name );

			if ( pDesc.set !== undefined && pDesc.get !== undefined ) properties.push( name );

		} );

		this.getState = function () {

			const state = {};

			properties.forEach( name => {

				const value = viewer[ name ];

				if ( typeof value === 'object' ) return;

				state[ name ] = value;

			} );

			return state;

		};

		this.saveState = function () {

			window.localStorage.setItem( 'cv-state', JSON.stringify( this.getState() ) );

		};

		this.clear = function () {

			window.localStorage.removeItem( 'cv-state' );

		};

		this.getDefaultState = function () {

			const userSettings = JSON.parse( window.localStorage.getItem( 'cv-state' ) ) || {} ;

			return Object.assign( {}, ViewState.default, cfg.value( 'view', {} ), userSettings );

		};

	}

}

export { ViewState };