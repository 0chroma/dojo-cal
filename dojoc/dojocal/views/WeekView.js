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
				var weekFirst = this._startDate,
					weekLast = dojo.date.add(weekFirst, 'day', 6),
					date = weekFirst,
					pos = 0,
					visCount = 0, // count of visible widgets for this event
					currWidget = eWidget,
					root; // the first widget (set below)
				do {
					// check if this is a valid day for this event widget
					if (date >= startDate && date <= endDate) {
						if (!root) {
							root = currWidget;
							var node = eWidget.domNode,
								baseClasses = node.className;
						}
						else {
							currWidget = this._cloneEventWidget(eWidget);
							node = currWidget.domNode;
							visCount++;
						}
						this._addEventToAllDayLayout(currWidget, this._allDayLayouts[pos]);
						// check for first, last, or intra-day
						var isFirstDay = dojo.date.compare(date, startDate, 'date') == 0,
							isLastDay = dojo.date.compare(date, endDate, 'date') == 0,
							isIntraDay = !isFirstDay && !isLastDay,
							classes = [baseClasses, 'dojocalMultiday'];
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
					}
					pos++;
					date = dojo.date.add(date, 'day', 1);
				}
				while (date <= weekLast);
				// expand title to span all pseudo-widgets
				dojo.style(root.titleNode, 'width', (visCount + 1) * 100 + '%');
			}
			// otherwise, single-day event
			else {
				pos = this._dayOfWeekToCol(startDate.getDay());
				this._addEventToAllDayLayout(eWidget, this._allDayLayouts[pos]);
			}
		}
		else {
			// TODO: check for event splitting due to crossing of midnight
			var dayNum = this._dayOfWeekToCol(eWidget.data._startDateTime.getDay());
			this._addEventToDayLayout(eWidget, this._dayLayouts[dayNum]);
		}
	}


});

})(); // end of closure for local variables