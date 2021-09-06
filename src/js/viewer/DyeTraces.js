import { LineSegments2 } from '../core/LineSegments2';
import { LineSegmentsGeometry } from '../core/LineSegmentsGeometry';
import { SurveyLineMaterial } from '../materials/SurveyLineMaterial';

function beforeRender ( renderer, scene, camera, geometry, material ) {

	material.dashOffset += 0.1;

}

class DyeTraces extends LineSegments2 {

	constructor ( ctx ) {

		const geometry = new LineSegmentsGeometry();
		const survey = ctx.survey;

		super( geometry, new SurveyLineMaterial( ctx, '', true ) );

		this.metadata = survey.metadata;
		this.vertices = [];
		this.selected = [];
		this.stations = [];


		this.onBeforeRender = beforeRender;
		this.visible = false;

		const traces = survey.metadata.traces;
		const surveyTree = survey.surveyTree;

		traces.forEach( trace => {

			const startStation = surveyTree.getByPath( trace.start );
			const endStation   = surveyTree.getByPath( trace.end );

			if ( endStation === undefined || startStation === undefined ) return;

			this._addTrace( startStation, endStation );

		} );

		this.finish();

	}

}

DyeTraces.prototype.finish = function () {

	const geometry = this.geometry;

	if ( this.vertices.length === 0 ) return;

	geometry.setPositions( this.vertices );
	geometry.setHide( this.selected );

	this.visible = true;

	// save to browser local storage
	this.metadata.traces = this.serialise();
	this.metadata.saveLocal();

	return this;

};

DyeTraces.prototype.getTraceStations = function ( hit ) {

	const stations = this.stations;

	return {
		start: stations[ hit * 2 ].getPath(),
		end: stations [ hit * 2 + 1 ].getPath()
	};

};

DyeTraces.prototype.deleteTrace = function ( hit ) {

	// remove from arrays
	const offset = hit * 2;

	this.stations.splice( offset, 2 );

	this.vertices.splice( offset, 2 );
	this.selected.splice( offset, 2 );

	// rebuild geometry without deleted trace

	this.finish();

};

DyeTraces.prototype._addTrace = function ( startStation, endStation ) {

	this.vertices.push(
		startStation.p.x, startStation.p.y, startStation.p.z,
		endStation.p.x, endStation.p.y, endStation.p.z
	);

	this.stations.push( startStation, endStation );
	this.selected.push( 1, 1 );

};

DyeTraces.prototype.addTrace = function ( startStation, endStation ) {

	this._addTrace( startStation, endStation );
	this.finish();

};

DyeTraces.prototype.outlineTrace = function ( hit ) {

	if ( ! this.visible ) return;

	const selected = this.selected;

	selected.fill( 0 );

	if ( hit !== null ) {

		let offset = hit * 2;

		selected[ offset++ ] = 1;
		selected[ offset ] = 1;

	}

	this.geometry.setHide( selected );

	return;

};

DyeTraces.prototype.serialise = function () {

	const stations = this.stations;
	const traces = [];

	for ( let i = 0, l = stations.length; i < l; i += 2 ) {

		traces.push( {
			start: stations[ i ].getPath(),
			end: stations[ i + 1 ].getPath()
		} );

	}

	return traces;

};

export { DyeTraces };