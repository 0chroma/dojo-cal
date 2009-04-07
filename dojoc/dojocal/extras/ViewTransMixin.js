/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Jan 31, 2009
	TODO:
		- Add more animations:
			- week <--> month
			- day <--> month
*/
dojo.provide('dojoc.dojocal.extras.ViewTransMixin');

dojo.require('dojoc.dojocal._base.common');

(function () { // closure for local variables

var djc = dojoc.dojoca;

/*
	dojoc.dojocal.ViewTransMixin
	Mixin this class to use cool transition animations when switching between grid views!
*/
dojo.declare('dojoc.dojocal.extras.ViewTransMixin', null, {

	xxx_transitionViews: function (oldView, newView, oldNode, newNode) {
		// TODO: get this working
		return false;
		// TODO: month view transitions
		if (newView instanceof djc.views.MonthView || oldView instanceof djc.views.MonthView) {
			return false;
		}
		// TODO: stop any current animation before starting new one!
		// TODO? fadein/out header text via opacity?
		// motion
		var isZooming = oldView instanceof djc.views.WeekView,
			supportsMinWidth = 'minWidth' in newNode.style,
			dayNode = this.dayViewNode,
			weekNode = this.weekViewNode,
			weekdayNode = this._weekDayLayouts[this._weekdayColNum],
			zoomWidth = (this.weekContainerNode.offsetWidth - this.weekTimeLayoutContainer.offsetWidth - djc.getScrollbarWidth()) / this.weekContainerNode.offsetWidth * 100,
			// use the visible time layout container!
			zoomLeft = isZooming ? this.weekTimeLayoutContainer.offsetWidth : this.dayTimeLayoutContainer.offsetWidth,
			// TODO: this is xxx/zero when unzooming
			colWidth = weekdayNode.offsetWidth / this.weekContainerNode.offsetWidth * 100,
			// TODO: this is xxx/zero when unzooming
			colLeft = dojo.coords(weekdayNode).x - dojo.coords(this.weekContainerNode).x,
			eventWidgets = this._getAllEventsInNode(dayNode),
			motionProps = {
				node: dayNode,
				duration: this.transitionDuration,
				properties: {
					left: {start: isZooming ? colLeft : zoomLeft, end: isZooming ? zoomLeft : colLeft, units: 'px'},
					width: {start: isZooming ? colWidth: zoomWidth, end: isZooming ? zoomWidth : colWidth, units: '%'}
				},
				onBegin: dojo.hitch(this, function () {
					newNode.style.visibility = '';
					newNode.style.zIndex = 1;
					this.dayHeaderWrapper.style.paddingRight = ''
					dojo.addClass(this.domNode, 'animating');
				}),
				onEnd: dojo.hitch(this, function () {
					oldNode.style.zIndex = 0;
					oldNode.style.visibility = 'hidden';
					dojo.removeClass(this.domNode, 'animating');
					this.dayHeaderWrapper.style.paddingRight = djc.getScrollbarWidth() + 'px'
					motionProps.node.style.width = '';
					motionProps.node.style.left = '';
					// remove styling on event widgets
					dojo.forEach(eventWidgets, function (event) {
						if (supportsMinWidth) {
							event.domNode.style.minWidth = '';
						}
						else if (event._layoutPrevWidth) {
							// especially remove IE 6 css expressions for performance reasons!
							event.domNode.style.width = event._layoutPrevWidth;
							delete event._layoutPrevWidth;
						}
					});
				})
			},
			motionAnim = dojo.animateProperty(motionProps);
		// prep
		dojo.forEach(eventWidgets, function (event) {
			if (event._layoutBox) {
				// convert from % to px
				var minWidth = weekdayNode.offsetWidth * event._layoutBox.w / 100;
				event.domNode.style.minWidth = minWidth + 'px';
				if (!supportsMinWidth) {
					// save current width for restoring later
					event._layoutPrevWidth = event.domNode.style.width;
					// fake minWidth for IE 6
					event.domNode.style.setExpression('width', 'offsetWidth<' + minWidth + '?' + minWidth + 'px:' + event._layoutBox.w + '%');
				}
			}
		});
		if (isZooming) {
			this.dayContainerNode.scrollTop = this.weekContainerNode.scrollTop;
		}
		else {
			this.weekContainerNode.scrollTop = this.dayContainerNode.scrollTop;
		}
		// go!
		motionAnim.play();
	}

});

})(); // end of closure for local variables