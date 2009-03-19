/*
 * Author: john
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal.views.MonthView');

dojo.require('dijit._Templated');
dojo.require('dojoc.dojocal._base.ViewBase');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.views.MonthView
 * TODO:
 * - this widget shares some with the MultiDayViewBase class.
 */
dojo.declare('dojoc.dojocal.views.MonthView', [dojoc.dojocal._base.ViewBase, dijit._Templated], {

	templatePath: dojo.moduleUrl('dojoc.dojocal.views', 'MonthView.html'),

	// overrides

	name: 'MONTH',

	headerDatePattern: 'EEE',

	cornerCellDatePattern: 'yy', // any more and it won't fit

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
		this._endDate = dojo.date.add(djc.getMonthStartDate(dojo.date.add(date, 'month', 1), this.weekStartsOn), 'day', -1);

		// if month changed
		// Note: don't change the month view if we're currently viewing it and the new date is still
		// visible but in a different month (this._startDate should not change in this case)
		if (!prevStart || dojo.date.compare(prevStart, this._startDate) != 0) {
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
			// expand title to span all pseudo-widgets
			// we use the last widget since it's topmost in the z-order (we'd have to change the
			// z-index of the TDs to fix this)
			dojo.style(widget.domNode, {
				overflow: 'visible', // allows text to spread across cloned events
				zIndex: '10 !important' // overrides hovered/selected of other events which covers title text
			});
			dojo.style(widget.titleNode, {
				visibility: 'visible',
				width: size * 100 + '%', // span all sister-widgets in this row
				left: -(size - 1) * 100 + '%', // position at first sister-widget
				marginLeft: -(size - 2) +'px' // fine-tuning due to table cell borders / event padding. TODO: get the padding from computed style
			});
		}
		if (eWidget.isAllDay()) {
			// check for event splitting due to multi-day events
			var startDate = eWidget.getDateTime(),
				endDate = eWidget.getEndDateTime();
			if (startDate < endDate) {
				// loop through entire week and add pseudo widgets if needed
				var dtFirst = djc.maxDate(startDate, this._startDate),
					dtLast = djc.minDate(endDate, dojo.date.add(dtFirst, 'day', 6)),
					date = dtFirst,
					pos = this._dateToCellPos(dtFirst),
					visCount = 1, // count of visible widgets for this event
					currWidget = eWidget,
					root; // the first widget (set below)
				do {
					// create the root widget if we haven't already
					if (!root) {
						root = currWidget;
						var node = eWidget.domNode,
							baseClasses = node.className;
					}
					else {
						currWidget = this._cloneEventWidget(eWidget);
						currWidget.startup();
						node = currWidget.domNode;
						visCount++;
//console.log('pos = ', pos);
					}
					// if we hit the end of the week, show the title for the widgets in this week
					if ((pos + 1) % 7 == 0) {
						showTitle(currWidget, visCount);
						visCount = 0;
					}
					this._addEventToLayout(currWidget, this._dayLayouts[pos]);
					// check for first, last, or intra-day
					var isFirstDay = dojo.date.compare(date, startDate, 'date') == 0,
						isLastDay = dojo.date.compare(date, endDate, 'date') == 0,
						isIntraDay = !isFirstDay && !isLastDay,
						classes = [baseClasses, 'dojocalAllDay dojocalMultiday'];
					// add appropriate classes
					if (isFirstDay)
						classes.push('firstDay');
					if (isLastDay)
						classes.push('lastDay');
					if (isIntraDay)
						classes.push('intraDay');
					if (currWidget != root)
						classes.push('pseudoDay');
					node.className = classes.join(' ');
					pos++;
					date = dojo.date.add(date, 'day', 1);
				}
				while (date <= dtLast);
				showTitle(currWidget, visCount);
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
		dojo.publish('dojoc.dojocal.' + this.gridId + '.eventAdded', [eWidget, this]);
	},

	_checkEventOverlapping: function (/* Node */ layoutNode, /* Date */ date) {
		if (this._eventPositioner) {
			// get event box layout data
			var eWidgets = this._getAllEventsInNode(layoutNode),
				eData = this._eventPositioner.checkOverlappingDayEvents(eWidgets, date, 6 * 7);
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

	_postEventChange: function () {
		// this must be run after adding or removing one or more events
		this._checkEventOverlapping(this.monthBodyNode, this._startDate);
	},

	_dateToCellPos: function (date) {
		return dojo.date.difference(this._startDate, date, 'day');
	},

	_cellPosToDate: function (pos) {
		return dojo.date.add(this._startDate, pos, 'day');
	},

	_setMonthHeaderDates: function () {
		var date = new Date(this._weekStartDate);
		dojo.query('.dojocalDateCellText', this.monthHeaderTable).forEach(function (node) {
			node.innerHTML = dojo.date.locale.format(date, {selector: 'date', datePattern: this.headerDatePattern});
			// 0 = Sunday. don't store date object on node because IE will leak memory
			dojo.attr(djc.getAncestorByTagName(node, 'TD'), 'day', date.getDay().toString());
			date = dojo.date.add(date, 'day', 1);
		}, this);
	},

	_setCornerHeaderDate: function () {
		if (this.cornerCellDatePattern != null) {
			var dateString = dojo.date.locale.format(this.getStartDate(), {selector: 'date', datePattern: this.cornerCellDatePattern});
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
			node.innerHTML = dojo.date.locale.format(date, {selector: 'date', datePattern: datePattern});
			// 0 = Sunday. don't store date object on node because IE will leak memory
			var td = djc.getAncestorByTagName(node, 'TD');
			if (date.getMonth() <= currMonth && date.getFullYear() <= currYear)
				rowsUsed = Math.max(rowsUsed, td.parentNode.rowIndex);
			dojo[date.getMonth() != currMonth ? 'addClass' : 'removeClass'](td, 'dojocalDayCellOutOfMonth');
			// TODO: is this next line useful?
			dojo.attr(td, 'day', date.getDay().toString());
			date = dojo.date.add(date, 'day', 1);
		}, this);
		dojo.query('.dojocalMonthRow', this.monthTableNode).forEach(function (row) {
			dojo.style(row, 'display', (row.rowIndex > rowsUsed) ? 'none' : '');
		});
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
//		var today = djc.dateOnly(new Date()),
//			todayOffset = dojo.date.difference(this._startDate, today, 'day'),
//			col = this._dayOfWeekToCol(today.getDay());
//		if (col != this._todayWeekdayColNum && this._todayWeekdayColNum != undefined) {
//			dojo.removeClass(this._dayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
//			dojo.removeClass(this._allDayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
//			// hide minute marker
//			this.daysColumnTimeMarker.style.display = 'none';
//		}
//		if (todayOffset >= 0 && todayOffset < this.dayCount) {
//			this._todayWeekdayColNum = col;
//			dojo.addClass(this._dayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
//			dojo.addClass(this._allDayLayouts[this._todayWeekdayColNum], 'dojocalDay-today');
//			// move and show minute marker
//			if (this.daysColumnTimeMarker.parentNode != this._dayLayouts[this._todayWeekdayColNum])
//				this._dayLayouts[this._todayWeekdayColNum].appendChild(this.daysColumnTimeMarker);
//			this.daysColumnTimeMarker.style.display = '';
//		}
	},

	_showLeaderColumn: function (show) {
		if (show)
			dojo.removeClass(this.domNode, 'noLeaderColumn');
		else
			dojo.addClass(this.domNode, 'noLeaderColumn');
	},

	/* internal event handlers */

	_onHeaderDateClick: function () {
		// TODO
	},

	_onHeaderDateDblClick: function () {
		// TODO
	}



});

})(); // end of closure for local variables