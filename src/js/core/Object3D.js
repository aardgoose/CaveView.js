CV.Object3D = function () {};

CV.Object3D.prototype.reverseTraverse = function ( callback ) {

	var children = this.children;

	for ( var i = children.length; i--; ) {

		children[ i ].reverseTraverse( callback );

	}

	callback( this );

};

Object.assign( THREE.Object3D.prototype, CV.Object3D.prototype );

// EOF