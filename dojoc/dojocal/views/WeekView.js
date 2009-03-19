/*
 * Author: john
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal.views.WeekView');

dojo.require('dojoc.dojocal.views.MultiDayViewBase');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.views.WeekView
 */
dojo.declare('dojoc.dojocal.views.WeekView', dojoc.dojocal.views.MultiDayViewBase, {

	// overrides

	name: 'WEEK',

	headerDatePattern: 'EEE M/dd',

	dayCount: 7,

	// internal properties

	_startDate: null,

	// overrides

	setDate: function (/* Date|String? */ date) {
		var prevWeekStartDate = this._startDate;
		this.inherited(arguments);
		// calc week start date
		this._startDate = djc.getWeekStartDate(date, this.weekStartsOn);
		this._endDate = dojo.date.add(this._startDate, 'day', 6);
		// if the week changed
		if (!prevWeekStartDate || dojo.date.compare(prevWeekStartDate, this._startDate) != 0) {
			this._setHeaderDates();
			this._setCornerHeaderDate();
			this._setTimeColumnDates(); // TODO: does this really belong here (for DST)?
			this._checkDayHighlighting();
			this._checkTodayHighlighting();
		}
	},

	_addEvent: function (eWidget) {
		if (eWidget.isAllDay()) {
			// check for event splitting due to multi-day events
			var startDate = eWidget.getDateTime(),
				endDate = eWidget.getEndDateTime();
			if (startDate < endDate) {
				// loop through entire week and add pseudo widgets if needed
				var weekFirst = djc.maxDate(startDate, this._startDate),
					weekLast = djc.minDate(endDate, this._endDate),
					date = weekFirst,
					pos = this._dayOfWeekToCol(weekFirst.getDay()),
					visCount = 0, // count of visible widgets for this event
					currWidget = eWidget,
					root; // the first widget (set below)
				do {
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
					}
					this._addEventToAllDayLayout(currWidget, this._allDayLayouts[pos]);
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
				while (date <= weekLast);
				// expand title to span all pseudo-widgets
				// we use the last widget since it's topmost in the z-order (we'd have to change the
				// z-index of the TDs to fix this)
				dojo.style(currWidget.titleNode, 'width', (visCount + 1) * 100 + '%');
				dojo.style(currWidget.titleNode, 'left', -(visCount) * 100 + '%');
				dojo.style(currWidget.titleNode, 'visibility', 'visible');
			}
			// otherwise, single-day event
			else {
				pos = this._dayOfWeekToCol(startDate.getDay());
				dojo.addClass(currWidget.domNode, 'dojocalAllDay');
				this._addEventToAllDayLayout(eWidget, this._allDayLayouts[pos]);
			}
		}
		else {
			// TODO: check for event splitting due to crossing of midnight
			pos = this._dayOfWeekToCol(eWidget.getDateTime().getDay());
			this._addEventToDayLayout(eWidget, this._dayLayouts[pos]);
		}
	}


});

})(); // end of closure for local variables