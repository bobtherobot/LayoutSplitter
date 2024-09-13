/*
OPTIONS:
layout (required)	Which direction to split (vertical="col" horizontal="row". 
						This option is also used as a flag for LayoutSplitter 
						to indicate that the DIV should be parsed by LayoutSplitter.

size				The default / startup size. Assume pixel values.
min 				The minimum allowable size. Assume pixel values.
noresize			When false, the cell can't be resized.
onresizecomplete	After the cell is resized, this function will be called.
onresize			While resizing this function is called.
scroll				When true, the cell will scroll if needed.

Options are added to DIV tags using the data- prefix.
Example:
<div data-layout data-size=1 data-min="300" data-resizeable=1 data-scroll=false data-onresizecomplete="myFunction" data-onresize="myFunction"></div>


<script src="LayoutSplitter.js"></script>
<script>
function myResizeHandler(e){
	//con sole.log(e);
}
</script>
<div data-layout="col">
	<div data-layout="row" data-scroll="false">
		<iframe src="http://www.gieson.com" id="previewFrame" width="100%" height="100%" frameborder="0" seamless="seamless" scrolling="yes"></iframe>
	</div>
	<div data-layout="row" data-scroll="false" data-onResize="myResizeHandler">
		<iframe src="http://www.google.com" id="previewFrame" width="100%" height="100%" frameborder="0" seamless="seamless" scrolling="yes"></iframe>
	</div>
</div>
*/

this.jbeeb = this.jbeeb || {};

// https://developer.mozilla.org/en-US/docs/Web/Events/resize
var LayoutSplitterResizeThrottle = (function() {

	var callbacks = [],
		running = false;

	// fired on resize event
	function resize() {

		if (!running) {
			running = true;

			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(runCallbacks);
			} else {
				setTimeout(runCallbacks, 66);
			}
		}

	}

	// run the actual callbacks
	function runCallbacks() {

		callbacks.forEach(function(callback) {
			callback();
		});

		running = false;
	}

	// adds callback to loop
	function addCallback(callback) {

		if (callback) {
			callbacks.push(callback);
		}

	}

	return {
		// public method to add additional callback
		add: function(callback) {
			if (!callbacks.length) {
				window.addEventListener('resize', resize);
			}
			addCallback(callback);
		}
	}
}());

