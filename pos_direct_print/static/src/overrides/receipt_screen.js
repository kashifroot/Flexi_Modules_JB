odoo.define('wk_odoo_direct_print.ReceiptScreen', function (require) {
    /* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
    /* See LICENSE file for full copyright and licensing details. */
    /* License URL : <https://store.webkul.com/license.html/> */
    "use strict";
    var screens = require('point_of_sale.screens');
    var core = require('web.core');
    var QWeb = core.qweb;

    screens.ReceiptScreenWidget.include({
        should_auto_print: function () {
            if (this.pos.config.use_direct_print && this.pos.proxy.direct_printer) {
                return false;
            }
            return this._super();
        },

        show: function () {
            this._super.apply(this, arguments);
            if (this.pos.config.use_direct_print && this.pos.proxy.direct_printer) {
                // Wait one animation frame so the receipt DOM is fully painted,
                // then start pre-rendering in the background.
                requestAnimationFrame(() => this._preRenderForPrint());
            }
        },

        _preRenderForPrint: function () {
            var printer = this.pos.proxy.direct_printer;
            if (!printer) return;

            if (printer.host_platform === 'Android') {
                // Kick off html2canvas immediately and store the Promise.
                // print_xml_receipt() will await this instead of starting a new render.
                printer._pendingImagePromise = printer.render_receipt_to_image()
                    .catch(function (err) {
                        console.error('[DirectPrint] Pre-render image failed, will retry on print:', err);
                        return null;
                    });
            } else {
                // Pre-compute ESC/POS commands via backend RPC and cache the Promise.
                var xmlReceipt = QWeb.render('XmlReceipt', this.get_receipt_render_env());
                printer._pendingEscPromise = printer.get_esc_command_set(xmlReceipt)
                    .catch(function (err) {
                        console.error('[DirectPrint] Pre-compute ESC failed, will retry on print:', err);
                        return null;
                    });
            }
        },

        print: function () {
            if (
                this.pos.config.use_direct_print &&
                this.pos.proxy.direct_printer
            ) {
                console.log('[DirectPrint] Print button clicked on receipt screen at', new Date().toISOString());
                this.print_xml();
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
                this.pos.proxy.direct_printer.print_xml_receipt(receipt);
                this.pos.get_order()._printed = true;
                return;
            }
            return this._super();
        },
    });
});