odoo.define('wk_odoo_direct_print.ReceiptScreen', function (require) {
    /* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
    /* See LICENSE file for full copyright and licensing details. */
    /* License URL : <https://store.webkul.com/license.html/> */
    "use strict";
    var screens = require('point_of_sale.screens');
    var gui = require('point_of_sale.gui');
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    

    screens.ReceiptScreenWidget.include({
        should_auto_print: function () {
            return this._super() || (this.pos.config.use_direct_print && this.pos.config.receipt_print_auto && this.pos.proxy.direct_printer);
        },
        renderElement: function () {
            this._super();
            this.$('.button.print').append(
                '<i class="fa fa-spinner fa-spin wk-print-spinner" style="margin-left:8px;display:none;"></i>'
            );
        },
        print: async function () {
            if (
                this.pos.config.use_direct_print &&
                this.pos.proxy.direct_printer
            ) {
                var $btn = this.$('.button.print');
                if ($btn.hasClass('wk-printing')) {
                    return;
                }
                var $spinner = $btn.find('.wk-print-spinner');
                $btn.addClass('wk-printing').css({'pointer-events': 'none', 'opacity': '0.6'});
                $spinner.show();
                try {
                    await this.print_xml();
                } finally {
                    $btn.removeClass('wk-printing').css({'pointer-events': '', 'opacity': ''});
                    $spinner.hide();
                }
                this.lock_screen(false);
                return true;
            } else {
                return this._super();
            }
        },
        print_xml: function () {
            if (
                this.pos.config.use_direct_print &&
                this.pos.proxy.direct_printer
            ) {
                var receipt = QWeb.render('XmlReceipt', this.get_receipt_render_env());
                var printPromise = this.pos.proxy.direct_printer.print_xml_receipt(receipt);
                this.pos.get_order()._printed = true;
                return printPromise;
            }
            return this._super();
        },
    });
}); 
