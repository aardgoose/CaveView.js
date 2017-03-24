

import { ColourCache } from '../core/ColourCache';

function SurveyColours () {

	this.selectedSection = 0;
	this.map = [];

}

SurveyColours.prototype.constructor = SurveyColours;

SurveyColours.prototype.getSurveyColour = function ( surveyId ) {

	var surveyColours = ColourCache.survey;

	return surveyColours[ surveyId % surveyColours.length ];

};

SurveyColours.prototype.getSurveyColourMap = function ( surveyTree, selectedSection ) {

	if ( this.selectedSection === selectedSection && this.map.length > 0 ) {

		// use cached mapping
		return this.map;

	}

	var survey;
	var map = [];

	if ( selectedSection !== 0 ) {

		survey = selectedSection;

	} else {

		survey = surveyTree.id;

	}

	// create mapping of survey id to colour
	// map each child id _and_ all its lower level survey ids to the same colour

	var subTree = surveyTree.findById( survey );

	var colour = this.getSurveyColour( survey );

	_addMapping( survey );

	var children = subTree.children;

	for ( var i = 0, l = children.length; i < l; i++ ) {

		var childId = children[ i ].id;

		subTree = surveyTree.findById( childId );

		colour = this.getSurveyColour( childId );

		subTree.traverse( _addMapping );

	}

	this.map = map;
	this.selectedSection = selectedSection;

	return map;

	function _addMapping ( node ) {

		map[ node.id ] = colour;

	}

};

export { SurveyColours };