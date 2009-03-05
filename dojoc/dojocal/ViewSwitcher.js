/*
	Copyright (c) 2004-2009, The Dojo Foundation
	All Rights Reserved.

	Licensed under the Academic Free License version 2.1 or above OR the
	modified BSD license. For more information on Dojo licensing, see:

		http://dojotoolkit.org/book/dojo-book-0-9/introduction/licensing
*/

/*
	Author: unscriptable
	Date: Jan 7, 2009
*/
dojo.provide('dojoc.dojocal.ViewSwitcher');

dojo.require('dijit.form.Button');
dojo.require('dojoc.dojocal._base.common');

(function () { // closure for local variables

var djc = dojoc.dojocal;

/**
 * dojoc.dojocal.ViewSwitcher
 */
dojo.declare('dojoc.dojocal.ViewSwitcher', [dijit._Widget, dijit._Templated], {

	templateString: '<div class="dojocalViewSwitcher"></div>',

	// viewModes: Array|String
	// the viewModes to include. Can be an array of integer or strings or a comma-delimited string
	viewModes: null,

	getValue: function () {
	  // TODO:
	},

	postCreate: function () {
		this.inherited(arguments);
		if (dojo.isString(this.viewModes)) {
			this.viewModes = this.viewMode.split(',');
		}
		dojo.forEach(this.viewModes, function (viewMode) {
			this._createButtonForViewName(viewMode);
		}, this);
	},

	_createButtonForViewName: function (viewMode) {
		viewMode = djc.fixViewMode(viewMode);
		var text = djc.getViewModeName(viewMode),
			widget = new dijit.form.Button({label: text});
		this.domNode.appendChild(widget.domNode);
	}

});

})(); // end of closure for local variables