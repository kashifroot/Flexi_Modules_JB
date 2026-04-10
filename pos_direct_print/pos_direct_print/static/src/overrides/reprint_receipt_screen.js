odoo.define('wk_odoo_direct_print.ReprintReceiptScreen', function(require) {
    /* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
    /* See LICENSE file for full copyright and licensing details. */
    /* License URL : <https://store.webkul.com/license.html/> */
    'use strict';

    const ReprintReceiptScreen = require('point_of_sale.ReprintReceiptScreen');
    const Registries = require('point_of_sale.Registries');
    
    const PosDirectReprintReceiptScreen = ReprintReceiptScreen =>
        class extends ReprintReceiptScreen {
            async printReceipt() {
                if(
                    this.env.pos.config.use_direct_print &&
                    this.env.pos.config.receipt_print_auto &&
                    this.env.pos.proxy.direct_printer
                ){
                    return await this.env.pos.handleDirectPrint(this.props.order);
                }
                return await super.printReceipt();
            }

            async tryReprint() {
                if(
                    this.env.pos.config.use_direct_print &&
                    this.env.pos.proxy.direct_printer
                ){
                    return await this.env.pos.handleDirectPrint(this.props.order);
                }
                await super.tryReprint()
            }
        };

    Registries.Component.extend(ReprintReceiptScreen, PosDirectReprintReceiptScreen);

    return ReprintReceiptScreen;
});
