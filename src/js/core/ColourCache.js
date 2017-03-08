
import { Color }  from '../../../../three.js/src/Three';
import { Colours } from './Colours';

// define colors to share THREE.Color objects

function createCache ( colours ) {

	var cache = [];

	for ( var i = 0, l = colours.length; i < l; i++ ) {

		cache[ i ] = new Color( colours[ i ] );

	}

	return cache;

}

export var ColourCache = {
	inclination: createCache( Colours.inclinationColours ),
	terrain:     createCache( Colours.terrainColours ),
	gradient:    createCache( Colours.gradientColours ),
	survey:      createCache( Colours.surveyColours ),
	red:         new Color( 0xff0000 ),
	yellow:	     new Color( 0xffff00 ),
	white:       new Color( 0xffffff ),
	grey:        new Color( 0x444444 )
};
