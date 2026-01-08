odoo.define('EasyERPS_pos_bluetooth_built-in_printer.screens', function (require) {
"use strict";

var gui = require('point_of_sale.gui');
var screens = require('point_of_sale.screens');
var core = require('web.core');
var Printer = require('EasyERPS_pos_bluetooth_built-in_printer.Printer').Printer;

var QWeb = core.qweb;
var _t = core._t;

screens.ReceiptScreenWidget.include({

    get_receipt_render_env: function() {
        this.pos.last_receipt_render_env = this._super();
        return this.pos.last_receipt_render_env;
    },

     get_is_openCashDrawer: function() {
        var order = this.pos.get_order();
        return order.is_paid_with_cash() || order.get_change();
     },

    handle_auto_print: function() {
        if (this.should_auto_print()) {
            if (this.pos.config.bluetooth_print_auto) {
                this.printReceiptAndLabel();
                if (this.should_close_immediately()){
                    this.click_next();
                }
            }else {
                this.print();
                if (this.should_close_immediately()) {
                    this.click_next();
                }
            }
        } else {
            this.lock_screen(false);
        }
    },


    printReceiptAndLabel: async function() {
        var self = this;

        if (this.pos.config.iface_print_auto) {
                const printer = new Printer(null, this.pos);
                var xhttp = new XMLHttpRequest();
                var receipt = QWeb.render('PosTicket_custom', this.get_receipt_render_env());
                const ticketImage =  await printer.htmlToImg(receipt);
                const copie = this.pos.config.receipt_copies;
                xhttp.open("POST", "http://localhost:9100", true);
                var receiptObj = { image: ticketImage, text: "","openCashDrawer":!!this.get_is_openCashDrawer(), copies: copie };
                var receiptJSON = JSON.stringify(receiptObj);
                xhttp.send(receiptJSON);
                for(var i=0;i < $(".pos-receipt").length;i++){
                    const receiptString = $(".pos-receipt")[i].outerHTML;
                    const ticketImage = await printer.htmlToImgreceipt(receiptString);
                    if (!this.pos.config.is_different_printer){
                        xhttp.open("POST", "http://localhost:9100", true);
                    }else {
                        xhttp.open("POST", "http://localhost:9200", true);
                    }
                     var receiptObj = { image: ticketImage, text: "", copies: 1 };
                    var receiptJSON = JSON.stringify(receiptObj);
                    xhttp.send(receiptJSON);

                 }
        } else if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing

            this.lock_screen(true);

            setTimeout(function(){
                self.lock_screen(false);
            }, 1000);

            this.print_web();
        } else {    // proxy (xml) printing
            this.print_xml();
            this.lock_screen(false);
        }
    },

    print: async function() {
        var self = this;
        if (this.pos.config.iface_print_auto) {
                const printer = new Printer(null, this.pos);
                var xhttp = new XMLHttpRequest();
//                var receipt = QWeb.render('PosTicket', this.get_receipt_render_env());
//                 var receipt = this.$('.pos-sale-ticket').html();
//                const ticketImage =  await printer.htmlToImg(receipt);
//                const copie = this.pos.config.receipt_copies;
               var receipt = QWeb.render('PosTicket_custom', this.get_receipt_render_env());
                const ticketImage =  await printer.htmlToImg(receipt);
                const copie = this.pos.config.receipt_copies;
                xhttp.open("POST", "http://localhost:9100", true);
                var receiptObj = { image: ticketImage, text: "","openCashDrawer":!!this.get_is_openCashDrawer(), copies: copie };
                var receiptJSON = JSON.stringify(receiptObj);
                xhttp.send(receiptJSON);

//                xhttp.open("POST", "http://localhost:9100", true);
//                //                just opening drawer
//
//                var receiptObj = {"openCashDrawer":true };

//                printing_receipt
//                this.lock_screen(true);
//                setTimeout(function(){
//                    self.lock_screen(false);
//                }, 1000);
//
//                this.print_web();

//                var receiptObj = { image: ticketImage, text: "","openCashDrawer":!!this.get_is_openCashDrawer(), copies: copie };
//                var receiptJSON = JSON.stringify(receiptObj);
//                xhttp.send(receiptJSON);
        } else if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing
//                var xhttp = new XMLHttpRequest();
//                xhttp.open("POST", "http://localhost:9100", true);
//                var receiptObj = {"openCashDrawer":!!this.get_is_openCashDrawer()};
//                var receiptJSON = JSON.stringify(receiptObj);
//                xhttp.send(receiptJSON);

            this.lock_screen(true);
            setTimeout(function(){
                self.lock_screen(false);
            }, 1000);
            this.print_web();
        } else {    // proxy (xml) printing
            this.print_xml();
            this.lock_screen(false);
        }
    },

    printLabel: async function() {
        var self = this;
        if (this.pos.config.pos_bluetooth_printer) {
            const printer = new Printer(null, this.pos);
            var xhttp = new XMLHttpRequest();
            for(var i=0;i < $(".pos-receipt").length;i++){
                    const receiptString = $(".pos-receipt")[i].outerHTML;
                    const ticketImage = await printer.htmlToImgreceipt(receiptString);
                    if (!this.pos.config.is_different_printer){
                        xhttp.open("POST", "http://localhost:9100", true);
                    }else {
                        xhttp.open("POST", "http://localhost:9200", true);
                    }
                     var receiptObj = { image: ticketImage, text: "", copies: 1 };
                    var receiptJSON = JSON.stringify(receiptObj);
                    xhttp.send(receiptJSON);

                 }
        }
    },

    renderElement: function() {
        var self = this;
        this._super();

        this.$('.button.printReceiptAndLabel').click(function(){
            if (!self._locked) {
                self.printReceiptAndLabel();
            }
        });

        this.$('.printLabel').click(function(){
            if (!self._locked) {
                self.printLabel();
            }
        });

    },




});
var ReReceiptScreenWidget = screens.ScreenWidget.extend({
    template: 'ReReceiptScreenWidget',
     show: function(){
        this._super();
        var self = this;

        this.render_change();
        this.render_receipt();
    },
    render_change: function() {},
    click_next: function() {},
    click_back: function() {
        this.gui.show_screen('products');
        // old order may be reprinted but
        // the current is still open
        this.pos.get_order()._printed = false;
    },
    get_receipt_render_env: function() {
        return this.pos.last_receipt_render_env;
    },

    reprintReceiptAndLabel: async function() {
        var self = this;

        if (this.pos.config.iface_print_auto) {
                const printer = new Printer(null, this.pos);
                var xhttp = new XMLHttpRequest();
                for(var i=0;i < $(".pos-rereceipt").length;i++){
                    const receiptString = $(".pos-rereceipt")[i].outerHTML;
                    const ticketImage = await printer.htmlToImgrereceipt(receiptString);
                    if (i===0){
                    xhttp.open("POST", "http://localhost:9100", true);
                    var receiptObj = { image: ticketImage, text: "", copies: 1 };
                    }else if (i!==0){
                    if (!this.pos.config.is_different_printer){
                        xhttp.open("POST", "http://localhost:9100", true);
                    }else {
                        xhttp.open("POST", "http://localhost:9200", true);
                    }
                     var receiptObj = { image: ticketImage, text: "", copies: 1 };
                    }
                    var receiptJSON = JSON.stringify(receiptObj);
                    xhttp.send(receiptJSON);

                 }
        } else if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing

            this.lock_screen(true);

            setTimeout(function(){
                self.lock_screen(false);
            }, 1000);

            this.print_web();
        } else {    // proxy (xml) printing
            this.print_xml();
            this.lock_screen(false);
        }
    },

    reprint: async function() {
        var self = this;
        if (this.pos.config.iface_print_auto) {
                const printer = new Printer(null, this.pos);
                var xhttp = new XMLHttpRequest();
                var receipt = QWeb.render('PosTicket_custom', this.get_receipt_render_env());
                const ticketImage =  await printer.htmlToImgrereceipt(receipt);
                xhttp.open("POST", "http://localhost:9100", true);
                var receiptObj = { image: ticketImage, text: "", copies: 1 };
                var receiptJSON = JSON.stringify(receiptObj);
                xhttp.send(receiptJSON);
        } else if (!this.pos.config.iface_print_via_proxy) { // browser (html) printing

            this.lock_screen(true);

            setTimeout(function(){
                self.lock_screen(false);
            }, 1000);

            this.print_web();
        } else {    // proxy (xml) printing
            this.print_xml();
            this.lock_screen(false);
        }
    },


    reprintLabel: async function() {
        var self = this;
        if (this.pos.config.pos_bluetooth_printer) {
            const printer = new Printer(null, this.pos);
            var xhttp = new XMLHttpRequest();
            for(var i=1;i < $(".pos-rereceipt").length;i++){
                    const receiptString = $(".pos-rereceipt")[i].outerHTML;
                    const ticketImage = await printer.htmlToImgrereceipt(receiptString);
                    if (!this.pos.config.is_different_printer){
                        xhttp.open("POST", "http://localhost:9100", true);
                    }else {
                        xhttp.open("POST", "http://localhost:9200", true);
                    }
                     var receiptObj = { image: ticketImage, text: "", copies: 1 };
                    var receiptJSON = JSON.stringify(receiptObj);
                    xhttp.send(receiptJSON);

                 }
        }
    },

    renderElement: function() {
        var self = this;
        this._super();

        this.$('.back').click(function(){
            if (!self._locked) {
                self.click_back();
            }
        });
        this.$('.button.reprint').click(function(){
            if (!self._locked) {
                self.reprint();
            }
        });

        this.$('.button.reprintReceiptAndLabel').click(function(){
            if (!self._locked) {
                self.reprintReceiptAndLabel();
            }
        });

        this.$('.reprintLabel').click(function(){
            if (!self._locked) {
                self.reprintLabel();
            }
        });

    },

    render_receipt: function() {
        this.$('.pos-receipt-container').html(QWeb.render('PosTicket_custom', this.get_receipt_render_env()));
    },

});
gui.define_screen({name:'rereceipt', widget: ReReceiptScreenWidget});

var ReReprintButton = screens.ActionButtonWidget.extend({
    template: 'ReReprintButton',
    button_click: function() {
//        if (this.pos.last_receipt_render_env) {
//            this.gui.show_screen('rereceipt');
 		self.gui.show_screen('orderlist');
//        		self.close_sidebar();
//        } else {
//            this.gui.show_popup('error', {
//                'title': _t('Nothing to Print'),
//                'body':  _t('There is no previous receipt to print.'),
//            });
//        }
    },
});

screens.define_action_button({
    'name': 'rereprint',
    'widget': ReReprintButton,
    'condition': function(){
        return this.pos.config.module_pos_rereprint;
    },
});



screens.PaymentScreenWidget.include({

    renderElement: function() {
        var self = this;
        this._super();
        this.$('.button.jjs_cashdrawer').click(function(){
                var xhttp = new XMLHttpRequest();
                xhttp.open("POST", "http://localhost:9100", true);
                var receiptObj = {"openCashDrawer":true };
                var receiptJSON = JSON.stringify(receiptObj);
                xhttp.send(receiptJSON);
        });

    },


});

    return {
    ReReceiptScreenWidget: ReReceiptScreenWidget,
};
});