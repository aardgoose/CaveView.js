
CV.Marker = ( function () {

	if ( typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ) {
    	return function Marker () {};
	}

	var labelOffset = 30;
	var red    = new THREE.Color( 0xff0000 );
	var yellow = new THREE.Color( 0xffff00 );

	var pointer = new CV.EntrancePointer( 5, labelOffset - 10, red, yellow );
	var marker  = new THREE.Geometry();
	var loader  = new THREE.TextureLoader();

	var markerTexture  = loader.load( "CaveView/images/marker-yellow.png" );

	var markerMaterial = new THREE.PointsMaterial( { size: 10, map: markerTexture, transparent : true, sizeAttenuation: false } );

	marker.vertices.push( new THREE.Vector3( 0, 0, 10 ) );
	marker.colors.push( new THREE.Color( 0xff00ff ) );

	var pointerBufferGeometry = new THREE.BufferGeometry().fromGeometry( pointer );
	pointerBufferGeometry.computeBoundingBox();

	var pointerMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors, side: THREE.DoubleSide } );

	return function Marker ( text ) {

		THREE.LOD.call( this );

		this.type = "CV.Marker";

		var point = new THREE.Points( marker, markerMaterial );

		point.layers.set( CV.FEATURE_ENTRANCES );

		var label = new CV.Label( text );

		label.position.setZ( labelOffset );
		label.layers.set( CV.FEATURE_ENTRANCES );

		var pointer = new THREE.Mesh( pointerBufferGeometry, pointerMaterial );

		pointer.type = "CV.Pointer";

		pointer.layers.set( CV.FEATURE_ENTRANCES );
		pointer.add( label );

		this.name = text;

		this.addLevel( pointer,  0 );
		this.addLevel( point,  100 );

		return this;

	}

} () );

CV.Marker.prototype = Object.create( THREE.LOD.prototype );

CV.Marker.prototype.constructor = CV.Marker;

CV.Marker.prototype.raycast = function ( raycaster, intersects ) {

	var threshold = 10;
	var object = this;

	var ray = raycaster.ray;
	var position = this.getWorldPosition();
	var rayPointDistanceSq = ray.distanceSqToPoint( position );

	if ( rayPointDistanceSq < threshold ) {

		var intersectPoint = ray.closestPointToPoint( position );
		var distance = ray.origin.distanceTo( intersectPoint );

		if ( distance < raycaster.near || distance > raycaster.far ) return;

		intersects.push( {

			distance: distance,
			distanceToRay: Math.sqrt( rayPointDistanceSq ),
			point: intersectPoint.clone(),
			index: 0,
			face: null,
			object: object

		} );

	}

};

// EOF