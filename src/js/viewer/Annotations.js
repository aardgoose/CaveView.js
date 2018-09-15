
import { Points, PointsMaterial, BufferGeometry, Float32BufferAttribute, TextureLoader } from '../Three';
import { Cfg } from '../core/lib';

function Annotations ( survey ) {

	const geometry = new BufferGeometry();
	const material = new PointsMaterial();

	material.map = new TextureLoader().load( Cfg.value( 'home', '' ) + 'images/disc.png' );
	material.opacity = 1.0;
	material.alphaTest = 0.8;
	material.sizeAttenuation = false;
	material.transparent = true;
	material.sizeAttenuation = false;
	material.size = 10;

	Points.call( this, geometry, material );

	const vertices = [];

	this.vertices = vertices;
	this.stations = survey.stations;
	this.metadata = survey.metadata;

	this.visible = false;

	const surveyTree = survey.surveyTree;

	const annotations = survey.metadata.annotations;

	for ( let stationName in annotations ) {

		_addAnnotation( stationName );

	}

	this.finish();

	return this;

	function _addAnnotation  ( stationName ) {

		const station = surveyTree.getByPath( stationName );

		if ( station === undefined ||
			station.p === undefined ||
			station.p.connections === 0 ) return;

		vertices.push( station.p );

	}

}

Annotations.annotators = {};

Annotations.addAnnotator = function ( annotator ) {

	console.log( annotator );
	Annotations.annotators[ annotator.type ] = annotator;

};

Annotations.getAnnotator = function ( type ) {

	return Annotations.annotators[ type ];

};

Annotations.prototype = Object.create( Points.prototype );

Annotations.prototype.finish = function () {

	const geometry = this.geometry;
	const vertices = this.vertices;

	if ( vertices.length === 0 ) return;

	const annotationCount = vertices.length;

	const positions = new Float32BufferAttribute( annotationCount * 3, 3 );

	positions.copyVector3sArray( vertices );

	if ( ! this.visible ) {

		geometry.addAttribute( 'position', positions );

	} else {

		geometry.getAttribute( 'position' ).copy( positions ).needsUpdate = true;

	}

	this.visible = true;

	// save to browser local storage
	this.metadata.saveLocal();

	return this;

};

Annotations.getAnnotator = function ( type ) {

	return Annotations.annotators[ type ];

};

Annotations.prototype.getStation = function ( station ) {

	const stationName = station.getPath();

	return {
		name: stationName,
		annotation: this.metadata.annotations[ stationName ]
	};

};

Annotations.prototype.setStation = function ( station, annotation ) {

	if ( this.vertices.indexOf( station.p ) === -1 ) {

		this.vertices.push( station.p );
		this.finish();

	}

	const metadata = this.metadata;
	const stationName = station.getPath();

	metadata.annotations[ stationName ] = annotation;
	metadata.saveLocal();

};

export { Annotations };
