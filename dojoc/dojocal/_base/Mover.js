/*
 * Author: unscriptable
 * Date: Feb 7, 2009
 */
dojo.provide('dojoc.dojocal._base.Mover');

dojo.require('dojo.dnd.Mover');

(function () { // closure for local variables

/**
 * dojoc.dojocal.Mover
 */
dojo.declare('dojoc.dojocal._base.Mover', dojo.dnd.Mover, {

	// overrides

	onMouseMove: function(e){
		// don't call dojo.dnd.autoScroll since we're already constraining our drags to our widget
		var m = this.marginBox;
		this.host.onMove(this, {l: m.l + e.pageX, t: m.t + e.pageY});
	},

	onFirstMove: function () {
		// don't try to interpret the left and top as pixels since they're probably as %!
		var m = dojo.marginBox(this.node);
		this.marginBox.l = m.l - this.marginBox.l;
		this.marginBox.t = m.t - this.marginBox.t;
		this.host.onFirstMove(this);
		dojo.disconnect(this.events.pop());
	}

});

})(); // end of closure for local variables