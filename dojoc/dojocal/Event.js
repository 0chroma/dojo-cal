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
	Base classes for Event Widgets.
*/
dojo.provide('dojoc.dojocal.Event');

dojo.require('dijit._Templated');
dojo.require('dijit._Widget');
dojo.require('dojoc.dojocal._base.EventMixin');
dojo.require('dojo.date.locale');

(function () { // closure for local variables

dojo.declare('dojoc.dojocal.Event', [dijit._Widget, dijit._Templated, dojoc.dojocal._base.EventMixin], {
	 //summary:
	 //   A very basic dojocal event widget that shows the start time and the summary of the event.

	templatePath: dojo.moduleUrl('dojoc.dojocal', 'resources/Event.html'),

	// baseClass: String
	//   the base class for this event widget (used for creating state-related classes e.g. dojocalEvent-selected)
	baseClass: 'dojocalEvent',

	// cssClasses: String
	//   additional css classes to add to the root dom node of the event widget
	//   this is useful for creating customized event widgets without subclassing or modifying the dojocal.css
	cssClasses: 'dojocalIntraDayEvent',

	// timeFormat: String
	//   the dojo.date.locale-formatted date string used to display the event start time
	timeFormat: 'h:mm a',

	// dateFormat: String
	//   the dojo.date.locale-formatted date string used to display the event start date (in the domNode.title)
	dateFormat: 'd MMM yyyy',

	/***** overrides *****/

	setSelected: function (selected) {
		this.inherited(arguments);
		this._setHighlighted(this.selected, 'selected');
		this._publishToPeers('peerHighlighted', [this.selected, 'selected']);
	},

	setEditing: function (editing) {
		// TODO? set focus and detect blur
		this.inherited(arguments);
		this._setCssState('editing', this.editing);
	},

	setColor: function (/* String */ color) {
		this.inherited(arguments);
		this._setColor(color);
	},

	setFontColor: function (/* String */ color) {
		this.inherited(arguments);
		this._setFontColor(color);
	},

	setData: function (/* dojoc.dojocal.UserEvent */ data) {
		this.inherited(arguments);
		this.summary = this.data.summary || '';
		this.text = this.data.text || '';
		if (this._started)
			this._updateTimeLabel();
	},

	setDateTime: function (/* Date */ dateTime) {
		this.inherited(arguments);
		if (this._started)
			this._updateTimeLabel();
	},

	postCreate: function () {
		this.inherited(arguments);
		this._setColor(this.color);
		this._setFontColor(this.fontColor);
	},

	postMixInProperties: function () {
		this.inherited(arguments);
		if (!this.data)
			this.data = {};
		this.setData(this.data);
	},

	startup: function () {
		this.inherited(arguments);
		this._updateTimeLabel();
		this.connect(this.domNode, 'mouseover', '_onHover');
		this.connect(this.domNode, 'mouseout', '_onHover');
		dojo.subscribe('dojoc.dojocal.' + this.getUid() + '.peerHighlighted', this, '_peerHighlighted');
	},

	/***** private properties and methods *****/

	_timeLabel: '',

	_onHover: function (e) {
		this.hovered = e.type == 'mouseover';
		this._setHighlighted(this.hovered, 'hovered');
		this._publishToPeers('peerHighlighted', [this.hovered, 'hovered']);
	},

	_peerHighlighted: function (/* Boolean */ highlighted, /* String */ highlightType) {
		// Note: this relies on highlightType == property name
		if (this[highlightType] != highlighted) {
			this[highlightType] = !!highlighted;
			this._setHighlighted(highlighted, highlightType);
		}
	},

	_publishToPeers: function (/* String */ type, args) {
		// this check ensures that we don't enter into an infinite loop since we subscribe to our own publish!
		if (!this._publishingType || this._publishingType != type) {
			this._publishingType = type;
			dojo.publish('dojoc.dojocal.' + this.getUid() + '.' + type, args);
			delete this._publishingType;
		}
	},

	_setHighlighted: function (/* Boolean */ highlighted, /* String */ highlightType) {
		this._setCssState(highlightType, highlighted);
		if (this.selected || this.hovered) {
			// adjust text color so it's more readable (now that the opacity was increased)
			var fgColor = new dojo.Color(this.fontColor),
				bgColor = new dojo.Color(this.color);
			// check if our colors are "dark on dark" or "light on light"
			// TODO? find a formula that satisfies more color combinations
			var isTooClose = Math.abs(fgColor.r - bgColor.r) < 96 || Math.abs(fgColor.g - bgColor.g) < 96 || Math.abs(fgColor.b - bgColor.b) < 96;
			if (isTooClose) {
				// lighten or darken our text
				// TODO: something looks b0rked here:
				var colorDir = (fgColor.r - bgColor.r > 0) + Math.abs(fgColor.g - bgColor.g > 0) + Math.abs(fgColor.b - bgColor.b > 0),
				newColor = new dojo.Color();
				dojo.blendColors(fgColor, new dojo.Color(colorDir > 0 ? 'white' : 'black'), 0.75, newColor);
				this._setFontColor(newColor.toCss());
			}
		}
		else {
			this._setFontColor(this.fontColor);
		}
	},

	_setColor: function (/* String */ color) {
		// until we're not supporting the older, non-CSS3 browsers, the opaque border and semi-opaque background cannot be set on the same node
		dojo.style(this.borderNode, 'borderColor', color);
		dojo.style(this.backgroundNode, 'backgroundColor', color);
//		dojo.style(this.handleNodeThumb, 'backgroundColor', color);
	},

	_setFontColor: function (/* String */ color) {
		dojo.style(this.domNode, 'color', color);
		// the handle color follows the font color so it is visible against the background (see setSelected)
		dojo.style(this.handleNodeThumb, 'borderColor', color);
	},

	_setCssState: function (/* String */ state, /* Boolean */ on) {
		dojo[on ? 'addClass' : 'removeClass'](this.domNode, this.baseClass + '-' + state);
	},

	_updateTimeLabel: function () {
		this._timeLabel = dojo.date.locale.format(this.data.startDateTime, {selector: 'time', timePattern: this.timeFormat});
		if (this.timeTextNode && this.timeTextNode.innerHTML != this._timeLabel)
			this.timeTextNode.innerHTML = this._timeLabel;
	}

});

})(); // end of closure for local variables
