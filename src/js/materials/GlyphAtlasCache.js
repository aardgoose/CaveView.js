import { GlyphAtlas } from "./GlyphAtlas";

class GlyphAtlasCache {

    static atlasCache = {};

	static getAtlas ( type, ctx ) {

		let atlas = this.atlasCache[ type ];

        if ( atlas == undefined ) {

			atlas = new GlyphAtlas( type, ctx );
			this.atlasCache[ type ] = atlas;

        }

		return atlas;

	};

}

export { GlyphAtlasCache };