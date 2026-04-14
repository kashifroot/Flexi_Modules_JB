/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
odoo.define('pos_direct_print.pos_direct_print', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var DirectPrinter = require('pos_direct_print.Printer');
    var posmodel_super = models.PosModel.prototype;

    models.PosModel = models.PosModel.extend({
         after_load_server_data: async function () {
            var self = this;
            var res =await posmodel_super.after_load_server_data.apply(self, arguments)

            if (self.config.use_direct_print && self.config.direct_printer_id) {
                self.proxy.direct_printer = new DirectPrinter( self.config.direct_printer_id[0],self);
                self.proxy.direct_printer.refresh_printer_info();
            }
            return res

        },
    });
});