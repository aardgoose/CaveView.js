import { buildScraps } from './buildScraps';
import { buildCrossSections } from './buildCrossSections';
import { buildAlpha } from './buildAlpha';
import { Cfg } from '../../core/lib';

function buildWallsSync ( cave, survey ) {

	buildScraps( cave, survey );
	buildCrossSections( cave, survey, Cfg.value( 'alphaWalls', false ) );

}

function buildWallsAsync ( survey ) {

	if ( Cfg.value( 'alphaWalls', false ) ) buildAlpha( survey );

}

export { buildWallsSync, buildWallsAsync };

// EOF