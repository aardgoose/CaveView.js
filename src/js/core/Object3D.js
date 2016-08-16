Object3D = function () {};

Object3D.prototype.reverseTraverse = function ( callback ) {

	var children = this.children;

	for ( var i = children.length; i--; ) {

		children[ i ].reverseTraverse( callback );

	}

	callback( this );

};

Object.assign( THREE.Object3D.prototype, Object3D.prototype );

// EOF