

function osmProvider ( x, y, z ) {

	return 'https://b.tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png';

}

function osmAttribution() {

	var a = document.createElement( 'a' );

	a.textContent = '© OpenStreetMap contributors';
	a.href = 'http://www.openstreetmap.org/copyright';

	return a;

}