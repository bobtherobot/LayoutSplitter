/*

# run

cd /Volumes/Drives/projects/layout
node ./_build.js

*/

var pub = require('/Volumes/Drives/projects/_hub/publisher/index.js');

pub({
	name			: "Layout",
	filename		: "layout.min.js",
	root			: ".",
	header			: "%root%/_header.txt",
	out				: "%root%/dist",
	
	buildWithSrc	: true,
	closeWhenDone	: true,
	makeDocs		: true,
	
	// All below can be array or string
	
	src				: [
						"%root%/src/layout.js"
						],
	
	css				: [
						'%root%/layout.css'
						],
	
	include			: [
						"%root%/example.html"
						],
	//copyBuildTo 	: "/Volumes/Drives/projects/ascii/src/layout"
	
});



