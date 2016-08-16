

function Tile ( x, y, resolution, tileSet, clip ) {

	this.x = x;
	this.y = y;

	this.resolution = resolution;
	this.tileSet    = tileSet;
	this.clip       = clip;

	this.canZoom       = true;
	this.evicted       = false;
	this.evictionCount = 1;
	this.parent        = null;
	this.id            = null;
	this.parentId      = null;

	this.boundingBox      = null;
	this.worldBoundingBox = null;

}

Tile.liveTiles = 0;
Tile.overlayImages = new Map();

Tile.prototype.constructor = Tile;

Tile.prototype.create = function ( geometry, terrainData ) {

	var vertices = geometry.vertices;
	var faces    = geometry.faces;
	var colors   = geometry.colors;

	var l1 = terrainData.length;
	var l2 = vertices.length;
	var scale = 1;
	var i;

	var l = Math.min( l1, l2 ); // FIXME

	if ( this.tileSet !== undefined ) scale = this.tileSet.SCALE;

	for ( i = 0; i < l; i++ ) {

		vertices[ i ].setZ( terrainData[ i ] / scale );

	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	var colourCache = ColourCache.terrain;
	var colourRange = colourCache.length - 1;

	for ( i = 0, l = faces.length; i < l; i++ ) {

		var face = faces[ i ];

		// compute vertex colour per vertex normal

		for ( var j = 0; j < 3; j++ ) {

			var dotProduct = face.vertexNormals[j].dot( upAxis );
			var colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

			face.vertexColors[ j ] = colourCache[ colourIndex ];

		}

	}

	// reduce memory consumption by transferring to buffer object
	var bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );

	bufferGeometry.computeBoundingBox();

	this.mesh = new THREE.Mesh( bufferGeometry );
	this.mesh.layers.set ( FEATURE_TERRAIN );

	return this;

}

Tile.prototype.createFromBufferGeometryJSON = function ( json, boundingBox ) {

	var loader = new THREE.BufferGeometryLoader();

	var bufferGeometry = loader.parse( json, boundingBox );

	// use precalculated bounding box rather than recalculating it here.

	var bb = new THREE.Box3(

		new THREE.Vector3( boundingBox.min.x, boundingBox.min.y, boundingBox.min.z ), 
		new THREE.Vector3( boundingBox.max.x, boundingBox.max.y, boundingBox.max.z )

	);

	bufferGeometry.boundingBox = bb;
	bufferGeometry.setDiscardBuffers(); // AAA

	this.mesh = new THREE.Mesh( bufferGeometry );
	this.mesh.layers.set ( FEATURE_TERRAIN );

}

Tile.prototype.getWorldBoundingBox = function () {

	var boundingBox;

	if ( this.worldBoundingBox === null ) {

		this.mesh.updateMatrixWorld();

		boundingBox = this.getBoundingBox().clone();
		boundingBox.applyMatrix4( this.mesh.matrixWorld );

		this.worldBoundingBox = boundingBox;

	}

	return this.worldBoundingBox;

}

Tile.prototype.getBoundingBox = function () {

	var boundingBox;

	if ( this.boundingBox === null ) {

		boundingBox = this.mesh.geometry.boundingBox.clone();

		var adj = this.resolution; // adjust to cope with overlaps

		boundingBox.min.x += adj;
		boundingBox.min.y += adj;
		boundingBox.max.x -= adj;
		boundingBox.max.y -= adj;

		this.boundingBox = boundingBox;

	}

	return this.boundingBox;
}

Tile.prototype.attach = function ( parent ) {

	this.evicted = false;
	this.parent = parent;

	parent.add( this.mesh );

	++Tile.liveTiles;

}

Tile.prototype.remove = function ( evicted ) {

	if ( evicted ) this.evictionCount++;

	this.evicted = evicted;

	if (this.mesh) {

		if (!this.boundingBox) {

			console.log( "FIXUP :", this.x, this.y );
			this.getWorldBoundingBox();

		}

		this.parent.remove( this.mesh );
		this.mesh = null;

		--Tile.liveTiles;

	}

}

Tile.prototype.setMaterial = function ( material ) {

	if ( this.mesh ) this.mesh.material = material;

}

Tile.prototype.setOpacity = function ( opacity ) {

	var mesh = this.mesh;

	if ( mesh ) {

		mesh.material.opacity = opacity;
		mesh.material.needsUpdate = true;

	}

}

Tile.prototype.setOverlay = function ( overlay, opacity ) {

	if ( !this.mesh ) return;

	var self = this;
	var tileSet = this.tileSet;
	var resolution = this.resolution;
	var texture;
	var clip = this.clip;

	var ratio = tileSet.OVERLAY_RESOLUTION / resolution;
	var repeat = 1 / ratio;

	var x = Math.floor( this.x / ratio );
	var y = Math.floor( this.y / ratio );

	var xOffset = ( this.x % ratio ) / ratio;
	var yOffset = ( ratio - 1 - this.y % ratio ) / ratio;

	var tileWidth = tileSet.TILESIZE - 1; // in grid units

	xOffset = xOffset + ( repeat * clip.left / tileWidth );
	yOffset = yOffset + ( repeat * clip.bottom / tileWidth );

	var xRepeat = repeat * ( ( tileWidth - clip.left - clip.right ) / tileWidth );
	var yRepeat = repeat * ( ( tileWidth - clip.top  - clip.bottom ) / tileWidth );

	var imageFile = tileSet.OVERLAYDIR + overlay + "/" + tileSet.PREFIX + tileSet.OVERLAY_RESOLUTION + "MX-" + padDigits( y, 3 ) + "-" + padDigits( x, 3 ) + ".jpg";

	if ( Tile.overlayImages.has( imageFile ) ) {

		_imageLoaded( Tile.overlayImages.get( imageFile ) );

	} else {

		var loader = new THREE.ImageLoader();

		loader.load( imageFile, _imageLoaded );

	}

	return;

	function _imageLoaded ( image ) {

		var material = new THREE.MeshLambertMaterial( { transparent: true, opacity: opacity } );

		Tile.overlayImages.set( imageFile, image );

		texture = new THREE.Texture();

		texture.image = image;

		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		texture.offset = new THREE.Vector2( xOffset, yOffset );
		texture.repeat = new THREE.Vector2( xRepeat, yRepeat );

		texture.needsUpdate = true;

		material.map = texture;
		material.needsUpdate = true;

		self.mesh.material = material;

		// add images to cache
		Tile.overlayImages.set( imageFile, image );

	}

}

Tile.prototype.getParent = function () {

	return this.parent;

}

Tile.prototype.projectedArea = function ( camera ) {

	var boundingBox = this.getWorldBoundingBox();

	var v1 = boundingBox.min.clone();
	var v3 = boundingBox.max.clone();

	v1.z = 0;
	v3.z = 0;

	var v2 = new THREE.Vector3( v3.x, v1.y, 0 );
	var v4 = new THREE.Vector3( v1.x, v3.y, 0 ) ;

	// clamping reduces accuracy of area but stops offscreen area contributing to zoom pressure

	v1.project( camera ).clampScalar( -1, 1 );
	v2.project( camera ).clampScalar( -1, 1 );
	v3.project( camera ).clampScalar( -1, 1 );
	v4.project( camera ).clampScalar( -1, 1 );

	var t1 = new THREE.Triangle( v1, v3, v4 );
	var t2 = new THREE.Triangle( v1, v2, v3 );

	return t1.area() + t2.area();

}

export { Tile };

// EOF