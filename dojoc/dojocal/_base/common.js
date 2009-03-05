/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: john
	Date: Jan 31, 2009
	All common classes and "enums" are found here.
	For convenience, qualified names are under dojoc.dojocal, rather than
	dojoc.dojocal._base.common!
*/
dojo.provide('dojoc.dojocal._base.common');

(function () { // closure for local variables

var dndModes = dojoc.dojocal.DndModes = {
		NONE: 0,
		DISCRETE: 1,
		FLUID: 2
	};
var allDayEventsPositions = dojoc.dojocal.AllDayEventPositions = {
		HIDDEN: 0,
		TOP: 1,
		BOTTOM: 2
	};

dojo.mixin(dojoc.dojocal, {

	// useful constants
	hoursPerDay: 24,
	minutesPerDay: 24 * 60,
	secPerDay: 24 * 60 * 60,
	msecPerDay: 24 * 60 * 60 * 1000,

	getNodeBox: function (/* DOMNode|_Widget */ obj, /* Boolean? */ asPercent) {
		// summary: returns the box for the node
		// asPercent: Boolean
		//	 set to true to get the box dimensions as a percent of the offsetParent's dimensions
		// TODO: use dojo.marginBox when offsetXXX properties are not available
		var node = obj.nodeType ? obj : obj.domNode,
			box = new dojoc.dojocal.OffsetBox(node);
		if (asPercent) {
			var pw = 1 / (node.offsetParent.offsetWidth || Infinity),
				ph = 1 / (node.offsetParent.offsetHeight || Infinity);
			box.scaleBy(pw, ph);
		}
		return box;
	},

	getCoordsBox: function (/* DOMNode|_Widget */ obj, /* Boolean? */ includeScroll) {
		// summary: returns the box for the node in reference to the viewport
		// includeScroll: Boolean
		//	 set to true to include scroll measurements in the box's offsets
		var coords = dojo.coords(obj.nodeType ? obj : obj.domNode, includeScroll);
		// convert to OffsetBox-compatible properties
		coords.l = coords.x;
		coords.t = coords.y;
		return new dojoc.dojocal.OffsetBox(coords);
	},

	setNodeBox: function (/* DOMNode|_Widget */ obj, /* OffsetBox */ box, /* String? */ units) {
		var ns = (obj.nodeType ? obj : obj.domNode).style;
		if ('l' in box)
			ns.left = box.l + (units || 'px');
		if ('t' in box)
			ns.top = box.t + (units || 'px');
		if ('w' in box)
			ns.width = box.w + (units || 'px');
		if ('h' in box)
			ns.height = box.h + (units || 'px');
		return obj;
	},

	createScrollbarStyles: function () {
		// summary: creates some styles that help account for the browser's scrollbar width
		//   Don't call this method.  It is called at load time automatically (via dojo.addOnLoad).
		//   Creates the following styles:
		//     dojocalScrollbarPaddingH - has padding on the right equal to the scrollbar width
		//     dojocalScrollbarPaddingV - has padding on the bottom equal to the scrollbar width
		//     dojocalScrollbarMarginH - has margin on the right equal to the scrollbar width
		//     dojocalScrollbarMarginV - has margin on the bottom equal to the scrollbar width
		// TODO: fix for RTL direction / locales
		var ss = this.getDojocalStylesheet(),
			sbw = this.getScrollbarWidth() + 'px',
			ruleDefs = [
				'.dojocalScrollbarPaddingH { padding-right: ' + sbw + ' }',
				'.dojocalScrollbarPaddingV { padding-bottom: ' + sbw + ' }',
				'.dojocalScrollbarMarginH { margin-right: ' + sbw + ' }',
				'.dojocalScrollbarMarginV { margin-bottom: ' + sbw + ' }'
			];
		if (ss.cssRules) { // w3c
			dojo.forEach(ruleDefs, ss.insertRule, ss);
		}
		else { // ie
			dojo.forEach(ruleDefs, function (def) { var p = def.indexOf('{'); ss.addRule(def.substr(0, p), def.substr(p)); });
		}
		return ss;
	},

	getDojocalStylesheet: function () {
		if (!this._djcss)
			this._djcss = this.createStylesheet()
		return this._djcss;
	},

	/***** utility functions *****/
	// functions that dojo or dijit should have already!!!! (hint, hint)

	findAncestorNode: function (/* DOMNode */ node, /* Any */ which, /* Function */ detector) {
		// summary:
		//   finds an ancestor node by using the detector function and the supplied data (which)
		//   or returns null if no ancestor was found
		//   Don't use this method.  Use getAncestorByXXX methods below.
		// which: Any data type
		//   data to be sent to the detector function to find a match
		// detector: Function
		//   the function to detect whether the correct ancestor has been found
		//   param 1: the current node being tested; param 2: the which parameter passed to findAncestorNode
		while (node && node.nodeType != 9 /* document node */ && !detector(node, which)) {
			node = node.parentNode;
		}
		return node.nodeType != 9 && node || null;
	},

	getAncestorByTagName: function (/* DOMNode */ node, /* String */ tagName) {
		// summary: finds an ancestor that has the specified tagName
		tagName = tagName.toUpperCase();
		return this.findAncestorNode(node, tagName, function (n, t) { return n.tagName.toUpperCase() == t; });
	},

	getAncestorByClassName: function (/* DOMNode */ node, /* String */ className) {
		// summary: finds an ancestor node that has the specified class
		return this.findAncestorNode(node, className, dojo.hasClass);
	},

	getAncestorByAttrName: function (/* DOMNode */ node, /* String */ attrName) {
		// summary: finds an ancestor node that has the specified attribute (of any value)
		return this.findAncestorNode(node, attrName, function (n, a) { return n.getAttribute && dojo.hasAttr(n, a); });
	},

	isAncestorNode: function (/* DOMNode */ node, /* DOMNode */ ancestor) {
		return !!this.findAncestorNode(node, ancestor, function (n, a) { return n == a; });
	},

	getScrollbarWidth: function () {
		// something like this exists in dojox I just discovered, but we don't want to rely on dojox
		if (!this._scrollbarWidth) {
			this._scrollbarWidth = 15;
			var testEl = dojo.doc.createElement('DIV');
			try {
				testEl.style.cssText = 'width:100px;height:100px;overflow:scroll;bottom:100%;right:100%;position:absolute;visibility:hidden;'
				dojo.body().appendChild(testEl);
				this._scrollbarWidth = testEl.offsetWidth - (dojo.isIE ? testEl.clientWidth : testEl.scrollWidth);
				dojo.body().removeChild(testEl);
			}
			catch (ex) {
				// squelch
			}
		}
		return this._scrollbarWidth;
	},

	createStylesheet: function (cssText) {
		var doc = dojo.doc,
			node = doc.createElement('style');
		// add to head tag (or to body tag, if head is missing)
		dojo.query('HEAD,BODY', doc)[0].appendChild(node);
		node.setAttribute('type', 'text/css');
		// insert css text
		// IE6 and Safari 2 need to have cssText or the stylesheet won't get created
		cssText = cssText || '#__dummy__ {}';
		// IE (hack city)
		if (node.styleSheet) {
			function setText () {
				try { node.styleSheet.cssText = cssText; }
				catch (ex) { dojo.debug(ex); }
			}
			if (node.styleSheet.disabled) setTimeout(setText, 10);
			else setText();
		}
		// w3c
		else {
			node.appendChild(doc.createTextNode(cssText));
		}
		return node.sheet || node.styleSheet;
	},

	/* useful date functions */

	dateOnly: function (date) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	},

	timeOnly: function (date) {
		var d = new Date(0, 0, 0, date.getHours(), date.getMinutes(), date.getSeconds());
		d.setMilliseconds(date.getMilliseconds());
		return d;
	},

	getWeekStart: function () {

	}

});

// create scrollbar helper styles
dojo.addOnLoad(dojo.hitch(dojoc.dojocal, dojoc.dojocal.createScrollbarStyles));

//dojoc.dojocal.UserEvent = {
//	uid: '', // unique id
//	startDateTime: '', // iso-formatted date-time string
//	duration: 0, // duration in seconds (TODO: ????)
//	summary: '', // text summary / title
//	description: '', // a longer description
//	isAllDay: false,
//	recurrence: {
//		// TODO: finish recurrence (exceptions, etc.)
//		frequency: '', // TBD
//		interval: '' // TBD
//	}
//};

//dojoc.dojocal.EventOptions = {
//	eventClass: '', // the Javascript class to create the event widget
//	cssStyles: '', // can be used to override styles on the top node, such as font styles
//	cssClasses: '' // can be used for ultimate stlying control of the event widget
//};

/**
 * dojoc.dojocal.UserCalendar is the collection of event items organized into a user calendar.
 */
dojo.declare('dojoc.dojocal.UserCalendar', null, {

	id: '',
	color: '#33ff00',
	fontColor: '#007700',
	defaultEventClass: '', // widget class: if specified, overrides class specified by view

	onChangeEvent: function (/* dojoc.dojocal.UserEvent | Array */ event, /* String */ changeType) {},

	setColor: function (/* String */ color)  {
		this.color = color;
		/* raise topic to change color of event widgets? */
	},

	addEvents: function (/* Array of dojoc.dojocal.UserEvent */ events, /* dojoc.dojocal.EventOptions? */ options) {
		dojo.forEach(events, function (event) {
			this._addEvent(event, options);
		}, this);
		this.onChangeEvent(events, 'add');
	},

	addEvent: function (/* dojoc.dojocal.UserEvent */ event, /* dojoc.dojocal.EventOptions? */ options) {
		this._addEvent(event, options);
		this.onChangeEvent(event, 'add');
	},

	removeEvent: function (/* dojoc.dojocal.UserEvent */ event) {
		var idx = this._findEventPos(event);
		if (idx >= 0) {
			// TODO: allow cancellation of delete
			this.onChangeEvent(event, 'remove');
			this._events.splice(idx, 1);
		}
	},

	getEvents: function (/* Date? */ startDate, /* Date? */ endDate) {
		// summary: gets all dates that cross the given date range (or all events if no range is given)
		// TODO: recurrence
		if (startDate && endDate) {
			return dojo.filter(this._events, function (e) {
				var end = dojo.date.add(e.data._startDateTime, 'second', e.data.duration); // TODO? assumes seconds!!!!!
				return e.data._startDateTime <= endDate && end >= startDate;
			});
		}
		else
			return this._events;
	},

	constructor: function (params) {
		if (params)
			dojo.mixin(this, params);
		this._events = [];
		this.id = this.id || dijit.getUniqueId(this.declaredClass);
	},

	_addEvent: function (/* dojoc.dojocal.UserEvent */ event, /* dojoc.dojocal.EventOptions? */ options) {
		options = options || {};
		options = dojo.mixin({
			eventClass: this.defaultEventClass,
			cssClasses: '',
			color: this.color,
			fontColor: this.fontColor
		}, options);
		event.calendarId = this.id;
		event._startDateTime = dojo.date.stamp.fromISOString(event.startDateTime);
		event.guid = event.guid || dijit.getUniqueId(this.declaredClass + 'Event');
		this._events.push({data: event, options: options});
	},

	_findEventPos: function (event) {
		// TODO: search by guids????
		var found = -1;
		dojo.some(this._events, function (obj, pos) {
			if (obj.data == event)
				found = pos;
			return found >= 0;
		});
		return found;
	}

});



dojo.declare('dojoc.dojocal.OffsetBox', null, {

	l: 0, // left
	t: 0, // top
	w: 0, // width
	h: 0, // height
	r: 0, // right
	b: 0, // bottom

	constructor: function (/* Node|dojoc.dojocal.OffsetBox|dojo.Coords|dojo.marginBox|etc. */ obj) {
		/// TODO: use GCS so that the node does not have to be displayed / have offsetXXX properties!!!!
		if (obj.nodeType) {
			this.l = obj.offsetLeft;
			this.t = obj.offsetTop;
			this.w = obj.offsetWidth;
			this.h = obj.offsetHeight;
		}
		else {
			this.l = obj.l;
			this.t = obj.t;
			this.w = obj.w;
			this.h = obj.h;
		}
		_fixRandB(this);
	},

	// TODO: add more boxy methods such as resizeBy, etc.?

	sizeTo: function (w, h) {
		this.w = _getNum(w, this.w);
		this.h = _getNum(h, this.h);
		_fixRandB(this);
		return this;
	},

	moveTo: function (l, t) {
		this.l = _getNum(l, this.l);
		this.t = _getNum(t, this.t);
		_fixRandB(this);
		return this;
	},

	scaleBy: function (mx, my, isStationary) {
		mx = _getNum(mx, 1);
		my = _getNum(my, 1);
		this.w = this.w * mx;
		this.h = this.h * my;
		if (!isStationary) {
			this.l = this.l * mx;
			this.t = this.t * my;
		}
		_fixRandB(this);
		return this;
	},

	intersects: function (/* Node|dojoc.dojocal.OffsetBox|dojo.Coords|dojo.marginBox|etc. */ obj) {
		// summary: returns true if the box of the passed parameter intersects this box
		var test = (obj.r == undefined || obj.b == undefined) ? new dojoc.dojocal.OffsetBox(obj) : obj;
		return (this.l <= test.r && this.r >= test.l) && (this.t <= test.b && this.b >= test.t);
	},

	surrounds: function (/* Node|dojoc.dojocal.OffsetBox|dojo.Coords|dojo.marginBox|etc. */ obj) {
		// summary: returns true is the box of the passed parameter completely surrounds this box
		var test = (obj.r == undefined || obj.b == undefined) ? new dojoc.dojocal.OffsetBox(obj) : obj;
		return (this.l <= test.l && this.r >= test.r) && (this.t <= test.t && this.b >= test.b);
	}

});

dojoc.dojocal.OffsetBox.getUnion = function (/* boxes */) {
	// summary: computes the aggregate intersection of many boxes
	return _box_agg([Math.min, Math.max], arguments);
};
dojoc.dojocal.OffsetBox.getIntersection = function (/* boxes */) {
	// summary: computes the aggregate union of many boxes
	return _box_agg([Math.max, Math.min], arguments);
}

// private methods for OffsetBox
function _getNum (obj, defaultNum) {
	var num = parseFloat(obj);
	return isNaN(num) ? defaultNum : num;
};

function _fixRandB (box) {
	box.r = box.l + box.w;
	box.b = box.t + box.h;
};

function _box_agg (ops, boxes) {
	// summary: box aggregation function
	var result; // resulting box
	dojo.forEach(boxes, function (box) {
		if (box) {
			if (!result) {
				result = new dojoc.dojocal.OffsetBox(box);
			}
			else {
				result.moveTo(ops[0](result.l, box.l), ops[0](result.t, box.t));
				result.sizeTo(ops[1](result.r, box.r) - result.l, ops[1](result.b, box.b) - result.t);
			}
		}
	});
	return result;
};



})(); // end of closure for local variables