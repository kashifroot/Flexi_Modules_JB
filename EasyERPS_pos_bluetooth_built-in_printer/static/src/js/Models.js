odoo.define('pos_bluetooth_printer.Models', function (require) {
"use strict";

var models = require('point_of_sale.models');

models.load_fields('product.product','pos_categ_id');

models.load_models([{
    model: 'pos.category',
    condition: function(self){ return self.config.receipt_types_views === "categoryReceipt"; },
    fields: ['name'],
    loaded: function(self,category){
        if(category.length){
            self.pos_categ_id = [];
            for(var i=0;i<category.length;i++){
                self.pos_categ_id.push(category[i].id)
            }
        }
    },
    }],{'after': 'product.product'});

    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        htmlToImgLetterRendering() {
        return false;
        }
    });

    var _super_orderLine = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        export_for_printing: function(){
            var result = _super_orderLine.export_for_printing.apply(this, arguments);
            result.pos_categ_id = this.get_product().pos_categ_id;
            return result;
        }
    });

    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        export_for_printing: function() {
            var result = _super_order.export_for_printing.apply(this,arguments);
            var date    = new Date();
            result.date.LocaleStringdateStyle = date.toLocaleString('en-US', {day: "2-digit"})+" "+ date.toLocaleString('en-US', { month: "short"})+" "+date.toLocaleString('en-US', { year: "numeric"});
            result.date.LocaleStringtimeStyle = date.toLocaleString('en-US', { timeStyle: "short" ,hour12: true });
            return result;
        },

        get_compute_product: function(){
            var orderlines = this.get_orderlines();
            var add = [];
            if ( orderlines.length > 0 ){
                if (this.pos.config.receipt_types_views === "labelReceipt"){
                    for(var n=0;n < orderlines.length;n++){
                        for(var nq=0;nq < orderlines[n].quantity;nq++){
                         add.push(orderlines[n])
                        }
                    }
                }
            }
            return {
                'products': add,

            };
        },

    });



// screens.ReceiptScreenWidget.include({
//     template: 'ReceiptScreenWidget',
//
//      get_is_openCashDrawer: function() {
//         var order = this.pos.get_order();
//         return order.is_paid_with_cash() || order.get_change();
//      },
//     print: async function() {
//         var self = this;
//         console.log("12")
//         if (this.pos.config.pos_bluetooth_printer) {
//                 const printer = new Printer(null, this.pos);
//                 var xhttp = new XMLHttpRequest();
//                 var receipt = QWeb.render('PosTicket', this.get_receipt_render_env());
//                 const ticketImage =  await printer.htmlToImg(receipt);
//                 const copie = this.pos.config.receipt_copies;
//                 xhttp.open("POST", "http://localhost:9100", true);
//                 var receiptObj = { image: ticketImage, text: "","openCashDrawer":!!this.get_is_openCashDrawer(), copies: copie };
//                 var receiptJSON = JSON.stringify(receiptObj);
//                 xhttp.send(receiptJSON);
//             if (this.pos.config.print_category_receipt) {
//                 for (var i = 1; i < $(".pos-sale-ticket").length; i++) {
//                     const receiptString = $(".pos-sale-ticket")[i].outerHTML;
//                     const ticketImage = await printer.htmlToImg(receiptString);
//                     const copie = this.pos.config.receipt_copies;
//                     xhttp.open("POST", "http://localhost:9100", true);
//                     var receiptObj = {
//                         image: ticketImage,
//                         text: "",
//                         copies: copie
//                     };
//                     var receiptJSON = JSON.stringify(receiptObj);
//                     xhttp.send(receiptJSON);
//                 }
//             }
//         } else if(!this.pos.proxy.printer) { // browser (html) printing
//
//             // The problem is that in chrome the print() is asynchronous and doesn't
//             // execute until all rpc are finished. So it conflicts with the rpc used
//             // to send the orders to the backend, and the user is able to go to the next
//             // screen before the printing dialog is opened. The problem is that what's
//             // printed is whatever is in the page when the dialog is opened and not when it's called,
//             // and so you end up printing the product list instead of the receipt...
//             //
//             // Fixing this would need a re-architecturing
//             // of the code to postpone sending of orders after printing.
//             //
//             // But since the print dialog also blocks the other asynchronous calls, the
//             // button enabling in the setTimeout() is blocked until the printing dialog is
//             // closed. But the timeout has to be big enough or else it doesn't work
//             // 1 seconds is the same as the default timeout for sending orders and so the dialog
//             // should have appeared before the timeout... so yeah that's not ultra reliable.
//
//             this.lock_screen(true);
//
//             setTimeout(function(){
//                 self.lock_screen(false);
//             }, 1000);
//
//             this.print_web();
//
//         } else {    // proxy (html) printing
//             this.print_html();
//             this.lock_screen(false);
//         }
//     },
//
//
//
// });


});

