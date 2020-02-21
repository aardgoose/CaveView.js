import { FEATURE_SELECTED_BOX } from '../core/constants';
import { Box3Helper } from '../core/Box3';

import { Box3, IncrementStencilOp } from '../Three';

function Selection( survey, color ) {

	const worldBoundingBox = new Box3();
	var root = survey.surveyTree;
	var selectedNode = root;

	Box3Helper.call( this, root.boundingBox, color );

	const material = this.material;

	material.stencilWrite = true;
	material.stencilZPass = IncrementStencilOp;

	this.layers.set( FEATURE_SELECTED_BOX );

	survey.addStatic( this );

	const selectedSectionIds = new Set();

	this.setRoot = function ( rootNode ) {

		root = rootNode;

	};

	this.set = function ( node ) {

		selectedNode = node;
		selectedSectionIds.clear();

		if ( selectedNode === root ) {

			this.visible = false;

		} else {

			node.getSubtreeIds( selectedSectionIds );
			this.visible = true;

			if ( ! node.isStation() && node.boundingBox !== undefined ) {

				this.update( node.boundingBox );

			}

		}

	};

	this.getIds = function () {

		return selectedSectionIds;

	};

	this.isEmpty = function () {

		return ( selectedNode === root );

	};

	this.contains = function ( id ) {

		return ( selectedNode === root || selectedSectionIds.has( id ) );

	};

	this.getWorldBoundingBox = function () {

		if ( this.isEmpty() ) {

			return survey.getWorldBoundingBox();

		} else {

			return worldBoundingBox.copy( selectedNode.boundingBox ).applyMatrix4( survey.matrixWorld );

		}

	};

	this.getName = function () {

		return this.isEmpty() ? '' : selectedNode.getPath();

	};

	this.getNode = function () {

		return selectedNode;

	};

	this.isStation = function () {

		return selectedNode.isStation();

	};

}

Selection.prototype = Object.create( Box3Helper.prototype );

export { Selection };