/*
 * Author: john
 * Date: Feb 22, 2009
 */
dojo.provide('dojoc.dojocal._base.ViewMixin');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dojo.date');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal._base.ViewMixin
 */
dojo.declare('dojoc.dojocal._base.ViewMixin', dijit._Contained, {

	// name: String
	// the unique name for this view
	name: '',

	// selected: Boolean
	// set to true to make this the visible view, initially
	selected: false,

	// timeCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the time column on day and week views
	timeCellDatePattern: 'h:mm a',

	// headerDatePattern: String
	// the dojo.date.locale-formatted date string used in the date header, if aplicable
	headerDatePattern: 'EEE M/dd',

	// cornerCellDatePattern: String
	// the dojo.date.locale-formatted date string used in the upper left corner, if applicable
	cornerCellDatePattern: 'yyyy',

	// allDayEventAreaLabel: String
	// the label to show in the "All Day" events area time column, if applicable
	allDayEventAreaLabel: 'All Day',

	// eventClass: String
	// change this property on subclassed views to use your own custom event widgets
	eventClass: 'dojoc.dojocal.Event',

	// eventPositionerClass: String
	// change this property to create your own event positioner
	// see dojoc.dojocal._base.EventPositioner for more info
	eventPositionerClass: '',

	// minutesPerGridLine: Integer
	// number of minutes between horizontal grid lines
	minutesPerGridLine: 15,

	// userChangeResolution: Integer
	// resolution of user changes (e.g. drag and drop) in minutes
	// changes smaller than this are rounded up or down
	userChangeResolution: 15,

	// initialStartTime: Integer
	// number of minutes to scroll from midnight when displaying calendar.  use 450 for 7:30 AM, 780 for 1:00 PM
	initialStartTime: 480,

	// animationDuration: Number
	// the duration of any animations used by the grid
	animationDuration: 250,

	// date: String
	// set this to the dojocal's initial date (ISO-formatted date string)
	date: '',

	// weekStartsOn: Integer
	// the day that weeks should start on
	// 0 = sunday, 1 = monday, etc.
	// Hint: use dojo.cldr.supplemental.getFirstDayOfWeek() to let this adjust automatically
	// to the user's browser locale
	weekStartsOn: 0,

	// showWeekends: String|Array
	// set false to hide weekends
	// Hint: use dojo.cldr.supplemental.getWeekend to determine weekend days for the
	// user's browser locale
	// Warning: setting showWeekends to false and setting weekStartson to something midweek will
	// cause multi-day events to display improperly (despite being fully functional)
	// TODO: create a new view rather than use this property?
	showWeekends: true,

	// defaultEventClass: String
	// a fully-qualified dijit class to be used to create new event widgets
	// TODO: use this when auto-creating events from data store? or remove this?
	defaultEventClass: 'dojoc.dojocal.Event',

	// dndMode: dojoc.dojocal.DndModes
	// level of drag and drop:
	//   dojoc.dojocal.DndModes.NONE -- drag and drop is not enabled
	//   dojoc.dojocal.DndModes.FLUID -- drag and drop uses a free-form method to allow smoother dragging
	//   dojoc.dojocal.DndModes.DISCRETE -- drag and drop snaps to valid positions only
	dndMode: djc.DndModes.DISCRETE,

	// dndDetectDistance: Number
	// the distance a user must drag before a drag and drop operation is detected
	dndDetectDistance: 3,

	// dndFluidSnapThreshold: Integer
	// pixels to move before an event widget stops clinging to current day or time (for fluid dnd)
	dndFluidSnapThreshold: 25,

	// splitterMinHeight: String
	// the splitters may not be sized any smaller than this height (unless splitterIsCollapsible == true).
	// use any css measurement (except %). e.g. 2.5em, 40px, 24pt, etc.
	splitterMinHeight: '2em',

	// splitterMaxHeight: String
	// the splitters may be opened to this height.
	// use any css measurement (except %). e.g. 2.5em, 40px, 24pt, etc.
	splitterMaxHeight: '10em',

	// splitterIsCollapsible:  Boolean
	// the splitters will collapse if the user drags them below splitterMinHeight
	splitterIsCollapsible: true,

	// cascadeAttrMap: Array of String
	// these attribute/property names will be copied from the grid to this view
	cascadeAttrMap: {date: '', minutesPerGridLine: '', userChangeResolution: '', initialStartTime: '', animationDuration: '', weekStartsOn: '', showWeekends: '', defaultEventClass: '', dndMode: '', dndDetectDistance: '', dndFluidSnapThreshold: '', splitterMinHeight: '', splitterMaxHeight: '', splitterIsCollapsible: ''},

	constructor: function () {
		this.attributeMap = dojo.mixin(this.attributeMap, this.cascadeAttrMap);
	},

	setDate: function (/* Date|String? */ date) {
		// summary: sets the current datetime. use dojoc.dojocal.dateOnly, if applicable.
		this.date = this._startDate = this._endDate = djc.dateOnly(date);
	},

	getStartDate: function () {
		// summary: returns the earliest date at which events show
		return this._startDate;
	},

	getEndDate: function () {
		// summary: returns the latest date at which events show
		return this._endDate;
	},

	setStartOfDay: function (/* Number */ minuteOfDay) {
		// summary: scroll the view to the minute of the day given, if applicable.
		// minuteOfDay: Number
		//   the minute of the day. e.g. 450 (min) == 7.5 (hr) * 60 == 7:30 am
		// TODO: allow user to pass "auto" to try to scroll as many imminent events into view???
		dojo.publish('dojoc.dojocal.' + this.widgetid + '.setStartOfDay', [minuteOfDay]);
	},

	getStartOfDay: function (/* Boolean? */ exact) {
		// summary: returns the minute of the day to which the day and week views are currently scrolled
		//   (see setStartOfDay)
		// exact: set to true to return as precise a result as possible, omit or set to false to return the value
		//   rounded to the nearest minute
		return null; // unsupported
	},

	isEventViewable: function (/* UserEvent */ event) {
		// summary: returns true if the given event falls within this view (even if just partially)
	},

	addEvent: function (/* dojoc.dojocal._base.EventMixin */ event) {
		// summary: adds the specified event into this view
	},

	addEvents: function (/* Array of dojoc.dojocal._base.EventMixin */ events) {
		// summary: adds the specified events into this view
	},

	removeEvent: function (/* dojoc.dojocal._base.EventMixin */ event) {
		// summary: adds the specified event into this view
	},

	clearEvents: function () {
		// summary: removes all events in the view
	},

//	beginUpdate: function () {
//		this._updateCount++;
//	},
//
//	endUpdate: function () {
//		this._updateCount--;
//	},
//
//	isUpdating: function () {
//		return this._updateCount > 0;
//	},

	updateTimeOfDay: function () {
		// stub
	},

	/* private properties */

	_updateCount: 0

});

})(); // end of closure for local variables