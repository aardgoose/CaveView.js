 "use strict";

importScripts( "../../lib/three.js",  "../CaveView.js" );

var CV = CV || {};

CV.upAxis = new THREE.Vector3( 0, 0, 1 );

var tileSpec;

onmessage = onMessage;

function onMessage ( event ) {

	tileSpec = event.data;

	new CV.HeightMapLoader( tileSpec.tileSet, tileSpec.resolution, tileSpec.tileX, tileSpec.tileY, mapLoaded, mapError ).load();

}

function mapLoaded ( data, x, y ) {

	// clip height map data

	var clip       = tileSpec.clip;
	var divisions  = tileSpec.tileSet.TILESIZE - 1;
	var resolution = tileSpec.resolution;
	var tileSet    = tileSpec.tileSet;

	// clip excess rows from top of height map

	var offset = clip.top * tileSet.TILESIZE * Uint16Array.BYTES_PER_ELEMENT;

	var terrainDataTyped = new Uint16Array( data, offset );
	var terrainData;

	var xDivisions = divisions - clip.left - clip.right;
	var yDivisions = divisions - clip.top - clip.bottom;

	// clip excess left and right columns from height map

	if ( clip.left || clip.right ) {

		var columns = tileSet.TILESIZE;
		var rows;
		var rowStart;

		terrainData = [];

		for ( var i = 0, l1 = yDivisions + 1; i < l1; i++ ) {

			// per row of data
			rowStart = i * columns + clip.left;

			for ( var j = 0, l2 = xDivisions + 1; j < l2; j++ ) {

				terrainData.push( terrainDataTyped[ rowStart + j ] );

			}

		}

	} else {

		terrainData = terrainDataTyped;

	}

	var xTileWidth = xDivisions * resolution;
	var yTileWidth = yDivisions * resolution;

	var xTileOffset = xTileWidth / 2 ;
	var yTileOffset = yTileWidth / 2 ;

	var N = tileSet.N;
	var W = tileSet.W;

	var X = W + xTileOffset + resolution * ( tileSpec.tileX * divisions + clip.left );
	var Y = N - yTileOffset - resolution * ( tileSpec.tileY * divisions + clip.top );

	var plane = new THREE.PlaneGeometry( xTileWidth, yTileWidth, xDivisions, yDivisions );

	plane.translate( X, Y, 0 );

	var vertices = plane.vertices;
	var faces    = plane.faces;
	var colors   = plane.colors;

	var l1 = terrainData.length;
	var l2 = vertices.length;
	var scale = 1;

	var l = Math.min( l1, l2 ); // FIXME

	scale = tileSet.SCALE;

	for ( var i = 0; i < l; i++ ) {

		vertices[i].setZ( terrainData[ i ] / scale );

	}

	plane.computeFaceNormals();
	plane.computeVertexNormals();

	var colourCache = CV.ColourCache.terrain;
	var colourRange = colourCache.length - 1;

	for ( var i = 0, l = faces.length; i < l; i++ ) {

		var face = faces[ i ];

		// compute vertex colour per vertex normal

		for ( var j = 0; j < 3; j++  ) {

			var dotProduct = face.vertexNormals[ j ].dot( CV.upAxis );
			var colourIndex = Math.floor( colourRange * 2 * Math.acos( Math.abs( dotProduct ) ) / Math.PI );

			face.vertexColors[ j ] = colourCache[ colourIndex ];

		}

	}

	// reduce memory consumption by transferring to buffer object + a JSON de serializable form
	var bufferGeometry = new THREE.BufferGeometry().fromGeometry( plane );

	// avoid calculating bounding box in main thread.
	// however it isn't preserved in json serialisation.

	bufferGeometry.computeBoundingBox();

	var bb = bufferGeometry.boundingBox;
	
	var boundingBox = {

		min: {
			x: bb.min.x,
			y: bb.min.y,
			z: bb.min.z
		},

		max: {

			x: bb.max.x,
			y: bb.max.y,
			z: bb.max.z
		}

	}

	var json = bufferGeometry.toJSON();

	// support transferable objects where possible
	// convertion from Array to ArrayBuffer improves main script side performance

	var transferable = [];

	for ( var attributeName in json.data.attributes ) {

		var attribute = json.data.attributes[ attributeName ];
		var fBuffer = new Float32Array( attribute.array );

		attribute.arrayBuffer = fBuffer.buffer;
		attribute.array = null;

		transferable.push( attribute.arrayBuffer );

	}

	postMessage( { status: "ok", json: json, x: x, y: y, boundingBox: boundingBox }, transferable );

	// end the worker
	close();

}

function mapError () {

	postMessage( { status: "nomap" } );

	// end the worker

	close();

}

// EOF