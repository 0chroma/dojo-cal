/*
 * Author: john
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal.views.DayView');

dojo.require('dojoc.dojocal.views.MultiDayViewBase');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.views.DayView
 */
dojo.declare('dojoc.dojocal.views.DayView', dojoc.dojocal.views.MultiDayViewBase, {

	/* property overrides */

	name: 'DAY',

	headerDatePattern: 'EEEE MMMM dd, yyyy',

	isExpanded: true,

	dayCount: 1,

	/* internal properties */

	_weekdayColNum: 0,

	/* method overrides */

	setDate: function (/* Date */ date) {
		var prevDate = this.date;
		this.inherited(arguments);
		// if the day changed
		if (!prevDate || dojo.date.compare(prevDate, this.date) != 0) {
			this._prevWeekdayColNum = this._weekdayColNum;
			this._weekdayColNum = this.date.getDay() - this.weekStartsOn;
			// reload day view
			this._setHeaderDates();
			this._setCornerHeaderDate();
			this._setTimeColumnDates(); // TODO: does this really belong here?
			this._removeAllEventsFromView(this.domNode);
//			dojo.attr(this._dayLayouts[0], 'day', this.date.getDay());
//			dojo.attr(this.footerColumnLayout, 'day', this.date.getDay());
			dojo.attr(djc.getAncestorByTagName(this._dayLayouts[0], 'TD'), 'day', this.date.getDay().toString());
			dojo.attr(djc.getAncestorByTagName(this._allDayLayouts[0], 'TD'), 'day', this.date.getDay().toString());
			this._checkDayHighlighting();
			this._checkTodayHighlighting();
		}
	},

	_addEvent: function (eWidget) {
		if (eWidget.isAllDay()) {
			// check for event splitting due to multi-day events
			var date = this.date,
				startDate = eWidget.getDateTime(),
				endDate = eWidget.getEndDateTime();
			if (startDate < endDate) {
				// check for first, last, or intra-day
				var isFirstDay = eWidget._isFirstDay = dojo.date.compare(date, startDate, 'date') == 0,
					isLastDay = eWidget._isLastDay = dojo.date.compare(date, endDate, 'date') == 0,
					isIntraDay = !isFirstDay && !isLastDay,
					classes = ['dojocalMultiday'];
				// add appropriate classes
				if (isFirstDay)
					classes.push('firstDay');
				if (isLastDay)
					classes.push('lastDay');
				if (isIntraDay)
					classes.push('intraDay');
				dojo.addClass(eWidget.domNode, classes.join(' '));
			}
			this._addEventToAllDayLayout(eWidget, this._allDayLayouts[0]);
		}
		else
			this._addEventToDayLayout(eWidget, this._dayLayouts[0]);
	},

	_addEventToAllDayLayout: function (eWidget, layoutEl) {
		// skip the dnd stuff since these can't be moved effectively when we're only showing one day
		layoutEl.appendChild(eWidget.domNode);
		dojo.publish('dojoc.dojocal.' + this.gridId + '.eventAdded', [eWidget, this]);
	},

	_checkDayHighlighting: function () {
		if (this._prevWeekdayColNum != this._weekdayColNum) {
			if (this._weekdayColNum != this.date.getDay()) {
				dojo.removeClass(this._dayLayouts[0], 'dojocalDay-selected');
				dojo.removeClass(this._allDayLayouts[0], 'dojocalDay-selected');
			}
			else {
				dojo.addClass(this._dayLayouts[0], 'dojocalDay-selected');
				dojo.addClass(this._allDayLayouts[0], 'dojocalDay-selected');
			}
		}
	},

	_checkTodayHighlighting: function () {
		// TODO: this is still messed up, plus it needs to not manipulate strings (addClass/removeClass) unless they need to be changed!
		var today = djc.dateOnly(new Date()),
			todayOffset = dojo.date.difference(this._startDate, today, 'day');
		if (todayOffset != 0) {
			dojo.removeClass(this._dayLayouts[0], 'dojocalDay-today');
			dojo.removeClass(this._allDayLayouts[0], 'dojocalDay-today');
			// hide minute marker
			this.daysColumnTimeMarker.style.display = 'none';
		}
		else {
			dojo.addClass(this._dayLayouts[0], 'dojocalDay-today');
			dojo.addClass(this._allDayLayouts[0], 'dojocalDay-today');
			// move and show minute marker
			if (this.daysColumnTimeMarker.parentNode != this._dayLayouts[0])
				this._dayLayouts[0].appendChild(this.daysColumnTimeMarker);
			this.daysColumnTimeMarker.style.display = '';
		}
	}

});

})(); // end of closure for local variables