odoo.define('pos_direct_print.Printer', function (require) {
    "use strict";
    /* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
    /* See LICENSE file for full copyright and licensing details. */
    /* License URL : <https://store.webkul.com/license.html/> */
    var core = require('web.core');
    var _t = core._t;
    var devices = require('point_of_sale.devices');
    var rpc = require('web.rpc');

    var DirectPrinter = devices.ProxyDevice.extend({
        init: function (direct_printer_id, pos) {
            this._super(pos);
            this.is_direct_printer = true
            this.direct_printer_id = direct_printer_id
            this.pos = pos
            this.is_hostmachine_online = false
            this.pending_print_jobs = 0
            this.pos_cashdrawer = false;
            this.set({
                'is_hostmachine_online': false,
                'pending_print_jobs': 0,
            });
        },

        refresh_printer_info: async function () {
            var self = this;
            try {
                await rpc.query({
                    model: 'pos.config',
                    method: 'get_direct_printer_info',
                    args: [self.pos.config.id],
                    kwargs: {},
                }).then(function (printer_info) {
                    if (printer_info && printer_info['is_hostmachine_online']) {
                        self.is_hostmachine_online = printer_info['is_hostmachine_online']
                        self.set('is_hostmachine_online', printer_info['is_hostmachine_online']);   // triggers change:is_hostmachine_online

                    }
                    if (printer_info && printer_info['pos_cashdrawer']) {
                        self.pos_cashdrawer = printer_info['pos_cashdrawer']
                    }
                    if (printer_info && printer_info['pending_print_jobs']) {
                        self.pending_print_jobs = printer_info['pending_print_jobs']
                        self.set('pending_print_jobs', printer_info['pending_print_jobs']);     // triggers change:pending_print_jobs
                    }
                    return true;
                });
            } catch (e) {
                console.error("printer info could not refresh correctly", e);
                return false
            }
        },
        async print_xml_receipt(xmlReceipt) {
            var self = this;
            var receipt =await this.get_esc_command_set(xmlReceipt)
            if (receipt) {
                this.receipt_queue.push(receipt);
            }
            function sendPrintingXmlReceiptjob() {
                if (self.receipt_queue.length > 0) {
                    var r = self.receipt_queue.shift();
                    self.send_printing_job(r)
                        .then(function () {
                            sendPrintingXmlReceiptjob();
                        }, function (error) {
                            if (error) {
                                self.pos.gui.show_popup('error-traceback', {
                                    'title': _t('Printing Error: ') + error.data.message,
                                    'body': error.data.debug,
                                });
                                return;
                            }
                            self.receipt_queue.unshift(r);
                        });
                }
            }
            sendPrintingXmlReceiptjob();
            
        },
        async get_esc_command_set(xmlReceipt) {
            xmlReceipt = xmlReceipt
                .replaceAll('<br>', '<br></br>')    // Ensure self-closing
                .replaceAll('\n', '\x0A')          // Normalize newlines for ESC/POS
                .replaceAll('\x00', '[NULL]');     // Replace null bytes
            var wk_receipt_data = false
            await rpc.query({
                model: 'wk.printer',
                method: 'get_esc_command_set',
                args: [false, { data: String(xmlReceipt) }],
                kwargs: {},
            }).then(function (escposReceipt) {
                wk_receipt_data = escposReceipt;
            });

            return wk_receipt_data
        },
        // escpos_print_receipt: async function (receiptParts, method) {
        //     if (receiptParts) {
        //         this.receipt_queue.push(receiptParts);
        //     }
        //     let sendPrintResult;
        //     while (this.receipt_queue.length > 0) {
        //         receiptParts = this.receipt_queue.shift();
        //         try {
        //             sendPrintResult = await this.send_printing_job(receiptParts, method);
        //         } catch (_error) {
        //             // Error in communicating to the IoT box.
        //             this.receipt_queue.length = 0;
        //             return this.printResultGenerator.IoTActionError();
        //         }
        //         // rpc call is okay but printing failed because
        //         // IoT box can't find a printer.
        //         if (!sendPrintResult || sendPrintResult.result === false) {
        //             this.receipt_queue.length = 0;
        //             return this.printResultGenerator.IoTResultError(sendPrintResult.printerErrorCode);
        //         }
        //     }
        //     return true;
        // },

        send_printing_job: function (receiptParts, method = 'print-raw', kitchen_receipt = false, is_byte_stream = false) {
            const printerId = this.direct_printer_id;
            if (this && this.pos_cashdrawer && !kitchen_receipt) {
                return rpc.query({
                    model: 'print.jobs',
                    method: 'create_print_and_cashdrawer_job',
                    args: [[], printerId, method, receiptParts, undefined, is_byte_stream],
                    kwargs: {},
                })
            }
            return rpc.query({
                model: 'print.jobs',
                method: 'create_print_job',
                args: [[], printerId, method, receiptParts, undefined, is_byte_stream],
                kwargs: {},
            })
        }
    });

    return DirectPrinter;
});
