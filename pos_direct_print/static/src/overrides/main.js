/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
odoo.define('pos_direct_print.DirectPrintPrinterstatus', function (require) {
    'use strict';

    var chrome = require('point_of_sale.chrome');
    var PosBaseWidget = require('point_of_sale.BaseWidget');
    var core = require('web.core');
    var StatusWidget = PosBaseWidget.extend({
        status: ['connected', 'connecting', 'disconnected'],
        set_status: function (status, msg) {
            var self = this;
            for (var i = 0; i < this.status.length; i++) {
                this.$('.js_' + this.status[i]).addClass('oe_hidden');
            }
            this.$('.js_' + status).removeClass('oe_hidden');

            if (msg) {
                this.$('.js_msg').removeClass('oe_hidden').html(msg);
            } else {
                this.$('.js_msg').addClass('oe_hidden').html('');
            }
        },
    });

    var DirectPrintPrinterstatus = StatusWidget.extend({
        template: 'DirectPrintPrinterstatus',

        events: {
            'click': 'refresh_printer_info',
        },
        init: function (parent, options) {
            this._super(parent, options || {});
        },

        start: function () {
            var self = this;
            this._super();
            this.set_status('disconnected');
            this._bindPrinterEvents();
        },

        destroy: function () {
            this._super();
        },

        _getPrinter: function () {
            if (this.pos && this.pos.proxy && this.pos.proxy.direct_printer) {
                return this.pos.proxy.direct_printer;
            }
            return null;
        },

        _bindPrinterEvents: function () {
            var self = this;
            if (this.pos && this.pos.proxy && this.pos.proxy.direct_printer) {
                this.pos.proxy.direct_printer.bind('change:is_hostmachine_online', function (pos, is_hostmachine_online) {
                    self._syncStatus();
                });
                this.pos.proxy.direct_printer.bind('change:pending_print_jobs',function (pos, pending_print_jobs) {
                    self._syncStatus();
                });
            }
        },

        _syncStatus: function () {
            var printer = this._getPrinter();
            if (!printer) {
                this.set_status('disconnected');
                return;
            }

            var pendingJobs = printer.pending_print_jobs +
                (printer.receiptQueue ? printer.receiptQueue.length : 0);

            if (printer.is_hostmachine_online && pendingJobs > 0) {
                this.set_status('connecting', pendingJobs);
            } else if (printer.is_hostmachine_online) {
                this.set_status('connected');
            } else {
                this.set_status('disconnected');
            }
        },

        refresh_printer_info: async function () {
            var printer = this._getPrinter();
            if (printer) {
                await printer.refresh_printer_info();
                this._syncStatus();
            }
            return true;
        },
    });

    chrome.Chrome.prototype.widgets.push({
        name: 'direct_print_status',
        widget: DirectPrintPrinterstatus,
        append: '.pos-rightheader',
    });

    return DirectPrintPrinterstatus;
});