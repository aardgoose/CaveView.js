
import { upAxis } from '../core/constants';
import { Cfg } from '../core/lib';
import { HudObject } from './HudObject';
import { Viewer } from '../viewer/Viewer';
import { MutableGlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	RingGeometry,
	MeshBasicMaterial,
	FaceColors,
	Mesh
} from '../Three';


function ProgressDial ( addText, ring ) {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const offset = stdWidth + stdMargin;

	const gap = ring === 0 ? 0 : 1;

	const geometry = new RingGeometry( stdWidth * ( 0.9 - ring * 0.1 ), stdWidth * ( 1 - ring * 0.1 ) - gap, 50 );

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors } ) );

	this.name = 'CV.ProgressDial';

	this.translateX( -offset * 5 );
	this.translateY(  offset );

	this.rotateOnAxis( upAxis, Math.PI / 2 );

	this.visible = false;
	this.isVisible = true;

	this.color = Cfg.themeValue( 'hud.progress' );

	if ( addText ) {

		var glyphMaterial = Materials.getGlyphMaterial( HudObject.atlasSpec, 0 );

		const pcent = new MutableGlyphString( '----', glyphMaterial );

		pcent.translateY( 10 );
		pcent.translateX( -5 );

		this.addStatic( pcent );
		this.pcent = pcent;

	} else {

		this.pcent = null;

	}

	return this;

}

ProgressDial.prototype = Object.create( Mesh.prototype );

ProgressDial.prototype.set = function ( progress ) {

	if ( progress === this.progress ) return;

	this.progress = progress;

	const l = Math.floor( Math.min( 100, Math.round( progress ) ) / 2 ) * 2;
	const faces = this.geometry.faces;
	const color = this.color;

	for ( var i = 0; i < l; i++ ) {

		faces[ 99 - i ].color.set( color );

	}

	this.geometry.colorsNeedUpdate = true;

	if ( this.pcent !== null ) {

		var pcent = Math.round( progress ) + '%';

		this.pcent.replaceString( pcent.padStart( 4, ' ' ) );

	}

	Viewer.renderView();

};

ProgressDial.prototype.addValue = function ( progress ) {

	this.set( this.progress + progress );

};

ProgressDial.prototype.start = function () {

	const faces = this.geometry.faces;

	for ( var i = 0; i < 100; i++ ) {

		faces[ i ].color.set( 0x333333 );

	}

	this.geometry.colorsNeedUpdate = true;
	this.progress = 0;
	this.visible = true;

	if ( this.pcent !== null ) this.pcent.replaceString( '  0%' );

	Viewer.renderView();

};

ProgressDial.prototype.end = function () {

	const self = this;

	setTimeout( function () { self.visible = false; Viewer.renderView(); }, 500 );

};

ProgressDial.prototype.setVisibility = function ( visibility ) {

	this.isVisible = visibility;
	this.visible = ( this.visible && visibility );

};

ProgressDial.prototype.watch = function ( obj ) {

	const self = this;
	obj.addEventListener( 'progress', self.handleProgess.bind( self ) );

};

ProgressDial.prototype.handleProgess = function ( event ) {

	switch ( event.name ) {

	case 'start':

		this.start();
		break;

	case 'set':

		this.set( event.progress );
		break;

	case 'add':

		this.addValue( event.value );
		break;

	case 'end':

		this.end();
		break;

	}

};

export { ProgressDial };

// EOF