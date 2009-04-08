/*
 * Author: unscriptable
 * Date: Feb 7, 2009
 */
dojo.provide('dojoc.dojocal._base.EventMoveable');

dojo.require('dojo.dnd.Moveable');
dojo.require('dojoc.dojocal._base.common');
dojo.require('dojoc.dojocal._base.Mover');

(function () { // closure for local variables

/**
 * dojoc.dojocal.EventMoveable
 */
dojo.declare('dojoc.dojocal._base.EventMoveable', dojo.dnd.Moveable, {

	// sizerNode: DOMNode
	//   If provided, holds a reference to the node that is used to SIZE the event.
	//   Any actions performed by the user on this node should resize rather than move.
	sizerNode: null,

	onSizing: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary: called before every incremental size
	},
	onSized: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		// summary: called after every incremental size
	},

	constructor: function (node, params) {
		this.mover = params.mover || dojoc.dojocal._base.Mover;
		this.sizerNode = params.sizerNode;
	},

	onMouseDown: function (e) {
		// detect whether we are moving or resizing
		this._isResizeAction = this.sizerNode && dojoc.dojocal.isAncestorNode(e.target, this.sizerNode);
if (this._isResizeAction) console.log('sizing not supported, yet');
		this.inherited(arguments);
	},

	onMove: function (/* dojo.dnd.Mover */ mover, /* Object */ leftTop) {
		if (this._isResizeAction) {
			this.onSizing(mover, leftTop);
			// TODO: sizing goes here
			// a good way to do this would be to change the mover so it sends back relative measurements instead of absolute
			this.onSized(mover, leftTop);
		}
		else {
			this.onMoving(mover, leftTop);
			var s = mover.node.style;
			s.left = leftTop.l + "px";
			s.top  = leftTop.t + "px";
			this.onMoved(mover, leftTop);
		}
	}

});

})(); // end of closure for local variables