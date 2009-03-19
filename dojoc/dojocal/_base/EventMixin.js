/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Dec 13, 2008
 */
dojo.provide('dojoc.dojocal._base.EventMixin');

dojo.require('dojo.date');
dojo.require('dojo.date.locale');

dojo.declare('dojoc.dojocal._base.EventMixin', null, {
	/**
	 * summary:
	 * Any widget that implements dojoc.dojocal._base.EventMixin may be used as a dojocal event.
	 */

	// data: dojoc.dojocal.UserEvent
	// the UserEvent object associated with this event widget
	data: null,

	// calendarId: String
	// the id of the UserCalendar to which this event belongs
	calendarId: '',

	// color: String
	// the color designated from the associated calendar
	color: '#33ff00',

	// fontColor: String
	// the font color designated from the associated calendar
	fontColor: '#007700',

	// summary: String
	// the text summary for the event widget
	// can be copied from associated UserEvent or calculated in subclasses
	summary: '',

	// text: String
	// the text description shown in the event widget
	// can be copied from associated UserEvent or calculated in subclasses
	text: '',

	// onDataChange: Function
	// connect to this method to capture user changes.
	onDataChange: function () {},

	isAllDay: function () {
		// summary: returns the isAllDay property from the data/UserEvent
		return !!(this.data && this.data.isAllDay);
	},

	isMultiDay: function () {
		// summary: returns true is this event crosses midnight
		return dojoc.dojocal.dateOnly(this.getDateTime()) < dojoc.dojocal.dateOnly(this.getEndDateTime());
	},

	getUid: function () {
		return this.data && this.data.uid;
	},

	getDateTime: function () {
		// summary: returns the startDateTime property from the data/UserEvent
		//   as a Javascript Date object
		return this.data && this.data._startDateTime || null;
	},

	getDuration: function () {
		// summary: returns the duration property from the data/UserEvent
		return this.data && this.data.duration || 0;
	},

	getEndDateTime: function () {
		// summary: a convenience function to return startDateTime + duration
		var endDate = dojo.date.add(this.data._startDateTime, 'second', this.data.duration);
		// all day events have durations in exact days, which makes this return one too many
		if (this.data.isAllDay && endDate > this.data._startDateTime)
			endDate = dojo.date.add(endDate, 'day', -1);
		return endDate;
	},

	setSelected: function (/* Boolean */ selected) {
		// summary:
		// override this method to change the styling or add special behavior when the event is selected
		this.selected = !!selected;
	},

	setEditing: function (/* Boolean */ editing) {
		// summary:
		// override this method to change the styling or add special behavior when the event is being edited
		this.editing = !!editing;
	},

	setColor: function (/* String */ color) {
		// summary:
		// override this method to change the UI for the event widget in response to color changes
		this.color = color;
	},

	setFontColor: function (/* String */ fontColor) {
		// summary:
		// override this method to change the UI for the event widget in response to font color changes
		this.fontColor = fontColor;
	},

	setDateTime: function (/* Date */ dateTime) {
		// summary:
		//   sets only the dateTime of this event's data
		//   override this method to change the UI for the event widget in response to the change
		this.data._startDateTime = dateTime;
		this.data.startDateTime = dojo.date.stamp.toISOString(dateTime);
	},

	setData: function (/* Object */ data) {
		// summary:
		// override this method to change the UI for the event widget in response to data changes
		this.data = data;
	},

	show: function () {
		// summary:
		// shows the event widget.  override to provide specialized behavior
		if (this.domNode)
			dojo.style(this.domNode, 'display', '');
	},

	hide: function () {
		// summary:
		// hides the event widget.  override to provide specialized behavior
		if (this.domNode)
			dojo.style(this.domNode, 'display', 'none');
	}

});
