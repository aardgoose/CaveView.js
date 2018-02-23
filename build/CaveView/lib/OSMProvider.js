

function OSMProvider () {

}

OSMProvider.prototype.getUrl = function ( x, y, z ) {

	return 'https://b.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';

};

OSMProvider.prototype.getAttribution = function () {

	var a = document.createElement( 'a' );

	a.textContent = '© OpenStreetMap contributors';
	a.href = 'http://www.openstreetmap.org/copyright';

	return a;

};