/*
 * Author: unscriptable
 * Date: Apr 7, 2009
 */
dojo.provide('dojoc.dojocal._base.AllDayEventMoveable');

(function (/* dojoc.dojocal */ djc) { // closure for local variables

/**
 * dojoc.dojocal._base.AllDayEventMoveable
 */
dojo.declare('dojoc.dojocal._base.AllDayEventMoveable', [djc._base.EventMoveable], {
	// summary: executes the drag-and-drop functionality of the month and all-day events

	fluid: false, // TODO: subclass rather than use a property?
	dndFluidSnapThreshold: 30,

	onMoveStart: function(/* dojo.dnd.Mover */ mover){
		this.inherited(arguments);
		this._dndData = this._getInitialDragData(mover.host.node);
	},

	onMoveStop: function(/* dojo.dnd.Mover */ mover){
		this.inherited(arguments);
		var node = mover.host.node;
//console.log('onMoveStop')
		// snap to the closest target
		// Note: assumes that a new target is guaranteed to be found (i.e. dnd operation always ends successfully within layout)!
		var data = this._getCurrentDragData(node);
//console.log('stop: ', data, data.target)
		this.destinationNode = data.target;
		this.destinationBox = data.eventCoords;
		delete this._dndData;
	},

	onMoving: function(/* dojo.dnd.Mover */ mover, /* Object */ leftTop){
		this.inherited(arguments);
//console.log('_onEventDragging')
//console.log(1, leftTop)

		var node = mover.host.node;
		// restrict movement to bounding box
		leftTop.l = Math.min(Math.max(this._dndData.boundingBox.l, leftTop.l), this._dndData.boundingBox.r - node.offsetWidth);
		leftTop.t = Math.min(Math.max(this._dndData.boundingBox.t, leftTop.t), this._dndData.boundingBox.b - node.offsetHeight);
		// figure out nearest target
		var isFluid = this.fluid,
			newDragData = this._getCurrentDragData(node, isFluid ? null : leftTop);
//console.log(newDragData);
		this._dndData.currentData = newDragData;
		this._dndData.leftTop = leftTop; // save for auto-scroll TODO: move this to views?
		// if we're doing fluid dnd
		if (isFluid) {
			// snap to the current weekday column if we've been close to a column for a while
			if (Math.abs(leftTop.l /*+ eventWidget._dndData.parentBox.l*/ - newDragData.colCoords.l) < this.dndFluidSnapThreshold) {
				if (!this._dndData._snapToColCheckTime || ((new Date()) - this._dndData._snapToColCheckTime > this._dragSnapTimeout)) {
//					leftTop.l = -(eventWidget._dndData.parentBox.l - newDragData.colCoords.l);
					leftTop.l = newDragData.colCoords.l;
				}
			}
			else {
				this._dndData._snapToColCheckTime = new Date();
			}
// TODO: how to do this?
//			// snap to the current time row if we've been close to a time for a while
//			var nearbyTimePx = Math.round(leftTop.t / newDragData.colCoords.h * 24 * 60 / this.userChangeResolution) * this.userChangeResolution / 60 / 24 * newDragData.colCoords.h;
//			if (Math.abs(leftTop.t - nearbyTimePx) < this.userChangeResolution / 2) {
//				if (!this._dndData._snapToRowCheckTime || ((new Date()) - this._dndData._snapToRowCheckTime > this._dragSnapTimeout)) {
//					leftTop.t = nearbyTimePx;
//				}
//			}
//			else {
//				this._dndData._snapToRowCheckTime = new Date();
//			}
		}
		// otherwise, we must be doing DISCRETE dnd
		else {
			leftTop.l = -(/*eventWidget._dndData.parentBox.l */- newDragData.colCoords.l);
			// TODO: keep y offset within current cell
		}
	},

	_getInitialDragData: function (node) {
//console.log('_getInitialDragData')
		// TODO: save the original data so that it can be reverted?
		// get bounding box and offsetParent box
		var bNode = this.boundingNode,
			sNode = this.scrollingNode,
			bBox = dojo.coords(bNode, true),
			// do we need to consider scrolling at the moment?
			sBox = sNode && (sNode.scrollHeight > sNode.clientHeight || sNode.scrollWidth > sNode.clientWidth) ? dojo.coords(sNode, true) : null,
			parent = node.parentNode,
			pBox = dojo.coords(parent, true),
			// get drop target boxes in reference to offsetParent (since that's how dojo.moveable will report leftTop)
			targets = dojo.map(this.targetNodes, function (tgt) {
				var tc = dojo.coords(tgt, true);
				return {l: tc.x - pBox.x, t: tc.y - pBox.y, w: tc.w, h: tc.h, node: tgt};
			});
//console.log(this, isAllDay, sNode, sBox, pBox)
		// grab the current boxes for the relevant nodes
		var data = {
				boundingBox: {
					l: bBox.x - pBox.x,
					t: bBox.y - pBox.y,
					r: bBox.x + bBox.w - pBox.x,
					b: bBox.y + bBox.h - pBox.y
				},
				parentBox: pBox,
				scrollBox: !!sBox && {
					l: sBox.x - pBox.x,
					t: sBox.y - pBox.y,
					r: sBox.x + sBox.w - pBox.x,
					b: sBox.y + sBox.h - pBox.y
				},
				parent: parent,
				targetBoxes: targets
			};
//console.dir(data)
		return data;
	},

	_getCurrentDragData: function (node, leftTop) {
//console.log('_getCurrentDragData')
		var eventCoords = leftTop || {l: node.offsetLeft, t: node.offsetTop},
			bestPick,
			bestPickOverlap = -1;
		eventCoords.w = node.offsetWidth;
		eventCoords.h = node.offsetHeight;
		// find "best pick": the target that overlaps with the event the most
		dojo.forEach(this._dndData.targetBoxes, function (box) {
			var overlapX = Math.max(Math.min(eventCoords.l + eventCoords.w, box.l + box.w) - Math.max(eventCoords.l, box.l), 0),
				overlapY = Math.max(Math.min(eventCoords.t + eventCoords.h, box.t + box.h) - Math.max(eventCoords.t, box.t), 0),
				overlap = overlapX * overlapY;
			if (overlap > bestPickOverlap) {
				bestPickOverlap = overlap;
				bestPick = {target: box.node, colCoords: box, eventCoords: eventCoords};
			}
		});
		return bestPick;
	},

	// time a user lingers near a column before snapping the event widget to it
	_dragSnapTimeout: 500,

	// time a user stops dragging before updating the event widget's date and time
	_dragUpdateTimeout: 100,

	// time between checks for auto-scrolling during a drag-and-drop
	_dragAutoScrollTimeout: 50,

	// speed in px per sec per scroll offset for auto-scrolling during a drag-and-drop
	_dragAutoScrollSpeed: 4

});

})(dojoc.dojocal); // end of closure for local variables