odoo.define('wk_odoo_direct_print.PrinterWidget', function (require) {
    "use strict";
    // Copyright(c) 2015 - Present Webkul Software Pvt.Ltd. (<https://webkul.com/>)
    // See LICENSE file for full copyright and licensing details.
    // "License URL : <https://store.webkul.com/license.html/>"

    var Widget = require('web.Widget');
    var widgetRegistry = require('web.widget_registry');
    var core = require('web.core');
    var _t = core._t;

    var PrinterButton = Widget.extend({
        template: 'wk_odoo_direct_print.PrinterButton',
        events: {
            'click .wk_printer_button': '_onClick',
        },
        init: function (parent, params) {
            this._super.apply(this, arguments);
            this.method = params.method || 'add_printers';
            this.title = params.title || _t('Direct Print');
        },
        _onClick: function () {
            var self = this;
            console.log('On click Add Printer................', { self });
            if (this.method === 'add_printers') {
                console.log('Add Printer................');
            }
        },
    });

    widgetRegistry.add('printer_button', PrinterButton);

    return PrinterButton;
});