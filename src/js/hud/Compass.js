

Compass = function ( container ) {

	var width  = container.clientWidth;
	var height = container.clientHeight;

	var stdWidth  = HudObject.stdWidth;
	var stdMargin = HudObject.stdMargin;

	THREE.Group.call( this );

	this.name = "CV.Compass";
	this.domObjects = [];

	var cg1 = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 32 );
	var c1  = new THREE.Mesh( cg1, new THREE.MeshBasicMaterial( { color: 0x333333 } ) );

	var cg2 = new THREE.RingGeometry( stdWidth * 0.9, stdWidth, 4, 1, -Math.PI / 32 + Math.PI / 2, Math.PI / 16 );
	var c2  = new THREE.Mesh( cg2, new THREE.MeshBasicMaterial( { color: 0xb03a14 } ) );

	var r1 = _makeRose( stdWidth * 0.8, 0.141, 0x581d0a, 0x0c536a );
	var r2 = _makeRose( stdWidth * 0.9, 0.141, 0xb03a14, 0x1ab4e5 );

	r1.rotateZ( Math.PI / 4 );
	r1.merge( r2 );

	var rMesh = new THREE.Mesh( r1, new THREE.MeshBasicMaterial( { vertexColors:THREE.VertexColors, side:THREE.FrontSide } ) );

	this.add( c1 );
	this.add( c2 );
	this.add( rMesh );

	var offset = stdWidth + stdMargin;

	this.translateX( -offset );
	this.translateY(  offset );

	this.lastRotation = 0;

	var panel = document.createElement( "div" );

	panel.classList.add( "cv-compass" );
	panel.textContent = "";

	container.appendChild( panel );

	this.txt = panel;
	this.domObjects.push( panel );

	this.addEventListener( "removed", this.removeDomObjects );

	return this;

	// make 'petal' for compass rose
	function _makePetal ( radius, scale, color1, color2 ) {

		var innerR = radius * scale;
		var g = new THREE.Geometry();

		g.vertices.push( new THREE.Vector3( 0, radius, 0 ) );
		g.vertices.push( new THREE.Vector3( innerR ,innerR, 0 ) );
		g.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
		g.vertices.push( new THREE.Vector3( -innerR, innerR, 0 ) );

		var f1 = new THREE.Face3( 0, 2, 1, new THREE.Vector3( 0, 0, 1 ), new THREE.Color( color1 ), 0 );  
		var f2 = new THREE.Face3( 0, 3, 2, new THREE.Vector3( 0, 0, 1 ), new THREE.Color( color2 ), 0 );

		g.faces.push( f1 );
		g.faces.push( f2 );

		return g;

	}

	function _makeRose ( radius, scale, color1, color2 ) {

		var p1 = _makePetal( radius, scale, color1, color2 );
		var p2 = p1.clone();
		var p3 = p1.clone();
		var p4 = p1.clone();

		p2.rotateZ( Math.PI / 2 );
		p3.rotateZ( Math.PI );
		p4.rotateZ( Math.PI / 2 * 3 );

		p1.merge( p2 );
		p1.merge( p3 );
		p1.merge( p4 );

		return p1;

	};

}

Compass.prototype = Object.create( THREE.Group.prototype );

Object.assign( Compass.prototype, HudObject.prototype );

Compass.prototype.contructor = Compass;

Compass.prototype.set = function () {

	var direction     = new THREE.Vector3();
	var yAxis         = new THREE.Vector3( 0, 1, 0 );
	var negativeZAxis = new THREE.Vector3( 0, 0, -1 );

	return function set ( vCamera ) {

		vCamera.getWorldDirection( direction );

		if ( direction.x === 0 && direction.y === 0 ) {

			// FIXME get camera rotation....
			return;

		}

		// we are only interested in angle to horizontal plane.
		direction.z = 0;

		var a = direction.angleTo( yAxis );

		if ( direction.x >= 0 ) a = 2 * Math.PI - a;

		if ( a === this.lastRotation ) return;

		var degrees = 360 - Math.round( THREE.Math.radToDeg( a ) );

//		this.txt.textContent = degrees.toLocaleString( "en-GB", { minimumIntegerDigits: 3 } ) + "\u00B0"; // unicode degree symbol
		this.txt.textContent = degrees + "\u00B0"; // unicode degree symbol

		this.rotateOnAxis( negativeZAxis, a - this.lastRotation );

		this.lastRotation = a;

	}

} ();

export { Compass };

// EOF