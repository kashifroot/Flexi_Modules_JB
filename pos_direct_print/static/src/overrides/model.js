/* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
/* See LICENSE file for full copyright and licensing details. */
/* License URL : <https://store.webkul.com/license.html/> */
odoo.define('pos_direct_print.pos_direct_print', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    var DirectPrinter = require('pos_direct_print.Printer');
    var posmodel_super = models.PosModel.prototype;
    var core = require('web.core');
    var _t = core._t;
    var QWeb = core.qweb;
    var rpc = require('web.rpc');

    models.PosModel = models.PosModel.extend({
         after_load_server_data: async function () {
            var self = this;
            var res =await posmodel_super.after_load_server_data.apply(self, arguments)

            if (self.config.use_direct_print && self.config.direct_printer_id) {
                self.proxy.direct_printer = new DirectPrinter( self.config.direct_printer_id[0],self);
                console.log("self.proxy.direct_printer-------------->", self.proxy.direct_printer)
                self.proxy.direct_printer.refresh_printer_info();
            }
            return res

        },

        // truncateAtXIfTooLong(orderline, mx_length) {
        //     const required_string = `${orderline.quantity} ${orderline.unit_name} x ${orderline.price_lst} / ${orderline.unit_name}`;
        //     let result;
        //     if (required_string.length > mx_length) {
        //         const splitIndex = required_string.indexOf("x") + 1; // include the "x"
        //         const part1 = required_string.slice(0, splitIndex).trim();  // includes "x"
        //         const part2 = required_string.slice(splitIndex).trim();
        //         result = [part1, part2];
        //     } else {
        //         result = [required_string];
        //     }
        //     return result;
        // },

        // generate_wrapped_product_name(product_name, mx_length = 24) {
        //     var MAX_LENGTH = mx_length; // 40 * line ratio of .6
        //     var wrapped = [];
        //     var name = product_name;
        //     var current_line = "";
        //     while (name.length > 0) {
        //         var space_index = name.indexOf(" ");
        //         if (space_index === -1) {
        //             space_index = name.length;
        //         }
        //         if (current_line.length + space_index > MAX_LENGTH) {
        //             if (current_line.length) {
        //                 wrapped.push(current_line);
        //             }
        //             current_line = "";
        //         }
        //         current_line += name.slice(0, space_index + 1);
        //         name = name.slice(space_index + 1);
        //     }

        //     if (current_line.length) {
        //         wrapped.push(current_line);
        //     }
        //     return wrapped;
        // },

        // htmlToImg(receipt) {
        //     $('.pos-receipt-print').html(receipt);
        //     this.receipt = $('.pos-receipt-print>.pos-receipt');
        //     this.receipt.parent().css({ left: 0, right: 'auto' });
        //     return html2canvas(this.receipt[0], {
        //         height: Math.ceil(this.receipt.outerHeight() + this.receipt.offset().top),
        //         width: Math.ceil(this.receipt.outerWidth() + 2 * this.receipt.offset().left),
        //         scale: 1,
        //     }).then(canvas => {
        //         $('.pos-receipt-print').empty();
        //         return this.process_canvas(canvas);
        //     });
        // },

        // process_canvas(canvas) {
        //     return canvas.toDataURL('image/jpeg').replace('data:image/jpeg;base64,', '');
        // },

        // async getBase64(template, order) {
        //     let imgReceipt = null;
        //     let image = null;
        //     let data = order.export_for_printing();
        //     if (template === 'pos_direct_print.posOrCode' && data.pos_qr_code) {
        //         imgReceipt = QWeb.render(template, {
        //             props: {
        //                 data: data,
        //                 formatCurrency: this.chrome.format_currency,
        //             }
        //         });
        //     }
        //     else {
        //         console.log("Unsupported template:", template)
        //     }
        //     /**
        //      * Add future template to convert into base64
        //      */
        //     if (imgReceipt) {
        //         image = await this.htmlToImg(imgReceipt);
        //     }
        //     return image;
        // },

        // async getEscpos(template, order) {
        //     let xmlReceipt = '';
        //     const data = order.export_for_printing();

        //     // Process order lines
        //     (data.orderlines || []).forEach(line => {
        //         line.name_wrapped = this.generate_wrapped_product_name(line.product_name, 24);
        //         line.price_lst = (this.chrome.format_currency(line.price_lst) || '').replace(/\u00A0/g, ' ');
        //         line.price_display = (this.chrome.format_currency(line.price_display) || '').replace(/\u00A0/g, ' ');
        //         line.line_unit_price_wrapped = this.truncateAtXIfTooLong(line, 30);
        //     });

        //     // Format payment lines
        //     (data.paymentlines || []).forEach(line => {
        //         line.formatedAmount = this.chrome.format_currency(line.amount, false)?.replace(/\u00A0/g, ' ');
        //     });

        //     // Format tax details
        //     (data.tax_details || []).forEach(line => {
        //         line.formatedAmount = (line.amount || 0).toFixed(2);
        //     });

        //     // Format totals
        //     data.formatedChange = this.chrome.format_currency(data.change)?.replace(/\u00A0/g, ' ');
        //     data.formatedTotalDiscount = this.chrome.format_currency(data.total_discount)?.replace(/\u00A0/g, ' ');
        //     data.formatedSubTotal = this.chrome.format_currency(data.subtotal)?.replace(/\u00A0/g, ' ');
        //     data.formatedTotalTaxs = (data.total_paid || 0) - (data.total_without_tax || 0)
        //     // this.round_decimals_currency(
        //     // (data.total_paid || 0) - (data.total_without_tax || 0)
        //     // );

        //     if (template === 'pos_direct_print.OrderReceipt') {
        //         xmlReceipt = QWeb.render(template, {
        //             props: {
        //                 data: data,
        //                 formatCurrency: this.chrome.format_currency,
        //             }
        //         });
        //     }

        //     else if (template === 'pos_direct_print.OrderReceiptFooter') {
        //         xmlReceipt = QWeb.render(template, {
        //             props: {
        //                 data: data,
        //                 formatCurrency: this.chrome.format_currency,
        //             }
        //         });
        //     }
        //     else {
        //         console.log("Unsupported template:", template)
        //     }

        //     // Clean up and normalize receipt content
        //     xmlReceipt = xmlReceipt
        //         .replaceAll('<br>', '<br></br>')    // Ensure self-closing
        //         .replaceAll('\n', '\x0A')          // Normalize newlines for ESC/POS
        //         .replaceAll('\x00', '[NULL]');     // Replace null bytes

        //     // Get final ESC/POS command set from the backend
        //     // const escposReceipt = await this.env.services.rpc({
        //     //     model: 'wk.printer',
        //     //     method: 'get_esc_command_set',
        //     //     args: [{ data: xmlReceipt }],
        //     // })
        //     // return escposReceipt;
        //     var wk_receipt_data = false
        //     await rpc.query({
        //         model: 'wk.printer',
        //         method: 'get_esc_command_set',
        //         args: [false, { data: String(xmlReceipt) }],
        //         kwargs: {},
        //     }).then(function (escposReceipt) {
        //         wk_receipt_data = escposReceipt;
        //     });

        //     return wk_receipt_data
        // },

        // extractPureBase64(dataUri) {
        //     if (dataUri.startsWith('data:')) {
        //         return dataUri.split(',')[1];
        //     }
        //     return dataUri;
        // },

        // async _print_xml_receipt(order) {

        //     const receiptParts = [
        //         {
        //             type: 'image',
        //             content: order.export_for_printing().company?.logo ? this.extractPureBase64(order.export_for_printing().company?.logo) : false,
        //         },
        //         {
        //             type: 'escpos',
        //             content: await this.getEscpos("pos_direct_print.OrderReceipt", order),
        //         },
        //         {
        //             type: 'image',
        //             content: await this.getBase64("pos_direct_print.posOrCode", order),
        //         },

        //         {
        //             type: 'escpos',
        //             content: await this.getEscpos("pos_direct_print.OrderReceiptFooter", order),
        //         },

        //         // Future items can be added here
        //         // e.g., { type: 'image/escpos', content: 'image/escpos' }
        //     ];
        //     await this.proxy.direct_printer.escpos_print_receipt(receiptParts, 'print-complex');
        //     return receiptParts;
        // },

        // async handleDirectPrint(order) {
        //     if (
        //         !order._printed
        //     ) {
        //         if (this.config.order_receipt_format === 'xml') {
        //             await this._print_xml_receipt(order);
        //         }
        //         else {
        //             await this._print_default_receipt(order);
        //         }
        //     }
        // },

        // async _print_default_receipt(order) {
        //     var self = this;
        //     let receipt = $('.pos-receipt');
        //     if (receipt.length) {
        //         const receiptEl = receipt[0];
        //         const receiptClone = receiptEl.cloneNode(true);
        //         const printResult = await this.proxy.direct_printer.print_receipt(receiptClone);
        //         if (!printResult) {
        //             return true;
        //         } else {
        //             this.gui.show_popup('error', {
        //                 'title': _t('Printing Error'),
        //                 'body': _t('An unknown error occurred while printing.'),
        //             });
        //             this.gui.show_popup('confirm', {
        //                 'title': _t('Retry with Web Printer?'),
        //                 'body': _t('Do you want to print using the web printer?'),
        //                 confirm: async function () {
        //                     return await self._printWeb();

        //                 },
        //             });
        //             return false;
        //         }

        //     } else {
        //         return await this._printWeb();
        //     }
        // },

        // async _printWeb() {
        //     try {
        //         window.print();
        //         return true;
        //     } catch (_err) {
        //         this.gui.show_popup('error', {
        //             'title': _t('Printing is not supported on some browsers'),
        //             'body': _t(
        //                 'Printing is not supported on some browsers due to no default printing protocol ' +
        //                 'is available. It is possible to print your tickets by making use of an IoT Box.'
        //             ),
        //         });
        //         return false;
        //     }
        // }
    });
});