jbeeb.LayoutSplitter = (function(){

	var mask = document.createElement("div");
	mask.classList.add("layout-splitter-mask");

	// Measure the splitter
	var temp = document.createElement("div");
	temp.classList.add("layout-splitter-col");
	document.body.appendChild(temp);
	var splitterDims = temp.getBoundingClientRect();
	document.body.removeChild(temp);
	var splitter_size = splitterDims.width;
	var half_splitter_size = splitter_size / 2;
	var moving_splitter_size = splitter_size + half_splitter_size;
	var double_splitter_size = splitter_size * 2;

	var baseDims;
	var previousSize = 0;
	var right = 0;
	var all = document.querySelectorAll("[data-layout]");


	function getProperValue(val){
		if( typeof val == 'undefined' ){
			return 0;
		}
		
		if( isFalse(val) ) {
			return 0;
		}

		if( isTrue(val) ) {
			return 1;
		}

		return 0;
	}
	
	
	function isFalse(val){
		return (val === "false" || val === "0" || val === 0 || val === false);
	}
	
	function isTrue(val){
		return (val === "" || val === "true" || val === "1" || val === 1 || val === true);
	}
	
	var cells = [];
	var container;
	var rootList = [];
	for(var i=0; i<all.length; i++){
		var elem = all[i];
		var parent = elem.parentNode;

		// Walk until no layout to find root container.
		var container = parent;
		while(container.dataset.layout){
			container = container.parentNode;
		}
		
		var containerDims = container.getBoundingClientRect();
		
		var amRoot = (parent == container) ? true : false
	
		var sibs = findSibs(elem);
		var numUnits = parseNumUnits(elem.dataset.size, containerDims, row);
		var numUnitsMin = parseNumUnits(elem.dataset.min, containerDims, row);
		var row = elem.dataset.layout == "row" ? true : false;
		
		// Convert percent to pixels
		if(numUnits.units == "%"){
			var w = containerDims.width;
			var h = containerDims.height;
			if(row){
				numUnits.num = h * (numUnits / 100);
				numUnits.units = "px";
			} else {
				numUnits.num = w * (numUnits / 100);
				numUnits.units = "px";
			}
		}
		
		if(numUnitsMin.units == "%"){
			var w = containerDims.width;
			var h = containerDims.height;
			if(row){
				numUnitsMin.num = h * (numUnits / 100);
				numUnitsMin.units = "px";
			} else {
				numUnitsMin.num = w * (numUnits / 100);
				numUnitsMin.units = "px";
			}
		}
		
		
		var obj = {
			elem : elem
			, first : ! sibs.prev
			, last : ! sibs.next
			, next : null
			, prev : null
			, nextElem : sibs.next
			, prevElem : sibs.prev
			, w : row ? null : numUnits.num
			, h : row ? numUnits.num : null
			, top : null
			, bottom : null
			, left : null
			, right : null
			, units : numUnits.units
			, parent : null
			, parentElem : parent
			, amRoot : amRoot
			, row : row
			, children : null
			, rootElem : container
			, root : null
			, minSource : numUnitsMin.num
			, resizable : isTrue(elem.dataset.noresize) ? false : true
			, onResizeComplete : elem.dataset.onresizecomplete // always lower-cased
			, onResize : elem.dataset.onresize // always lower-cased
		};
		

		if( isTrue(elem.dataset.scroll) ){
			elem.style.overflow = "auto";
		} else {
			elem.style.overflow = "hidden";
		}

		if(amRoot){

			rootList.push(obj);
			var w = containerDims.width;
			var h = containerDims.height
			obj.w = w;
			obj.h = h;
			obj.parent = {
				w : w
				, h : h
			};

		}

		cells.push(obj);
	}


	var handleOnResizeTimeout = null;
	function handleOnResize(obj){
		var fn = obj.onResize;
		if(handleOnResizeTimeout){
			clearTimeout(handleOnResizeTimeout);
		}
		handleOnResizeTimeout = setTimeout(fn + "()", 100);

	}

	var handleOnResizeCompleteTimeout = null;
	function handleOnResizeComplete(obj){
		var fn = obj.onResizeComplete;
		if(handleOnResizeCompleteTimeout){
			clearTimeout(handleOnResizeCompleteTimeout);
		}
		handleOnResizeCompleteTimeout = setTimeout(fn + "()", 100);

	}


	// Set links to next, prev, parent, children
	for(var i=0; i<cells.length; i++){
		var me = cells[i];
		for(var k=0; k<cells.length; k++){
			var obj = cells[k];
			if(obj.elem == me.nextElem){
				me.next = obj;
			}
			if(obj.elem == me.prevElem){
				me.prev = obj;
			}
			if(obj.parentElem == me.rootElem){
				me.root = obj;
			}
			if(obj.elem == me.parentElem){
				me.parent = obj;
				if( ! obj.children ){
					obj.children = [];
				}
				obj.children.push(me);
			}
		}
	}

	// Beginning at root, work way up and establish sizes

	function prepSizes(obj){
		var kids = obj.children;
		if(kids){
			var row = obj.row;
			var sum_w = 0;
			var sum_h = 0;
			var empty_w = [];
			var empty_h = [];
			for(var i=0; i<kids.length; i++){
				var kid = kids[i];
				var w = kid.w;
				if(w < 1){
					empty_w.push(kid);
				}
				sum_w += w || 0;

				var h = kid.h;
				if(h < 1){
					empty_h.push(kid);
				}
				sum_h += h || 0;
			}
			var diff_w = 0;
			var diff_h = 0;
			var to_w = obj.parent.w || 0;
			var to_h = obj.parent.h || 0;

			if(sum_w != to_w) {
				diff_w = to_w - sum_w;
			}

			if(sum_h != to_h) {
				diff_h = to_h - sum_h;
			}

			var spread;

			// We're dealing with children, so if the obj is a row, we'll work on the columns within.
			if(obj.row) {


				// If sizes are larger than available space.
				if ( diff_w < 0 ) {

					// Try using the min values to see if it brings the diff above 0.

					for(var i=0; i<kids.length; i++){
						var obj = kids[i];
						var min = obj.minSource;
						if(min){
							obj.w = min;
							diff_w += min;
						}
					}

					// If still too much, reset to everything evenly distributed
					if ( diff_w < 0 ) {

						spread = to_w / kids.length;
						for(var i=0; i<kids.length; i++){
							var obj = kids[i];
							obj.w = spread; // spread is negative
							var min = obj.minSource
							if(min){
								obj.minSource = null;
							}
						}
					}

				// Distribute empty items evenly
				} else {

					// Evenly size the empty cols with available space
					spread = diff_w / empty_w.length;
					for ( var i = 0; i < empty_w.length; i++ ) {
						var obj = empty_w[ i ];
						obj.w = spread;
					}

				}

				// Make last item fill out to end if too short
				var sum = 0;
				var lastObj;
				for(var i=0; i<kids.length; i++){
					var obj = kids[i];
					sum += obj.w;
					if(obj.last){
						lastObj = obj;
					}
				}

				if(sum < to_w){
					lastObj.w += to_w - sum;
				}



			} else {

				// If sizes are larger than available space.
				if ( diff_h < 0 ) {

					// Try using the min values to see if it brings the diff above 0.
					spread = diff_h / kids.length;
					for(var i=0; i<kids.length; i++){
						var obj = kids[i];
						var min = obj.minSource;
						if(min){
							obj.h = min;
							diff_h += min;
						}
					}

					// If still too much, reset to everything evenly distributed
					if ( diff_h < 0 ) {

						spread = to_h / kids.length;
						for(var i=0; i<kids.length; i++){
							var obj = kids[i];
							obj.h = spread; // spread is negative
							var min = obj.minSource
							if(min){
								obj.minSource = null;
							}
						}
					}

				// Distribute empty items evenly
				} else {

					spread = diff_h / empty_h.length;
					for ( var i = 0; i < empty_h.length; i++ ) {
						var obj = empty_h[ i ];
						obj.h = spread;
					}

				}

				// Make last item fill out to end if too short
				var sum = 0;
				var lastObj;
				for(var i=0; i<kids.length; i++){
					var obj = kids[i];
					sum += obj.h;
					if(obj.last){
						lastObj = obj;
					}
				}
				if(sum < to_h){
					lastObj.h += to_h - sum;
				}


			}


			for(var i=0; i<kids.length; i++) {
				var kid = kids[i];
				prepSizes( kid );
			}
		}

	}

	for(var i=0; i<rootList.length; i++){
		var obj = rootList[i];
		var rootElem = obj.elem;
		rootElem.style.overflow = "hidden";
		//addListenerWithArgs(rootElem, "resize", resize, obj);
		prepSizes( obj );
	}




	// Position panels and create splitters if needed
	for(var i=0; i<cells.length; i++){
		var obj = cells[i];
		var elem = obj.elem;
		elem.classList.add("layout-base");

		if( ! obj.amRoot){

			var row = obj.row;

			var top = 0;
			var bottom = 0;
			var right = 0;
			var left = 0;

			//var willSplit = (obj.prev && obj.next) ? true : false;
			var willSplit = (obj.next && obj.resizable) ? true : false;

			var offset = willSplit ? splitter_size : 0;
			if(row){

				var prev = obj.prev;
				var wild = 0;
				while(prev){
					top += prev.h;
					prev = prev.prev;
					wild++;
					if(wild > 1000){
						break;
					}
				}

				bottom = obj.parent.h - (top + obj.h);

				obj.top = top;
				obj.min = top + obj.minSource;
				obj.max = top + obj.h;

				elem.style.top = top + "px";
				elem.style.height = obj.h + "px";

			} else {

				var prev = obj.prev;
				var wild = 0;
				while(prev){
					left += prev.w;
					prev = prev.prev;
					wild++;
					if(wild > 1000){
						break;
					}
				}

				obj.left = left;
				obj.min = left + obj.minSource;
				obj.max = left + obj.w;

				elem.style.left = left + "px";
				elem.style.width = obj.w + "px";

			}

			if(willSplit){
				var splitter = document.createElement("div");
				if(row){
					splitter.classList.add("layout-splitter-row");
					splitter.style.top = obj.max - offset + "px";
				} else {

					splitter.classList.add("layout-splitter-col");
					splitter.style.left = obj.max - offset + "px";
				}

				//if(obj.resizable){
					var splitterGrabber = document.createElement("div");
					if(row){
						splitterGrabber.classList.add("layout-splitter-row-grabber");
						splitter.appendChild(splitterGrabber);
					} else {
						splitterGrabber.classList.add("layout-splitter-col-grabber");
						splitter.appendChild(splitterGrabber);
					}

					addListenerWithArgs(splitterGrabber, "mousedown", mouse_down, obj);

				//}


				obj.parentElem.insertBefore(splitter, obj.nextElem);
				obj.splitter = splitter;
			}

		}

	}

	var moveObj;
	var mouseStart;
	var startPos;
	function mouse_down(e, obj){

		document.addEventListener("mousemove", mouse_move);
		document.addEventListener("mouseup", mouse_up);

		document.body.appendChild(mask);
		moveObj = obj;
		var splitterElemStyle = e.target.parentNode.style;
		if(obj.row) {
			mouseStart = e.clientY;
			startPos = parseFloat(splitterElemStyle.top);
		} else {
			mouseStart = e.clientX;
			startPos = parseFloat(splitterElemStyle.left);
		}

	}
	function mouse_up(e){
		document.removeEventListener("mousemove", mouse_move);
		document.removeEventListener("mouseup", mouse_up);
		document.body.removeChild(mask);

		if(moveObj.onResizeComplete){
			handleOnResizeComplete(moveObj);
		}
		var next = moveObj.next;
		//if(next){
			if(next.onResizeComplete){
				handleOnResizeComplete(next);
			}
		//}

	}

	function mouse_move(e){
		e.preventDefault();
		var clientPos = moveObj.row ? e.clientY : e.clientX;
		var diff = (mouseStart < clientPos) ? clientPos - mouseStart : -(mouseStart - clientPos);

		var pos = startPos + diff;

		var suspend = false;
		var prevObj = moveObj.prev;
		if(prevObj) {
			if ( prevObj.resizable && pos <= moveObj.min ) {
				moveTo( prevObj, pos - splitter_size );
			}

			if( ! prevObj.resizable && pos < prevObj.max){
				suspend = true;
			}
		}

		if (! suspend ){

			var nextObj = moveObj.next;
			if(nextObj){
				if(nextObj.resizable && pos > nextObj.max){
					moveTo(nextObj, pos + splitter_size);
				}

				if( ! nextObj.resizable && pos > nextObj.max){
					suspend = true;
				}

			}


		}


		if (! suspend ) {
			moveTo( moveObj, pos );
		}




	}

	LayoutSplitterResizeThrottle.add(resize);
	
	//window.addEventListener("resize", resize);
	function resize(obj){

		for(var i=0; i<rootList.length; i++){
			var obj = rootList[i];
			var dims = obj.rootElem.getBoundingClientRect();
			var w = dims.width;
			var h = dims.height;
			var diff_w = w - obj.w;
			var diff_h = h - obj.h;
			if(diff_w || diff_h){
				obj.parent.w = obj.w = w;
				obj.parent.h = obj.h = h;
				obj.elem.style.width = w + "px";
				obj.elem.style.height = h + "px";
				resizeLast(obj, diff_w, diff_h);
			}

		}
	}

	function resizeLast(obj, diff_w, diff_h){

		var kids = obj.children;
		for(var i=0; i<kids.length; i++) {
			var kid = kids[i];
			if(kid.last){

				var kidElemStyle = kid.elem.style;

				//var mover = kid.prev;
				var mover = kid;
				if(kid.row){
					moveTo(mover, mover.top + mover.h + diff_h, true);
				} else {
					moveTo(mover, mover.left + mover.w + diff_w, true);
				}

			}

			if(kid.children){
				resizeLast(kid, diff_w, diff_h)
			}
		}
	}

	var STATIC_W = "w";
	var STATIC_H = "h";
	var STATIC_WIDTH = "width";
	var STATIC_HEIGHT = "height";
	var STATIC_TOP = "top";
	var STATIC_LEFT = "left";
	var STATIC_PX = "px";

	function moveTo(obj, pos, resizing){

		var rootObj = obj.root;

		var amRow = obj.row

		if( // pos >= obj.min &&
			//pos < nextCheckMin - splitter_size &&
			pos > obj.min &&
			pos < (amRow ? rootObj.h : rootObj.w) - splitter_size &&
			pos > splitter_size
		){

			var wh;
			var widthheight;
			var topleft;
			if(amRow) {

				wh = STATIC_H;
				widthheight = STATIC_HEIGHT;
				topleft = STATIC_TOP;


			} else {

				wh = STATIC_W;
				widthheight = STATIC_WIDTH;
				topleft = STATIC_LEFT;

			}

			// Splitter
			var splt = obj.splitter;
			if(splt){
				splt.style[topleft] = pos + STATIC_PX;
			}

			// Move & resize obj
			var newSize = pos - obj[topleft];
			var diffSize = newSize - obj[wh];
			obj[wh] = newSize;
			// min stays as-is
			obj.max = pos;
			obj.elem.style[widthheight] = newSize + STATIC_PX;
			if(obj.onResize){
				handleOnResize(obj);
			}

			// Move & resize NEXT obj
			var nextObj = obj.next;
			if(nextObj){
				var nextStyle = nextObj.elem.style;
				nextObj[topleft] = pos;
				nextObj.min = pos + (nextObj.minSource || 0);
				nextStyle[topleft] = pos + splitter_size + STATIC_PX;

				var nextSize = nextObj[wh];

				// Leave NEXT width / height as-is when resizing window.
				if( ! resizing ){
					nextSize -= diffSize;
				}

				nextObj.max = pos + nextSize;
				nextObj[wh] = nextSize;
				nextStyle[widthheight] = nextSize + STATIC_PX;

				if(nextObj.onResize){
					handleOnResize(nextObj);
				}
			}


		}


	}


	function addListenerWithArgs(elem, evt, func, vars){
		var f = (function(ff, vv){
			return (function (e){
				ff(e, vv);
			});
		}(func, vars));

		elem.addEventListener(evt, f);

		return f;
	}

	function parseNumUnits(val, containerDims, row){
		
		var num = parseFloat(val) || 0;
		var numSource = num;
		var units = ("" + (val ? val : "") ).match(/\%/) ? "%" : "px";
		var unitsSource = units;
		
		if(units == "%"){
			var edge = row ? containerDims.width : containerDims.height;
			num = edge * (num / 100);
			units = "px";
		}
		
		return {
			  num : num
			, units : units
			, numSource : numSource
			, unitsSource : unitsSource
		}
	}

	function findSibs(elem){
		var prev = elem.previousSibling;
		var next = elem.nextSibling;

		var ret = {prev : null, next : null};
		if(prev){

			while(prev.nodeType != 1){
				prev = prev.previousSibling;
				if( ! prev ){
					prev = null;
					break;
				}
			}
			ret.prev = prev;
		}

		if(next){
			while(next.nodeType != 1){
				next = next.nextSibling;
				if( ! next ){
					next = null;
					break;
				}
			}
			ret.next = next;
		}


		return ret;
	}
	
	// For some reason we have to touch each cell, otherwise if 
	// there is a scrollbar within a cell, the scrollbar gets covered 
	// up by a splitter. By touching each cell we fix this anomoly.
	for(var i=0; i<cells.length; i++){
		
		var obj = cells[i];
		if( ! obj.last ){
		
			var wh;
			var widthheight;
			var topleft;
			var amRow = obj.row;
			if(amRow) {

				wh = STATIC_H;
				widthheight = STATIC_HEIGHT;
				topleft = STATIC_TOP;


			} else {

				wh = STATIC_W;
				widthheight = STATIC_WIDTH;
				topleft = STATIC_LEFT;

			}
			
			moveTo( obj, obj[wh] );
		}
	}
	

	
});

document.addEventListener("DOMContentLoaded", jbeeb.LayoutSplitter);