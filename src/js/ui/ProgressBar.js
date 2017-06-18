

function ProgressBar ( container ) {

	var offset = ( container.clientWidth - 300 ) / 2;

	var statusText  = document.createElement( 'div' );

	statusText.id  = 'status-text';
	statusText.style.width = '300px';
	statusText.style.left  = offset + 'px';

	var progressBar = document.createElement( 'progress' );

	progressBar.id = 'progress-bar';

	progressBar.style.width = '300px';
	progressBar.style.left  = offset + 'px';

	progressBar.setAttribute( 'max', '100' );

	this.container   = container;
	this.progressBar = progressBar;
	this.statusText  = statusText;

}

ProgressBar.prototype.constructor = ProgressBar;

ProgressBar.prototype.Start = function ( text ) {

	var statusText  = this.statusText;
	var progressBar = this.progressBar;

	statusText.textContent = text;
	progressBar.value = 0;

	this.container.appendChild( statusText );
	this.container.appendChild( progressBar );

};

ProgressBar.prototype.Update = function ( pcent ) {

	this.progressBar.value = pcent;

};

ProgressBar.prototype.Add = function ( pcent ) {

	this.progressBar.value += pcent;

};

ProgressBar.prototype.End = function () {

	var container = this.container;

	container.removeChild( this.statusText );
	container.removeChild( this.progressBar );

};

export { ProgressBar };

// EOF