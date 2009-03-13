/*
 * Author: john
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal.views.MonthView');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dojoc.dojocal._base.ViewMixin');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.views.MonthView
 * TODO:
 * - this widget shares a lot with the MultiDayViewBase class.  create another base class or mixin?
 */
dojo.declare('dojoc.dojocal.views.MonthView', [dijit._Widget, dijit._Templated, dojoc.dojocal._base.ViewMixin], {

	templatePath: dojo.moduleUrl('dojoc.dojocal.views', 'MonthView.html'),

	// overrides

	name: 'MONTH',

	headerDatePattern: 'EEE',

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
		var prevStart = this._monthStartDate;

		this.inherited(arguments);

		// calc month start and end dates (end = next month's start - 1)
		this._weekStartDate = djc.getWeekStartDate(date, this.weekStartsOn);
		this._monthStartDate = djc.getMonthStartDate(date, this.weekStartsOn);
		this._monthEndDate = dojo.date.add(djc.getMonthStartDate(dojo.date.add(date, 'month', 1), this.weekStartsOn), 'day', -1);

		// if month changed
		// Note: don't change the month view if we're currently viewing it and the new date is still
		// visible but in a different month (this._monthStartDate should not change in this case)
		if (!prevStart || dojo.date.compare(prevStart, this._monthStartDate) != 0) {
			this._setMonthHeaderDates();
			this._setMonthCellHeaderDates();
			this._setCornerHeaderDate();
//			this._removeAllEventsFromView(this.monthTableNode);
//			this._loadEventsIntoView(xxxxxxxx);
			this._checkDayHighlighting();
			this._checkTodayHighlighting();
		}
	},

	getStartDate: function () {
		return this._monthStartDate;
	},

	getEndDate: function () {
		return this._monthEndDate;
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
	},

	destroy: function () {
		this.inherited(arguments);
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

	_setTimeColumnDates: function () {
		// nothing to do
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
		var date = this._monthStartDate,
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

	_onDayLayoutClick: function (e) {

	},

	_onHeaderDateClick: function () {
		// TODO
	},

	_onHeaderDateDblClick: function () {
		// TODO
	}



});

})(); // end of closure for local variables