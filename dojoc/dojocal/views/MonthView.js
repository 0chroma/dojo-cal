/*
 * Author: unscriptable
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal.views.MonthView');

dojo.require('dijit._Templated');
dojo.require('dojoc.dojocal._base.ViewBase');

(function (/* dojoc.dojocal */ djc, /* dojo.date */ datelib) { // closure for local variables

/**
 * dojoc.dojocal.views.MonthView
 * TODO:
 * - this widget shares some with the MultiDayViewBase class.
 */
dojo.declare('dojoc.dojocal.views.MonthView', [djc._base.ViewBase, dijit._Templated], {

	templatePath: dojo.moduleUrl('dojoc.dojocal.views', 'MonthView.html'),

	// overrides

	name: 'MONTH',

	headerDatePattern: 'EEE',

	cornerCellDatePattern: 'yy', // any more digits and it won't fit!

	eventMoveableClass: 'dojoc.dojocal._base.AllDayEventMoveable',

	// showLeaderColumn: Boolean
	// set to true to show the leading column. this column can be used for several purposes, including
	// displaying an icon per week to allow the user to switch to that week in week view
	showLeaderColumn: false,

	// monthCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the date header on each month cell
	monthCellDatePattern: 'd',

	// monthFirstCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the date header on the first
	// month cell that fals within a month (the month view spans slightly more than 1 month)
	monthFirstCellDatePattern: 'MMM d',

	// overrides

	setDate: function (/* Date|String? */ date) {
		// save this to detect change later
		var prevStart = this._startDate;

		this.inherited(arguments);

		// calc month start and end dates (end = next month's start - 1)
		this._weekStartDate = djc.getWeekStartDate(date, this.weekStartsOn);
		this._startDate = djc.getMonthStartDate(date, this.weekStartsOn);
		this._endDate = djc.getMonthEndDate(date, this.weekStartsOn);
//console.log(this._endDate, this.declaredClass);
		// if month changed
		// Note: don't change the month view if we're currently viewing it and the new date is still
		// visible but in a different month (this._startDate should not change in this case)
		if (!prevStart || datelib.compare(prevStart, this._startDate) != 0) {
			this._setMonthHeaderDates();
			this._setMonthCellHeaderDates();
			this._setCornerHeaderDate();
			this._checkDayHighlighting();
			this._checkTodayHighlighting();
		}
	},

	setShowLeaderColumn: function (show) {
		this.showLeaderColumn = show;
		this._showLeaderColumn(show);
	},

	postCreate: function () {
		this.inherited(arguments);
		// create programmatic dom elements
		this._createMonthRows();
		this._showLeaderColumn(this.showLeaderColumn);
		// grab the collection of day layouts
		this._dayLayouts = dojo.query('.dojocalDayColumnLayout', this.monthTableNode)
	},

	destroy: function () {
		this.inherited(arguments);
	},

	_addEvent: function (eWidget) {
		// TODO: share this whole method with WeekView and other multi-day views
		function showTitle (widget, size) {
			// expand title to span all pseudo-widgets. we use the last widget since it's topmost in the z-order
			// (we'd have to change the z-index of the TDs to fix this)
//			dojo.style(widget.domNode, {
//				overflow: 'visible', // allows text to spread across cloned events
//				zIndex: '10' // overrides hovered/selected classes of other events which would otherwise cover title text
//			});
			dojo.addClass(widget.domNode, 'titleDay');
			dojo.style(widget.titleNode, {
//				visibility: 'visible',
				overflow: 'hidden', // this is important to keep the text from oveflowing since we're letting the domNode overflow
				width: size * 100 + '%'//, // span all sister-widgets in this row
//				left: -(size - 1) * 100 + '%', // position at first sister-widget
//				marginLeft: -(size - 1) +'px' // fine-tuning due to table cell borders / event padding. TODO: get the padding from computed style
			});
		}
		if (eWidget.isAllDay()) {
			// check for event splitting due to multi-day events
			var startDate = eWidget.getDateTime(),
				endDate = eWidget.getEndDateTime();
			if (startDate < endDate) {
				// loop through entire week and add pseudo widgets if needed
				var dtFirst = djc.maxDate(startDate, this._startDate),
					dtLast = djc.minDate(endDate, datelib.add(dtFirst, 'day', 6)),
					date = dtFirst,
					pos = this._dateToCellPos(dtFirst),
					visCount = 0, // count of visible widgets for this event
					currWidget = eWidget,
					root, // the first widget (set below)
					firstOfWeek; // the widgets that fall on the first day of each week
				do {
					// create the root widget if we haven't already
					if (!root) {
						root = currWidget;
						var node = eWidget.domNode,
							baseClasses = node.className;
						firstOfWeek = root;
					}
					else {
						currWidget = this._cloneEventWidget(eWidget);
						currWidget.startup();
						node = currWidget.domNode;
						visCount++;
					}
					// if we are at the start of the week, show the title
					if (pos % 7 == 0) {
						// fix-up previous firstOfWeek
						if (firstOfWeek)
							showTitle(firstOfWeek, visCount);
						// set new one
						firstOfWeek = currWidget;
						visCount = 1;
					}
					this._addEventToLayout(currWidget, this._dayLayouts[pos]);
					// check for first, last, or intra-day
					var isFirstDay = datelib.compare(date, startDate, 'date') == 0,
						isLastDay = datelib.compare(date, endDate, 'date') == 0,
						isIntraDay = !isFirstDay && !isLastDay,
						classes = [baseClasses, 'dojocalAllDay dojocalMultiday'];
					// add appropriate classes
					if (isFirstDay)
						classes.push('firstDay');
					if (isLastDay)
						classes.push('lastDay');
					if (isIntraDay)
						classes.push('middleDay');
					if (currWidget != root)
						classes.push('pseudoDay');
					dojo.addClass(node, classes.join(' '));
					pos++;
					date = datelib.add(date, 'day', 1);
				}
				while (date <= dtLast);
				if (firstOfWeek)
					showTitle(firstOfWeek, visCount);
			}
			// otherwise, single-day event
			else {
				pos = this._dateToCellPos(startDate);
				dojo.addClass(currWidget.domNode, 'dojocalAllDay');
				this._addEventToLayout(eWidget, this._dayLayouts[pos]);
			}
		}
		else {
			// TODO: check for event splitting due to crossing of midnight
			pos = this._dateToCellPos(djc.dateOnly(eWidget.getDateTime()));
			this._addEventToLayout(eWidget, this._dayLayouts[pos]);
		}
	},

	_addEventToLayout: function (eWidget, layoutEl) {
		layoutEl.appendChild(eWidget.domNode);
		// clear this from any prevous drag-and-drop. TODO: move this to the appropriate place
		dojo.style(eWidget.domNode, 'left', '');
		dojo.publish('dojoc.dojocal.' + this.gridId + '.eventAdded', [eWidget, this]);
	},

	_checkEventOverlapping: function () {
		if (this._eventPositioner) {
			// get event box layout data
			// check the whole grid since multi-day events could span several days/weeks
			var eWidgets = this._getAllEventsInNode(this.monthBodyNode),
				eData = this._eventPositioner.checkOverlappingDayEvents(eWidgets, this._startDate, 6 * 7);
//console.log(eWidgets)
			// now, loop through ALL boxes and set their nodes' widths, lefts, and rights
			dojo.forEach(eData, function (datum) {
				var newBox = datum.newBox,
					nStyle = datum.widget.domNode.style,
					// TODO: pre-resolve these!  big perf hit!
					hdr = dojo.query('.dojocalDayCellHeader', datum.widget.parentNode)[0];
				datum.widget._layoutBox = newBox; // save for transitions
				if (newBox) {
					nStyle.top = newBox.t + hdr.offsetHeight + 'px';
				}
				else {
					nStyle.top = '';
				}
			});
		}
	},

	_afterEventChange: function () {
		// this must be run after adding or removing one or more events
		this._checkEventOverlapping();
	},

	_dateToCellPos: function (date) {
		return datelib.difference(this._startDate, date, 'day');
	},

	_cellPosToDate: function (pos) {
		return datelib.add(this._startDate, 'day', pos);
	},

	_nodeToLayout: function (node) {
		return djc.getAncestorByClassName(node, 'dojocalLayout');
	},

	_cellToDate: function (cell) {
		// make sure we've got the right node
		cell = djc.getAncestorByAttrName(cell, 'day');
		return this._cellPosToDate(Number(cell.getAttribute('day')));
	},

	_setMonthHeaderDates: function () {
		var date = new Date(this._weekStartDate);
		dojo.query('.dojocalDateCellText', this.monthHeaderTable).forEach(function (node) {
			node.innerHTML = datelib.locale.format(date, {selector: 'date', datePattern: this.headerDatePattern});
			// 0 = Sunday. don't store date object on node because IE will leak memory
			dojo.attr(djc.getAncestorByTagName(node, 'TD'), 'day', date.getDay().toString());
			date = datelib.add(date, 'day', 1);
		}, this);
	},

	_setCornerHeaderDate: function () {
		if (this.cornerCellDatePattern != null) {
			var dateString = datelib.locale.format(this.getStartDate(), {selector: 'date', datePattern: this.cornerCellDatePattern});
			dojo.query('.dojocalDateLeader .dojocalDateCellText', this.domNode).forEach(function (node) {
				node.innerHTML = dateString;
			}, this);
		}
	},

	_createMonthRows: function () {
		var rowTemplate = this.monthRowTemplate,
			tbody = dojo.query('TBODY', this.monthTableNode)[0]
		dojo.forEach(new Array(6), function (dummy, i) {
			tbody.appendChild(rowTemplate.cloneNode(true));
		});
		// we're done with it
		rowTemplate.parentNode.removeChild(rowTemplate);
		this._cellLayouts = dojo.query('.dojocalDayColumnLayout', this.monthTableNode);
	},

	_setMonthCellHeaderDates: function () {
		// this method also determines if a row should be visible or not and styles cells
		// that are not in the current month
		var date = this._startDate,
			currMonth = this.date.getMonth(),
			currYear = this.date.getFullYear(),
			rowsUsed = 0;
		dojo.query('.dojocalDayCellHeader', this.monthTableNode).forEach(function (node, pos) {
			var datePattern = pos == 0 || date.getDate() == 1 ? this.monthFirstCellDatePattern : this.monthCellDatePattern;
			node.innerHTML = datelib.locale.format(date, {selector: 'date', datePattern: datePattern});
			// 0 = Sunday. don't store date object on node because IE will leak memory
			var td = djc.getAncestorByTagName(node, 'TD');
			if (date.getMonth() <= currMonth && date.getFullYear() <= currYear)
				rowsUsed = Math.max(rowsUsed, td.parentNode.rowIndex);
			dojo[date.getMonth() != currMonth ? 'addClass' : 'removeClass'](td, 'dojocalDayCellOutOfMonth');			dojo.attr(td, 'day', pos);
			date = datelib.add(date, 'day', 1);
		}, this);
		dojo.query('.dojocalMonthRow', this.monthTableNode).forEach(function (row) {
			dojo.style(row, 'display', (row.rowIndex > rowsUsed) ? 'none' : '');
		});
		// IE needs some additional help or it won't size te contents of the cells correctly (even though the cells are sized correctly)
		if (dojo.isIE) {
			dojo.query('TD.dojocalDayCell', this.monthTableNode).style('height', 1 / (rowsUsed + 1) * 100 + '%');
		}
	},

	_checkDayHighlighting: function () {
//		if (this._prevWeekdayColNum != this._weekdayColNum) {
//			if (this._prevWeekdayColNum != undefined) {
//				dojo.removeClass(this._dayLayouts[this._prevWeekdayColNum], 'dojocalDay-selected');
//				dojo.removeClass(this._allDayLayouts[this._prevWeekdayColNum], 'dojocalDay-selected');
//			}
//			dojo.addClass(this._dayLayouts[this._weekdayColNum], 'dojocalDay-selected');
//			dojo.addClass(this._allDayLayouts[this._weekdayColNum], 'dojocalDay-selected');
//		}
	},

	_checkTodayHighlighting: function () {
//		// TODO: this needs to not manipulate strings (addClass/removeClass) unless they need to be changed!
		var today = djc.dateOnly(new Date()),
			cell = this._cellLayouts[this._dateToCellPos(today)];
		if (this._todayLayout && cell != this._todayLayout) {
			dojo.removeClass(this._todayLayout, 'dojocalDay-today');
		}
		this._todayLayout = cell;
		if (cell) {
			dojo.addClass(this._todayLayout, 'dojocalDay-today');
		}
	},

	_showLeaderColumn: function (show) {
		if (show)
			dojo.removeClass(this.domNode, 'noLeaderColumn');
		else
			dojo.addClass(this.domNode, 'noLeaderColumn');
	},

	_getDragBounds: function (eventWidget) {
		return dojo.mixin(this.inherited(arguments), {
			boundingNode: this.monthTableNode,
			scrollingNode: this.monthContainerNode,
			targetNodes: this._dayLayouts
		});
	},

	/* internal event handlers */

	_onEventDragStart: function (eventWidget, /* dojo.dnd.Mover */ mover) {
		// clear any local styles that were added in the routines to check overlapping TODO: move this to the event positioner
		var es = eventWidget.domNode.style;
		es.left = es.width = es.minWidth = '';
		// looks nicer unselected, but maybe we should do this some other way?
		eventWidget.setSelected(false);
	},

	_onEventDragging: function (eventWidget, /* dojo.dnd.Mover */ mover) {
	},

	_onEventDragStop: function (eventWidget, /* dojo.dnd.Mover */ mover) {
		// construct the event's new date-time
		var newCol = mover.host.destinationNode;
		var oldDate = eventWidget.getDateTime(),
			oldDay = djc.dateOnly(oldDate),
			newDay = this._cellToDate(newCol),
			newDate = datelib.add(oldDate, 'day', datelib.difference(oldDay, newDay, 'day'));
		eventWidget.setDateTime(newDate);
		// remove position set by drag-and-drop
		dojo.style(eventWidget.domNode, {top: '', left: ''});
		// move widget
		this._addEventToLayout(eventWidget, newCol);
		// update view
		this._checkEventOverlapping()
		this._selectEventWidget(eventWidget);
		//TODO: this._onEventChanged(eventWidget, {startDate: oldDate});
	},

	_onHeaderDateClick: function () {
		// TODO
	},

	_onHeaderDateDblClick: function () {
		// TODO
	}



});

})(dojoc.dojocal, dojo.date); // end of closure for local variables