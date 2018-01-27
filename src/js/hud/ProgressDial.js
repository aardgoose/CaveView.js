
import { upAxis } from '../core/constants';
import { Cfg } from '../core/lib';
import { HudObject } from './HudObject';
import { Viewer } from '../viewer/Viewer';
import { GlyphString } from '../core/GlyphString';
import { Materials } from '../materials/Materials';

import {
	RingGeometry,
	MeshBasicMaterial,
	FaceColors,
	Mesh
} from '../Three';


function ProgressDial () {

	const stdWidth  = HudObject.stdWidth;
	const stdMargin = HudObject.stdMargin;

	const offset = stdWidth + stdMargin;

	var geometry = new RingGeometry( stdWidth * 0.9, stdWidth, 50 );

	Mesh.call( this, geometry, new MeshBasicMaterial( { color: 0xffffff, vertexColors: FaceColors } ) );

	this.name = 'CV.ProgressDial';
	this.domObjects = [];

	this.translateX( -offset * 5 );
	this.translateY(  offset );

	this.rotateOnAxis( upAxis, Math.PI / 2 );

	this.visible = false;
	this.isVisible = true;

	this.addEventListener( 'removed', this.removeDomObjects );

	var atlasSpec = {
		font: 'normal helvetica,sans-serif'
	};

	var glyphMaterial = Materials.getGlyphMaterial( atlasSpec, 0 );

	this.pcent = new GlyphString( '----', glyphMaterial, false );

	this.pcent.translateY( 10 );
	this.pcent.translateX( -5 );

	this.color = Cfg.themeValue( 'hud.progress' );

	this.add( this.pcent );

	return this;

}

ProgressDial.prototype = Object.create( Mesh.prototype );

Object.assign( ProgressDial.prototype, HudObject.prototype );

ProgressDial.prototype.constructor = ProgressDial;

ProgressDial.prototype.set = function ( progress ) {

	if ( progress === this.progress ) return;

	this.progress = progress;

	var l = Math.floor( Math.min( 100, Math.round( progress ) ) / 2 ) * 2;
	var faces = this.geometry.faces;
	var color = this.color;

	for ( var i = 0; i < l; i++ ) {

		faces[ 99 - i ].color.set( color );

	}

	this.geometry.colorsNeedUpdate = true;

	var pcent = Math.round( progress ) + '%';

	this.pcent.replaceString( pcent.padStart( 4, ' ' ) );

	Viewer.renderView();

};

ProgressDial.prototype.addValue = function ( progress ) {

	this.set( this.progress + progress );

};

ProgressDial.prototype.start = function () {

	var faces = this.geometry.faces;

	for ( var i = 0; i < 100; i++ ) {

		faces[ i ].color.set( 0x333333 );

	}

	this.geometry.colorsNeedUpdate = true;
	this.progress = 0;
	this.visible = true;

	this.pcent.replaceString( '  0%' );

	Viewer.renderView();

};

ProgressDial.prototype.end = function () {

	var self = this;

	setTimeout( function () { self.visible = false; Viewer.renderView(); }, 500 );

};

ProgressDial.prototype.setVisibility = function ( visibility ) {

	this.isVisible = visibility;
	this.visible = ( this.visible && visibility );

};

export { ProgressDial };

// EOF