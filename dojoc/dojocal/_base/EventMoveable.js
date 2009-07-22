/*
 * Author: unscriptable
 * Date: Feb 7, 2009
 */
dojo.provide('dojoc.dojocal._base.EventMoveable');

dojo.require('dojo.dnd.Moveable');
dojo.require('dojoc.dojocal._base.common');
dojo.require('dojoc.dojocal._base.Mover');

(function (/* dojoc.dojocal */ djc) { // closure for local variables

/**
 * dojoc.dojocal.EventMoveable
 */
dojo.declare('dojoc.dojocal._base.EventMoveable', dojo.dnd.Moveable, {

	// sizerNode: DOMNode
	//   If provided, holds a reference to the node that is used to SIZE the event.
	//   Any actions performed by the user on this node should resize rather than move.
	sizerNode: null,

	// boundingNode: DOMNode
	// this is the element that constrains the area that the event may be dragged within
	boundingNode: null,

	// scrollingNode: DOMNode
	// this is the element that should be scrolled if the event is dragged to it's edges
	scrollingNode: null,

	// targetNodes: Array of DOMNodes
	// these are the valid targets that the event may be dragged onto
	// Note: we assume that the current parentNode of the dragged event is within this array!
	targetNodes: null,

	// destinationNode: DOMNode
	// this is the node to which the event was moved
	// destinationNode is set after a drag operation
	destinationNode: null,

	// destinationBox: Object
	// this is the coords of the dragged event
	// destinationBox is set to the event coords after a drag operation
	destinationBox: null,

	onSizing: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary: called before every incremental size
	},
	onSized: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary: called after every incremental size
	},

	constructor: function (node, params) {
		// copy params
		for (var p in params) {
			if (p in this)
				this[p] = params[p];
		}
		// fix mover
		this.mover = params.mover || djc._base.Mover;
	},

	onMouseDown: function (e) {
		// detect whether we are moving or resizing
		this._isResizeAction = this.sizerNode && djc.isAncestorNode(e.target, this.sizerNode);
if (this._isResizeAction)
console.log('sizing not supported, yet');
		this.inherited(arguments);
	},

	onMove: function (/* dojo.dnd.Mover */ mover, /* Object */ leftTop) {
		if (this._isResizeAction) {
			this.onSizing(mover, leftTop);
			this._doSize(mover, leftTop);
			this.onSized(mover, leftTop);
		}
		else {
			this.onMoving(mover, leftTop);
			this._doMove(mover, leftTop);
			this.onMoved(mover, leftTop);
		}
	},

	_doMove: function (mover, leftTop) {
		var s = mover.node.style;
		s.left = leftTop.l + "px";
		s.top  = leftTop.t + "px";
	},

	_doSize: function (mover, leftTop) {
		// TODO: sizing goes here
		// a good way to do this would be to change the mover so it sends back relative measurements instead of absolute
	}

});

})(dojoc.dojocal); // end of closure for local variables