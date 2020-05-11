import { PointsMaterial, TextureLoader } from '../Three';

import { Point } from './Point';

const img = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white' width='36px' height='36px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z'/%3E%3C/svg%3E";

function PointIndicator ( ctx, color ) {

	const materials = ctx.materials;

	if ( materials.pointerTexture === undefined ) {

		materials.pointerTexture = new TextureLoader().load( img );

	}

	const material = new PointsMaterial( { size: 32, map: materials.pointerTexture, transparent : true, sizeAttenuation: false, alphaTest: 0.8, color: color } );

	Point.call( this, material, ctx );

	return this;

}
const d = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfhBhIKOSvLM/kfAAAEEElEQVRo3uWZTWhcVRTH/3emSav5MERNS5MatGoktJQSJyoupCSLIC6kuBEDpX5sVFoVRBCK4ELFLsRFRXRRF3aTjaIiXTTBLrS2USiopLUN9aNtNIVW00nqNM38XMybl/smb2beu+/VEDwDM/fNvf//Pffcc+895z7p/y7GHcp6rfaKBXN+GXTnMDPe57A7y6oEGtyoFr/kLJnl9oGVqQCBn3KJ/8oHaFIHa7VZXf5fXTyjH/Qn02b2+vl86TvHASaZIUxmmORj+tytUbNzGhnke6LIOAM0pqgEkhjiZ+LISQZTUQFJNPM2LvImTfWVMLW7N6JTo+oJqbykYzqtvyS16S71qy2kzYQGzBSu+z2S2MRCxbhmOc4u2pe0vpndHGe2ovU8vY5TgSS2kK8gfIduzFI/99aIoZt3KxCX2eyqwu0VVD+yqR6Vp/ZPAdwC3Q7jp5UzAZrXWBVlJEiigdcD2NO0xLYBHwXGsCOOGZHEzoD3fBi3+52BETwedxaRxHCA44l45j9vQV9ycSIk8bLFco7myCw8bQG/JoPjMibDtxbTjujQvy3YrYl20nUW04WooKcs0LNJdnQksctiG44GG1/UmQ4SniWs5YLPdyRSsG0BPk3lNP3M55tmXf3mfZbJHkxFgYcsxq31m7/oNy6mFlEsyvP1g9L7/NLnqYVUX4Sw20EpnXpOC5Kkq9rm1x1LTYFxPeKVBtijRklSVvvMubKJcqERzaOpTcH2UP7c4hSEr7VLqVngYvVAu1ZiUkhNgX/cMqO21BRor5cZFXRW855ZNqjBq9uQmgKLTFd11otRGywLk6XF+2T5yneS91Nzwg98zkN2X+GN9/qNJ9NILZDELz7nG/UBQ9ZCScULaLcYB+o4IdIpzfmPu1OZgRf8Ul5n6tqUG5j09Z1gTdIJYA0TPt8pVtddhuaKRv2HHm1JFpAYaauV2B00UfYWbrHmbCJxRGRn1TdFBR2wQK+4qoAkXrWY9kdm4h4ryZzjDuew/E6u+Dx57o4D/yQQ0bc6JSat/GGxjMQjyAZC8xM0ESs1QzRz0mK4iImr/wOB3O5XOqNaAUl08buFvkZ/TBsiqSLDnYme2fAklwPYPQ5eRPAQKckovVSJYMr/02sdZyV5z2kdIYRhfwXZHN+wvSrmMY5Yfu8l5hgSbSR7KS6J5oqMMEwfPWxkIz30McxISNRX5K1EJ2rJ8xmsehFXIE+eQpXaItvKHMlvCse4FuuOcJ5DUW4Jo6uQIRfxorZ0WXsvJvUbY4n7GWOqZtdTjNEfh9PEsYSRRIdu05AeVi5w1T+v7/SlDuo3M11ueV2v7SWJo/64jy6tjSqx35iYMGzGwaCuCqQtK1qBbEgptiR5cblP673Ssry4rfG0ouRf9TDG9kyzLHUAAAAASUVORK5CYII=';
PointIndicator.prototype = Object.create( Point.prototype );

export { PointIndicator };