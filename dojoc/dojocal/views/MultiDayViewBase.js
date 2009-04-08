/*
 * Author: unscriptable
 * Date: Feb 23, 2009
 */
dojo.provide('dojoc.dojocal.views.MultiDayViewBase');

dojo.require('dijit._Templated');
dojo.require('dojoc.dojocal._base.ViewBase');

(function () { // closure for local variables

var djc = dojoc.dojocal,
	dndModes = djc.DndModes;

/**
 * dojoc.dojocal.views.MultiDayViewBase
 */
dojo.declare('dojoc.dojocal.views.MultiDayViewBase', [dojoc.dojocal._base.ViewBase, dijit._Templated], {

	templatePath: dojo.moduleUrl('dojoc.dojocal.views', 'MultiDayView.html'),

	/* overrides */

	// dayCount: Number
	// number of days to show in the view
	dayCount: 1,

	// isExpanded: Boolean
	// used for event styling and animation to determine whether to display
	// the event collapsed or expanded
	isExpanded: false,

	setStartOfDay: function (/* Number */ minuteOfDay) {
		this.inherited(arguments);
		this._setStartOfDay(minuteOfDay);
	},

	getStartOfDay: function (/* Boolean? */ exact) {
		var min = this.scrollContainerNode.scrollTop / this.bodyNode.offsetHeight * djc.minutesPerDay;
		return exact ? min : Math.round(min * 60) / 60;
	},

	updateTimeOfDay: function () {
		// TODO: is this being subscribed to within a central setTimeout?
		this._checkTodayHighlighting();
		this._updateTimeMarker();
	},

	postCreate: function () {
		this.inherited(arguments);
		// create programmatic dom elements
		this._createDayColumns();
		this._createHourlyRows();
		this._prepareSplitters();
		// collect day layout elements (because we use them often)
		this._dayLayouts = dojo.query('.dojocalDayColumnLayout', this.tableNode);
		this._allDayLayouts = dojo.query('.dojocalDayColumnLayout', this.footerNode);
		// subscribe to events
		dojo.subscribe('dojoc.dojocal.' + this.gridId + '.setStartOfDay', dojo.hitch(this, '_setStartOfDay'));
		dojo.subscribe('dojoc.dojocal.' + this.gridId + '.setSplitterHeight', dojo.hitch(this, '_splitterResize', this.splitterNodeMoveable));
	},

//	startup: function () {
//		this.inherited(arguments);
//	},

	destroy: function () {
		// clear out references to dom nodes
		delete this._dayLayouts;
		delete this._allDayLayouts;
		// clear out references to moveables which hold event handlers
		if (this.splitterNodeMoveable)
			this.splitterNodeMoveable.destroy();
		// remove event moveables, too
		dojo.forEach(this._getAllEventsInNode(this.domNode), function (eWidget) {
			if (eWidget.moveable)
				eWidget.moveable.destroy();
		});
		this.inherited(arguments);
	},

	/* private methods */

	_setStartOfDay: function (/* Number */ minuteOfDay) {
		this._scrollToTime(minuteOfDay);
	},

	_scrollToTime: function (/* Number */ minuteOfDay) {
		this.scrollContainerNode.scrollTop = this.bodyNode.offsetHeight / djc.minutesPerDay * minuteOfDay;
	},

	_setCornerHeaderDate: function () {
		if (this.cornerCellDatePattern != null) {
			var dateString = dojo.date.locale.format(this.getStartDate(), {selector: 'date', datePattern: this.cornerCellDatePattern});
			dojo.query('.dojocalDateLeader .dojocalDateCellText', this.domNode).forEach(function (node) {
				node.innerHTML = dateString;
			}, this);
		}
	},

	_setTimeColumnDates: function () {
		var date = new Date(this._startDate);
		dojo.query('.dojocalTimeCellText', this.domNode).forEach(function (node) {
			date.setHours(node.parentNode._hour, 0, 0);
			node.innerHTML = dojo.date.locale.format(date, {selector: 'time', timePattern: this.timeCellDatePattern});
		}, this);
	},

	_createDayColumns: function () {
		// create header, footer, and days
		var htemp = this.headerCellTemplate,
			ftemp = this.footerCellTemplate,
			dtemp = this.dayColumnTemplate;
		// for each day in this view
		dojo.forEach(new Array(this.dayCount - 1), function (u, i) {
			// header
			var n = htemp.cloneNode(true);
			htemp.parentNode.appendChild(n);
			dojo.attr(n, 'day', i);
			// footer
			n = ftemp.cloneNode(true);
			ftemp.parentNode.appendChild(n);
			dojo.attr(n, 'day', i);
			// days
			n = dtemp.cloneNode(true);
			dtemp.parentNode.appendChild(n);
			dojo.attr(n, 'day', i);
		});
	},

	_createHourlyRows: function () {
		this._createTimeCells();
		this._createGridLines();
	},

	_createTimeCells: function () {
		// create time leader cells
		var template = this.timeCellTemplate,
			cont = this.timeLayoutContainer,
			height = 1 / djc.hoursPerDay;
		this.timeCellTemplate.parentNode.removeChild(this.timeCellTemplate);
		// every hour
		dojo.forEach(new Array(djc.hoursPerDay), function (u, i) {
			var cell = template.cloneNode(true);
			cell.style.top = (i * height * 100) + '%';
			cell.style.height = (height * 100) + '%';
			cell._hour = i;
			cont.appendChild(cell);
		});
	},

	_createGridLines: function () {
		// create grid lines
		var template = this.dayRowTemplate,
			cont = this.rowsContainerNode,
			gridLinesPerDay = Math.floor(djc.minutesPerDay / this.minutesPerGridLine),
			gridLinesPerHour = gridLinesPerDay / djc.hoursPerDay;
		this.dayRowTemplate.parentNode.removeChild(this.dayRowTemplate);
		// for each grid line
		for (var i = 0; i <= gridLinesPerDay; i++) {
			var row = template.cloneNode(true),
				top = i / gridLinesPerDay;
			row.style.top = (top * 100) + '%';
			if (i % gridLinesPerHour == 0)
				dojo.addClass(row, 'dojocalDayRowHourly');
			cont.appendChild(row);
		}
	},

	_setHeaderDates: function () {
		var date = new Date(this._startDate);
		dojo.query('.dojocalDateCellText', this.headerTableNode).forEach(function (node) {
			node.innerHTML = dojo.date.locale.format(date, {selector: 'date', datePattern: this.headerDatePattern});
			// 0 = Sunday. don't store date object on node because IE will leak memory
			dojo.attr(djc.getAncestorByTagName(node, 'TD'), 'day', date.getDay().toString());
			date = dojo.date.add(date, 'day', 1);
		}, this);
	},

	_checkDayHighlighting: function () {
		if (this._prevWeekdayColNum != this._weekdayColNum) {
			if (this._prevWeekdayColNum != undefined) {
				dojo.removeClass(this._dayLayouts[this._prevWeekdayColNum], 'dojocalDay-selected');
				dojo.removeClass(this._allDayLayouts[this._prevWeekdayColNum], 'dojocalDay-selected');
			}
			dojo.addClass(this._dayLayouts[this._weekdayColNum], 'dojocalDay-selected');
			dojo.addClass(this._allDayLayouts[this._weekdayColNum], 'dojocalDay-selected');
		}
	},

	_checkTodayHighlighting: function () {
		// TODO: this needs to not manipulate strings (addClass/removeClass) unless they need to be changed!
		var today = djc.dateOnly(new Date()),
			todayOffset = dojo.date.difference(this._startDate, today, 'day'),
			col = this._dayOfWeekToCol(today.getDay());
		if (col != this._todayWeekdayColNum && this._todayWeekdayColNum != undefined) {
			dojo.removeClass(this._dayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
			dojo.removeClass(this._allDayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
			// hide minute marker
			this.daysColumnTimeMarker.style.display = 'none';
		}
		if (todayOffset >= 0 && todayOffset < this.dayCount) {
			this._todayWeekdayColNum = col;
			dojo.addClass(this._dayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
			dojo.addClass(this._allDayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
			// move and show minute marker
			if (this.daysColumnTimeMarker.parentNode != this._dayLayouts[this._todayWeekdayColNum])
				this._dayLayouts[this._todayWeekdayColNum].appendChild(this.daysColumnTimeMarker);
			this.daysColumnTimeMarker.style.display = '';
		}
	},

	_updateTimeMarker: function () {
		var minutes = this._timeOfDayInMinutes(new Date());
		this.daysColumnTimeMarker.style.top = minutes / djc.minutesPerDay * 100 + '%';
	},

	_addEvent: function (eWidget, isInitialRender) {
		// TODO: put common functionality here (see subclasses for now)
	},

	_newEventWidget: function (clazz, data, color, fontColor, calendarId) {
		var eventWidget = this.inherited(arguments);
		// connect events
		if (this.dndMode != dndModes.NONE) {
			dojo.addClass(eventWidget.domNode, 'draggableEvent');
			var params = {delay: this.dndDetectDistance, sizerNode: eventWidget.handleNode || null},
				moveable = eventWidget.moveable = new dojoc.dojocal._base.EventMoveable(eventWidget.domNode, params);
			if (eventWidget.isAllDay()) {
				eventWidget.connect(moveable, 'onMoveStart', dojo.hitch(this, '_onDayEventDragStart', eventWidget));
				// TODO: change these too:
				eventWidget.connect(moveable, 'onMoveStop', dojo.hitch(this, '_onEventDragStop', eventWidget));
				eventWidget.connect(moveable, 'onMoving', dojo.hitch(this, '_onEventDragging', eventWidget));
			}
			else {
				eventWidget.connect(moveable, 'onMoveStart', dojo.hitch(this, '_onEventDragStart', eventWidget));
				eventWidget.connect(moveable, 'onMoveStop', dojo.hitch(this, '_onEventDragStop', eventWidget));
				eventWidget.connect(moveable, 'onMoving', dojo.hitch(this, '_onEventDragging', eventWidget));
			}
		}
		return eventWidget;
	},

	_removeEventWidget: function (eWidget) {
		eWidget.destroy();
	},

	/**
	 * _addEventToDayLayout is executed whenever an event widget is placed into a view, whether its a new event or an existing
	 * one being dragged.
	 * Need to distinguish between event create and update event, and also need to avoid firing update against write store
	 * when adding events when cal is first rendered. May not be the ideal place to publish the event.
	 */
	_addEventToDayLayout: function (eWidget, layoutEl) {
		// get time of day rounded to minutes
		var startMinutes = this._timeOfDayInMinutes(eWidget.data.startDateTime),
			durationMinutes = Math.round(eWidget.data.duration / 60);
		// convert to % of a day
		dojo.style(eWidget.domNode, 'top', startMinutes / djc.minutesPerDay * 100 + '%');
		// clear this from any prevous drag-and-drop
		dojo.style(eWidget.domNode, 'left', '');
		dojo.style(eWidget.domNode, 'height', durationMinutes / djc.minutesPerDay * 100 + '%');
		layoutEl.appendChild(eWidget.domNode);
	},

	_addEventToAllDayLayout: function (eWidget, layoutEl) {
		layoutEl.appendChild(eWidget.domNode);
		dojo.publish('dojoc.dojocal.' + this.gridId + '.eventAdded', [eWidget, this]);
	},

	_removeAllEventsFromView: function (/* DOMNode */ viewEl, /* String? */ calendarId, /* String? */ eventId) {
		dojo.forEach(this._getAllEventsInNode(viewEl, calendarId, eventId), function (e) {
			e.destroy();
		});
	},

	/* handy day-of-week translators */

	// override these for multi-week views that arent' 7-days wide!

	_dayOfWeekToCol: function (dayOfWeek) {
		return (dayOfWeek - this.weekStartsOn) % 7;
	},

	_colToDayOfWeek: function (colNum) {
		return (colNum + this.weekStartsOn) % 7;
	},

	_nodeToCol: function (node) {
		var layout = this._nodeToLayout(node);
		return parseInt(dojo.attr(layout, 'day'));
	},

	_nodeToDate: function (node) {
		var col = this._nodeToCol(node);
		return dojo.date.add(this._startDate, 'day', col);
	},

	_nodeToLayout: function (node) {
		return djc.getAncestorByAttrName(node, 'day');
	},

	/* common event handlers */

	_onEventChanged: function (eWidget, oldProps) {
		dojo.publish(djc.createDojoCalTopic(this.gridId, 'eventUpdated'), [this, eventWidget, oldProps]);
	},

	_afterEventChange: function () {
		dojo.forEach(this._dayLayouts, function (layout) {
			this._checkEventOverlapping(layout, this.isExpanded);
		}, this);
		this._checkAllDayEventOverlapping(this.footerNode, this._startDate, this.dayCount);
	},

	/***** event overlapping methods *****/

	_checkAllDayEventOverlapping: function (/* Node */ layoutNode, /* Date */ startDate) {
		if (this._eventPositioner) {
			// get event box layout data
			var eWidgets = this._getAllEventsInNode(layoutNode),
				eData = this._eventPositioner.checkOverlappingDayEvents(eWidgets, startDate, this.dayCount);
//console.log(eWidgets)
			// now, loop through ALL boxes and set their nodes' widths, lefts, and rights
			dojo.forEach(eData, function (datum) {
				var newBox = datum.newBox,
					nStyle = datum.widget.domNode.style;
				datum.widget._layoutBox = newBox; // save for transitions
				if (newBox) {
					nStyle.top = newBox.t + 'px';
				}
				else {
					nStyle.top = '';
				}
			});
		}
	},

	_checkEventOverlapping: function (/* Node */ layoutNode) {
//console.log('begin: ', (new Date()).getMilliseconds())
		if (this._eventPositioner) {
			// get event box layout data
			var eWidgets = this._getAllEventsInNode(layoutNode),
				eData = this._eventPositioner.checkOverlappingEvents(eWidgets);
			// now, loop through ALL boxes and set their nodes' widths, lefts, and rights
			// use rights (right style property) for boxes near the right side to assist transition animations
			dojo.forEach(eData, function (datum) {
				var newBox = datum.newBox,
					nStyle = datum.widget.domNode.style;
				datum.widget._layoutBox = newBox; // save for transitions
				if (newBox) {
					if (this.isExpanded) {
						nStyle.width = newBox.spacing + '%';
						// set left or right depending on anchor property
						nStyle.left = newBox.anchor == 'l' ? newBox.l + '%' : 'auto';
						nStyle.right = newBox.anchor == 'r' ? (100 - newBox.r) + '%' : 'auto';
					}
					else {
						nStyle.width = newBox.w + '%';
						// set left or right depending on anchor property
						nStyle.left = newBox.anchor == 'l' ? newBox.l + '%' : 'auto';
						nStyle.right = newBox.anchor == 'r' ? (100 - newBox.r) + '%' : 'auto';
					}
				}
				else {
					// clear the properties for events that are not in groups (i.e. use the class rules)
					nStyle.minWidth = nStyle.width = nStyle.left = nStyle.right = '';
				}
			});
		}
//console.log('end: ', (new Date()).getMilliseconds())
	},

	/***** splitter event handlers and methods *****/
	// TODO: move splitter handling to a SplitterMixin class

	_prepareSplitters: function () {
		var params = {mover: dojoc.dojocal._base.Mover};
		this.splitterNodeMoveable = new dojo.dnd.Moveable(this.splitterNode, params);
		this.splitterNodeMoveable._sizedNode = this.footerWrapperNode;
		this.splitterNodeMoveable._flexNode = this.scrollContainerNode;
		this.splitterNodeMoveable._collapseDetectorNode = this.footerCollapseDetector;
		this.connect(this.splitterNodeMoveable, 'onMoveStart', dojo.hitch(this, '_onSplitterMoveStart', this.splitterNodeMoveable));
		this.connect(this.splitterNodeMoveable, 'onMoveStop', dojo.hitch(this, '_onSplitterMoveStop', this.splitterNodeMoveable));
		this.connect(this.splitterNodeMoveable, 'onMoving', dojo.hitch(this, '_onSplitterMoving', this.splitterNodeMoveable));
	},

	_onSplitterMoveStart: function (splitter, /* dojo.dnd.Mover */ mover) {
		// update the splitter constraints here in case they were changed since the last move
		this.footerCollapseDetector.style.minHeight = this.splitterMinHeight;
		this.footerCollapseDetector.style.maxHeight = this.splitterMaxHeight;
		// record splitter offset for later calcs
		splitter._nodeYOffset = splitter.node.offsetTop;
		// record original values for later calcs while ensuring we have a value in the node's style attribute
		splitter._origFooterNodeHeight = parseInt(dojo.getComputedStyle(splitter._sizedNode).height);
		splitter._sizedNode.style.height = splitter._origFooterNodeHeight + 'px';
		// TODO: let splitter reside on top or bottom
		splitter._origFlexNodeBottom = parseInt(dojo.getComputedStyle(splitter._flexNode).bottom);
		splitter._flexNode.style.bottom = splitter._origFlexNodeBottom + 'px';
	},

	_onSplitterMoveStop: function (splitter, /* dojo.dnd.Mover */ mover) {
		// check if we should collapse the footer
		if (splitter._sizedNode.scrollHeight < splitter._collapseDetectorNode.offsetHeight) {
			// collapse footer
			splitter._sizedNode.style.height = '0';
			splitter._flexNode.style.bottom = -splitter._nodeYOffset + 'px';
		}
		// sync the other splitters
		dojo.publish('dojoc.dojocal.' + this.widgetid + '.setSplitterHeight', [splitter._sizedNode.style.height, splitter._flexNode.style.bottom]);
	},

	_onSplitterMoving: function (splitter, /* dojo.dnd.Mover */ mover, /* Object */ leftTop) {
		// save current values in case we need to revert
		var snHeight = splitter._sizedNode.style.height,
			fnBottom = splitter._flexNode.style.bottom,
			newHeight = splitter._origFooterNodeHeight + splitter._nodeYOffset - leftTop.t,
			newBottom = splitter._origFlexNodeBottom + splitter._nodeYOffset - leftTop.t;
		this._splitterResize(splitter, newHeight + 'px', newBottom + 'px');
		leftTop.l = 0;
		leftTop.t = splitter._nodeYOffset;
		// check if we've sized too large
		if (splitter._collapseDetectorNode.offsetHeight < splitter._sizedNode.clientHeight) {
			this._splitterResize(splitter, snHeight, fnBottom);
		}
		// or too small
		else if (!this.splitterIsCollapsible && splitter._collapseDetectorNode.offsetHeight > splitter._sizedNode.clientHeight) {
			this._splitterResize(splitter, snHeight, fnBottom);
		}
		// check if we should collapse the footer (sized too small)
		if (this.splitterIsCollapsible) {
			if (!splitter._willCollapse && splitter._sizedNode.clientHeight < splitter._collapseDetectorNode.offsetHeight) {
				dojo.addClass(splitter._sizedNode, 'dojocalSplitterWillCollapse');
				splitter._willCollapse = true;
			}
			else if (splitter._willCollapse && splitter._sizedNode.clientHeight >= splitter._collapseDetectorNode.offsetHeight) {
				dojo.removeClass(splitter._sizedNode, 'dojocalSplitterWillCollapse');
				splitter._willCollapse = false;
			}
		}
	},

	_splitterResize: function (splitter, sizedHeight, flexBottom) {
		splitter._sizedNode.style.height = sizedHeight;
		// TODO: let splitter reside on top or bottom
		splitter._flexNode.style.bottom = flexBottom;
	},

	/***** drag and drop handlers and methods ****/

	/***** TODO: move all of this to EventMoveable *****/

	// time a user lingers near a column before snapping the event widget to it
	_dragSnapTimeout: 500,

	// time a user stops dragging before updating the event widget's date and time
	_dragUpdateTimeout: 100,

	// time between checks for auto-scrolling during a drag-and-drop
	_dragAutoScrollTimeout: 50,

	// speed in px per sec per scroll offset for auto-scrolling during a drag-and-drop
	_dragAutoScrollSpeed: 4,

	_onEventDragStart: function (eventWidget, /* dojo.dnd.Mover */ mover) {
//console.log('_onEventDragStart')
		// clear any local styles that were added in the routines to check overlapping TODO: move this to the event positioner
		var es = eventWidget.domNode.style;
		es.left = es.width = es.minWidth = '';
		eventWidget._dndData = this._getDraggedEventStartData(eventWidget);
		// looks nicer unselected, but maybe we should do this some other way?
		eventWidget.setSelected(false);
		// start detecting for auto-scroll
		if (eventWidget._dndData.scrollBox) {
			this._onEventDraggingAutoScrollTimer = setInterval(dojo.hitch(this, this._onCheckAutoScroll, eventWidget, mover), 100);
		}
	},

	_onAllDayEventDragStart: function (eventWidget, /* dojo.dnd.Mover */ mover) {
console.log('_onAllDayEventDragStart')
		// if this is a multi-day event
		if (eventWidget.isMultiDay()) {
			// resize root element to span it's natural length (but not wider than the screen width because that's just silly)
			var layout = this.footerNode,
				esDate = eventWidget.getDateTime(),
				eeDate = eventWidget.getEndDateTime(),
				startDate = this._startDate,
				endDate = this._endDate,
				// TODO: pre-resolve this potentially slow query?
				clones = this._getAllEventsInNode(layout, eventWidget.calendarId, eventWidget.data.uid),
				lastDayBox = djc.getCoordsBox(clones[clones.length - 1]),
				firstDayBox = djc.getCoordsBox(clones[0]),
				draggedBox = djc.getCoordsBox(eventWidget),
				dayWidth = (lastDayBox.w + lastDayBox.l - firstDayBox.l) / clones.length,
				newBox = djc.OffsetBox.getUnion(firstDayBox, lastDayBox);
			// figure out the full width of the widget (but limit it to the size of screen * 2)
			if (esDate < startDate) {
				var offset = Math.min(dojo.date.difference(esDate, startDate, 'day') * dayWidth, screen.width)
				newBox.l -= offset;
				newBox.w += offset;
				// adjust mover, too
				mover.marginBox.l -= offset;
				mover.marginBox.w += offset;
			}
			if (eeDate > endDate)
				newBox.w += Math.min(dojo.date.difference(endDate, eeDate, 'day') * dayWidth, screen.width);
			// set new width and left (left is dereferenced to draggedBox's original box)
			var eNode = eventWidget.domNode;
			eNode.style.left = eNode.offsetLeft + (newBox.l - draggedBox.l) + 'px';
			eNode.style.width = newBox.w + 'px';
			// remove other clones
			clones.forEach(function (clone) {
				if (clone != eventWidget) {
					this._removeEventWidget(clone);
				}
			}, this);
		}
		// clear classes added during overlapping checks TODO: do this in event positioner!
		dojo.forEach(['firstDay', 'lastDay', 'intraDay', 'pseudoDay'], function (className) { dojo.removeClass(eNode, className); });
		eventWidget._dndData = this._getDraggedEventStartData(eventWidget);
		// looks nicer unselected
		eventWidget.setSelected(false);
	},

	_onEventDragStop: function (eventWidget, /* dojo.dnd.Mover */ mover) {
//console.log('_onEventDragStop')
		// cancel setTimeouts asap or IE may still execute them!
		if (this._onEventDraggingSetDateTimeTimer)
			clearTimeout(this._onEventDraggingSetDateTimeTimer);
		// stop detecting for auto-scroll
		if (this._onEventDraggingAutoScrollTimer)
			clearTimeout(this._onEventDraggingAutoScrollTimer)
		// snap to the closest day
		// Note: assumes that a new day is guaranteed to be found (i.e. dnd operation always ends successfully within layout)!
		var newDragData = this._getDraggedEventCurrentData(eventWidget);
		var oldDateTime = eventWidget.getDateTime();
		console.debug("OLD EVENT: " + oldDateTime + " | NEW EVENT: " + newDragData.dateTime);
//		if (oldDateTime == newDragData.dateTime){
//			return; // TODO: Get date comparison working here
//		}
		eventWidget.setDateTime(newDragData.dateTime);
		if (eventWidget.isAllDay()) {
			this._addEventToAllDayLayout(eventWidget, newDragData.col);
			this._checkAllDayEventOverlapping(eventWidget._dndData.col, this._startDate);
		}
		else {
			this._addEventToDayLayout(eventWidget, newDragData.col);
			this._checkEventOverlapping(eventWidget._dndData.col);
			if (eventWidget._dndData.col != newDragData.col)
				this._checkEventOverlapping(newDragData.col);
		}
		this._selectEventWidget(eventWidget);
		delete eventWidget._dndData;
//console.log('dnd data deleted')
		this._onEventChanged(eventWidget, {startDate: oldDateTime});
	},

	_onEventDragging: function (eventWidget, /* dojo.dnd.Mover */ mover, /* Object */ leftTop) {
console.log('_onEventDragging')
//console.log(1, leftTop)
		// TODO: month view
		// restrict movement to calendar day(s)
		leftTop.l = Math.min(Math.max(eventWidget._dndData.boundingBox.l, leftTop.l), eventWidget._dndData.boundingBox.r - eventWidget.domNode.offsetWidth);
		leftTop.t = Math.min(Math.max(eventWidget._dndData.boundingBox.t, leftTop.t), eventWidget._dndData.boundingBox.b - eventWidget.domNode.offsetHeight);
		// figure out nearest day and time
		var isFluid = this.dndMode == djc.DndModes.FLUID,
			newDragData = this._getDraggedEventCurrentData(eventWidget, isFluid ? null : leftTop);
		eventWidget._dndData.currentData = newDragData;
		eventWidget._dndData.leftTop = leftTop; // save for auto-scroll
		// if we're doing fluid dnd
		if (isFluid) {
			// snap to the current weekday column if we've been close to a column for a while
			if (Math.abs(leftTop.l /*+ eventWidget._dndData.parentBox.l*/ - newDragData.colCoords.l) < this.dndFluidSnapThreshold) {
				if (!eventWidget._dndData._snapToColCheckTime || ((new Date()) - eventWidget._dndData._snapToColCheckTime > this._dragSnapTimeout)) {
//					leftTop.l = -(eventWidget._dndData.parentBox.l - newDragData.colCoords.l);
					leftTop.l = newDragData.colCoords.l;
				}
			}
			else {
				eventWidget._dndData._snapToColCheckTime = new Date();
			}
			// snap to the current time row if we've been close to a time for a while
			var nearbyTimePx = Math.round(leftTop.t / newDragData.colCoords.h * 24 * 60 / this.userChangeResolution) * this.userChangeResolution / 60 / 24 * newDragData.colCoords.h;
			if (Math.abs(leftTop.t - nearbyTimePx) < this.userChangeResolution / 2) {
				if (!eventWidget._dndData._snapToRowCheckTime || ((new Date()) - eventWidget._dndData._snapToRowCheckTime > this._dragSnapTimeout)) {
					leftTop.t = nearbyTimePx;
				}
			}
			else {
				eventWidget._dndData._snapToRowCheckTime = new Date();
			}
		}
		// otherwise, we must be doing DISCRETE dnd
		else {
			if (eventWidget.isAllDay()) {
				leftTop.l = -(/*eventWidget._dndData.parentBox.l */- newDragData.colCoords.l);
			}
			else {
				leftTop.l = -(/*eventWidget._dndData.parentBox.l */- newDragData.colCoords.l);
				leftTop.t = (newDragData.dateTime.getMinutes() + newDragData.dateTime.getHours() * 60) / 60 / 24 * newDragData.colCoords.h;
			}
		}
		// reset dragging events
		if (this._onEventDraggingSetDateTimeTimer)
			clearTimeout(this._onEventDraggingSetDateTimeTimer);
		this._onEventDraggingSetDateTimeTimer = setTimeout(dojo.hitch(this, this._onEventDraggingSetDateTime, eventWidget), this._dragUpdateTimeout);
	},

	_onEventDraggingSetDateTime: function (eventWidget) {
		eventWidget.setDateTime(eventWidget._dndData.currentData.dateTime);
	},

	_getDraggedEventStartData: function (eventWidget) {
console.log('_getDraggedEventStartData')
		// TODO: month view
		// TODO: save the original data so that it can be reverted?
		// get bounding box and offsetParent box
		var isAllDay = eventWidget.isAllDay(),
			bNode = isAllDay ? this.footerNode : this.tableNode,
			sNode = isAllDay ? null : this.scrollContainerNode,
			bBox = dojo.coords(bNode, true),
			sBox = sNode && (sNode.scrollHeight > sNode.clientHeight || sNode.scrollWidth > sNode.clientWidth) ? dojo.coords(sNode, true) : null,
			pBox = dojo.coords(eventWidget.domNode.offsetParent, true),
			targets = isAllDay ? this._allDayLayouts : this._dayLayouts;
		// get drop target boxes in reference to offsetParent (since that's how dojo.moveable will report leftTop)
		targets = dojo.map(targets, function (tgt) {
			var tc = dojo.coords(tgt, true);
			return {l: tc.x - pBox.x, t: tc.y - pBox.y, w: tc.w, h: tc.h, node: tgt};
		});
//console.log(this, isAllDay, sNode, sBox, pBox)
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
				// TODO: find a better way to get the col node since this could be broken by a change in the html structure
				col: eventWidget.domNode.offsetParent,
				targetBoxes: targets
			};
//console.dir(data)
		return data;
	},

	_getDraggedEventCurrentData: function (eventWidget, leftTop) {
console.log('_getDraggedEventCurrentData')
		var n = eventWidget.domNode,
			eventCoords = leftTop || {l: n.offsetLeft, t: n.offsetTop},
			bestPick,
			bestPickOverlap = -1;
		eventCoords.w = n.offsetWidth;
		eventCoords.h = n.offsetHeight;
		// find "best pick": the target that overlaps with the event the most
		dojo.forEach(eventWidget._dndData.targetBoxes, function (box) {
			var colCoords = box,
				overlapX = Math.max(Math.min(eventCoords.l + eventCoords.w, colCoords.l + colCoords.w) - Math.max(eventCoords.l, colCoords.l), 0),
				overlapY = Math.max(Math.min(eventCoords.t + eventCoords.h, colCoords.t + colCoords.h) - Math.max(eventCoords.t, colCoords.t), 0),
				overlap = overlapX * overlapY;
			if (overlap > bestPickOverlap) {
				bestPickOverlap = overlap;
				bestPick = {col: box.node, colCoords: colCoords, eventCoords: eventCoords};
			}
		});
		// get the new date and time from the best pick
		var newTime = eventWidget.isAllDay()
				? 0
				: Math.round((eventCoords.t - bestPick.colCoords.t) / bestPick.colCoords.h * 24 * 60 / this.userChangeResolution) * this.userChangeResolution,
			newDate = this._nodeToDate(bestPick.col);
		newDate.setMinutes(newTime, 0, 0);
		bestPick.dateTime = newDate;
		return bestPick;
	},

	_onCheckAutoScroll: function (eventWidget, mover) {
//console.log('_onCheckAutoScroll')
		// check that we've had at least one _onEventDragging occurrence
		if (!eventWidget._dndData.leftTop) return;
		// get amount user dragged event over scroll container (if any)
		var n = eventWidget.domNode,
			lt = eventWidget._dndData.leftTop,
//			pBox = eventWidget._dndData.parentBox,
			sBox = eventWidget._dndData.scrollBox,
			// TODO: fix: this only works if the event's box is smaller than the scroll container's box!
			hDir = Math.min(lt.l - sBox.l, 0) + Math.max(lt.l + n.offsetWidth - sBox.r, 0),
			vDir = Math.min(lt.t - sBox.t, 0) + Math.max(lt.t + n.offsetHeight - sBox.b, 0);
		// if scrolling is needed
		if (hDir || vDir) {
			// TODO: reuse or reduce redundant code
			// TODO: use actual time difference since previous check, not configured _dragAutoScrollTimeout
			// calc new scroll offsets
			var sNode = this.scrollContainerNode,
				hScroll = this._dragAutoScrollSpeed / (1000 / this._dragAutoScrollTimeout) * hDir,
				vScroll = this._dragAutoScrollSpeed / (1000 / this._dragAutoScrollTimeout) * vDir,
				// save these to measure the ACTUAL scroll
				prevScrollLeft = sNode.scrollLeft,
				prevScrollTop = sNode.scrollTop;
			// ensure we scroll at least 1 px
			hScroll = Math[hDir > 0 ? 'ceil' : 'floor'](hScroll);
			vScroll = Math[vDir > 0 ? 'ceil' : 'floor'](vScroll);
			// apply scroll
			sNode.scrollLeft += hScroll;
			sNode.scrollTop += vScroll;
			// find actual scroll
			hScroll = sNode.scrollLeft - prevScrollLeft;
			vScroll = sNode.scrollTop - prevScrollTop;
			// adjust new leftTop
			n.style.left = n.offsetLeft + hScroll + 'px';
			n.style.top = n.offsetTop + vScroll + 'px';
			mover.marginBox.l += hScroll;
			mover.marginBox.t += vScroll;
			sBox.l += hScroll;
			sBox.t += vScroll;
			sBox.r += hScroll;
			sBox.b += vScroll;
			lt.l += hScroll;
			lt.t += vScroll;
		}
	},

	/* event handlers */

	_onHeaderDateClick: function (e) {
		this._selectEventWidget(null);
		var cell = djc.getAncestorByAttrName(e.target, 'day'),
			date = dojo.date.add(this._weekStartDate, 'day', parseInt(dojo.attr(cell, 'day')));
		if (cell && (this.onHeaderClick || this.onHeaderClick(e, date, this) != false)) {
			// TODO: raise a topic instead of the onXXXClick and capture it in the grid? or remove it from the grid?
		}
	},

	_onHeaderDateDblClick: function (e) {
		var cell = djc.getAncestorByAttrName(e.target, 'day'),
			date = dojo.date.add(this._weekStartDate, 'day', parseInt(dojo.attr(cell, 'day')));
		if (cell && (this.onHeaderDblClick || this.onHeaderDblClick(e, date, this) != false)) {
			// TODO: raise a topic instead of the onXXXClick and capture it in the grid? or remove it from the grid?
		}
	},

	_onDayClick: function (layoutNode, e) {
		// TODO: use layoutNode instead of looking it up below?
		var cell = djc.getAncestorByAttrName(e.target, 'day'),
			date = dojo.date.add(this._weekStartDate, 'day', parseInt(dojo.attr(cell, 'day')));
		if (cell && (!this.onDayClick || this.onDayClick(e, date, this) != false)) {
			// TODO: raise a topic instead of the onXXXClick and capture it in the grid? or remove it from the grid?
		}
	}


});

})(); // end of closure for local variables