odoo.define('EasyERPS_pos_bluetooth_built-in_printer.chrome', function (require) {
"use strict";

var PosBaseWidget = require('point_of_sale.BaseWidget');
var chrome = require('point_of_sale.chrome');
var core = require('web.core');
var rpc = require('web.rpc');
var Printer = require('EasyERPS_pos_bluetooth_built-in_printer.Printer').Printer;

var QWeb = core.qweb;

chrome.Chrome.include({

    build_widgets: function(){
            this.widgets.push({
                'name':   'sale_details',
                'widget': chrome.SaleDetailsButton,
                'append':  '.pos-rightheader',
                'condition': function(){ return this.pos.config.pos_bluetooth_printer; },
            });
            this._super();
        },

});

chrome.SaleDetailsButton.include({

    start: function(){
        var self = this;
        this.$el.click(function(){
            self.print_sale_details();
        });
    },

    print_sale_details: function () {
        var self = this;
        rpc.query({
            model: 'report.point_of_sale.report_saledetails',
            method: 'get_sale_details',
        })
        .then(function(result){
                var env = {
                    widget: new PosBaseWidget(self),
                    company: self.pos.company,
                    pos: self.pos,
                    products: result.products,
                    payments: result.payments,
                    taxes: result.taxes,
                    total_paid: result.total_paid,
                    date: (new Date()).toLocaleString(),
                };
                var report = QWeb.render('easySaleDetailsReport', env);
                self.print_sale_details_receipt(report);
            });

    },

    print_sale_details_receipt: async function (report) {
        if (this.pos.config.pos_bluetooth_printer) {
                const printer = new Printer(null, this.pos);
                var xhttp = new XMLHttpRequest();
                const ticketImage =  await printer.htmlToImg(report);
                xhttp.open("POST", "http://localhost:9100", true);
                var receiptObj = { image: ticketImage, text: "", copies: 1 };
                var receiptJSON = JSON.stringify(receiptObj);
                xhttp.send(receiptJSON);
        }

    },
});
});