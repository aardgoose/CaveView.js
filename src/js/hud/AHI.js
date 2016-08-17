
import { upAxis } from '../core/constants.js';
import { HudObject } from '../core/HudObject.js';

function AHI ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	THREE.Group.call( this );

	this.name = "CV.AHI";
	this.domObjects = [];

	this.lastPitch = 0;

	// artificial horizon instrument
	var globe = new THREE.Group();

	var ring  = new THREE.RingBufferGeometry( stdWidth * 0.9, stdWidth, 20, 4 );
	var sky   = new THREE.SphereBufferGeometry( stdWidth - 10, 20, 20, 0, 2 * Math.PI, 0 , Math.PI / 2 );
	var land  = new THREE.SphereBufferGeometry( stdWidth - 10, 20, 20, 0, 2 * Math.PI, Math.PI / 2, Math.PI / 2 );
	var bar   = new THREE.Geometry();
	var marks = new THREE.Geometry();

	// view orinetation line
	bar.vertices.push( new THREE.Vector3( 4 - stdWidth, 0, stdWidth ) );
	bar.vertices.push( new THREE.Vector3( stdWidth - 4, 0, stdWidth ) );

	// pitch interval marks
	var m1 = new THREE.Vector3(  4, 0, stdWidth - 10 );
	var m2 = new THREE.Vector3( -4, 0, stdWidth - 10 );

	var xAxis = new THREE.Vector3( 1, 0, 0 );

	for ( var i = 0; i < 12; i++ ) {

		var mn1 = m1.clone();
		var mn2 = m2.clone();

		if ( i % 3 === 0 ) {

			mn1.x =  7;
			mn2.x = -7;

		}

		mn1.applyAxisAngle( xAxis, i * Math.PI / 6 );
		mn2.applyAxisAngle( xAxis, i * Math.PI / 6 ); 

		marks.vertices.push( mn1 );
		marks.vertices.push( mn2 );

	}

	var mRing  = new THREE.Mesh( ring, new THREE.MeshBasicMaterial( { color: 0x333333, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mSky   = new THREE.Mesh( sky,  new THREE.MeshPhongMaterial( { color: 0x106f8d, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mLand  = new THREE.Mesh( land, new THREE.MeshPhongMaterial( { color: 0x802100, vertexColors: THREE.NoColors, side: THREE.FrontSide } ) );
	var mBar   = new THREE.LineSegments( bar,   new THREE.LineBasicMaterial( { color: 0xcccc00 } ) );
	var mMarks = new THREE.LineSegments( marks, new THREE.LineBasicMaterial( { color: 0xffffff } ) );

	mSky.rotateOnAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
	mLand.rotateOnAxis( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
	mMarks.rotateOnAxis( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 );
	mRing.rotateOnAxis( new THREE.Vector3( 0, 0, 1 ), Math.PI / 8 );

	globe.add( mSky );
	globe.add( mLand );
	globe.add( mMarks );

	this.add( mRing );
	this.add( globe );
	this.add( mBar );

	var offset = stdWidth + stdMargin;

	this.translateX( -3 * offset );
	this.translateY( offset );

	var panel = document.createElement( "div" );

	panel.classList.add( "cv-ahi" );
	panel.textContent = "";

	container.appendChild( panel );

	this.globe = globe;
	this.txt = panel;

	this.domObjects.push( panel );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

}

AHI.prototype = Object.create( THREE.Group.prototype );

Object.assign( AHI.prototype, HudObject.prototype );

AHI.prototype.contructor = AHI;

AHI.prototype.set = function () {

	var direction = new THREE.Vector3();
	var xAxis     = new THREE.Vector3( 1, 0, 0 );

	return function set ( vCamera ) {

		vCamera.getWorldDirection( direction );

		var pitch = Math.PI / 2 - direction.angleTo( upAxis );

		if ( pitch === this.lastPitch ) return;

		this.globe.rotateOnAxis( xAxis, pitch - this.lastPitch );
		this.lastPitch = pitch;

		this.txt.textContent = Math.round( THREE.Math.radToDeg( pitch ) )  + "\u00B0";

	}

} ();

export { AHI };

// EOF