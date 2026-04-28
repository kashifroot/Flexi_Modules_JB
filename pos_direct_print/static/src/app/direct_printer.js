odoo.define('pos_direct_print.Printer', function (require) {
    "use strict";
    /* Copyright (c) 2016-Present Webkul Software Pvt. Ltd. (<https://webkul.com/>) */
    /* See LICENSE file for full copyright and licensing details. */
    /* License URL : <https://store.webkul.com/license.html/> */
    var core = require('web.core');
    var _t = core._t;
    var devices = require('point_of_sale.devices');
    var rpc = require('web.rpc');

    devices.ProxyDevice.include({
        print_receipt: function (receipt) {
            if (
                this.pos.config.use_direct_print &&
                this.pos.proxy.direct_printer
            ) {
                this.pos.proxy.direct_printer.print_xml_receipt(receipt);
                this.pos.get_order()._printed = true;
                return
            }
            return this._super(...arguments);
        },
    })

    var DirectPrinter = devices.ProxyDevice.extend({
        init: function (direct_printer_id, pos) {
            this._super(pos);
            this.is_direct_printer = true
            this.direct_printer_id = direct_printer_id
            this.pos = pos
            this.is_hostmachine_online = false
            this.pending_print_jobs = 0
            this.pos_cashdrawer = false;
            this.host_platform = '';
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
                    if (printer_info && printer_info['host_platform']) {
                        self.host_platform = printer_info['host_platform'];
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

            if (this.host_platform === 'Android') {
                let imageBase64 = await this.render_receipt_to_image();
                console.log("imageBase64------------>",imageBase64);
                await this.send_image_printing_job(imageBase64);
                return;
            }

            var receipt = await this.get_esc_command_set(xmlReceipt)
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

        render_receipt_to_image: async function () {
            var el = document.querySelector('.pos-sale-ticket');
            if (!el) {
                throw new Error('Receipt element (.pos-receipt-container) not found in DOM.');
            }
            var clone = el.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.fontSize = '2rem';
            clone.style.height = 'auto';
            clone.style.width = '500px';
            clone.style.padding = '20px';

            document.body.appendChild(clone);
            var canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 1,
                useCORS: true,
                logging: false,
            });
            document.body.removeChild(clone);

            const paperWidth = 520;
            const scaledCanvas = document.createElement('canvas');
            const scale = paperWidth / canvas.width;
            scaledCanvas.width = paperWidth;
            scaledCanvas.height = Math.floor(canvas.height * scale);
            const ctx = scaledCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
            ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            return scaledCanvas.toDataURL('image/png').split(',')[1];
        },

        async send_image_printing_job(imageBase64) {
            const printerId = this.direct_printer_id;
            if (!printerId) {
                console.warn("No printer configured.");
                return;
            }
            return rpc.query({
                model: 'print.jobs',
                method: 'create_print_job',
                args: [[], printerId, 'print-image', imageBase64],
            });
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

        compressBase64Image(base64, quality = 0.7, maxWidth = 1920, maxHeight = 1080) {
            return new Promise((resolve, reject) => {
                const base64Data = base64.split(',')[1] || base64;
                const mimeType = base64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });
                const url = URL.createObjectURL(blob);
                
                const img = new Image();
                
                img.onload = () => {
                    URL.revokeObjectURL(url);
                
                    const canvas = document.createElement('canvas');
                    let { width, height } = img;
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    }

                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    // For PNG or images with transparency, preserve the transparency
                    if (mimeType === 'image/png') {
                        // Don't fill background - keep transparency
                        ctx.clearRect(0, 0, width, height);
                    } else {
                        // For JPEG, fill with white background
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, width, height);
                    }
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Use the original format
                    const outputFormat = mimeType;
                    
                    let compressedBase64 = outputFormat === 'image/jpeg' 
                        ? canvas.toDataURL(outputFormat, quality)
                        : canvas.toDataURL(outputFormat);
                        
                    compressedBase64 = compressedBase64.split(',')[1];



                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                };
                
                img.onerror = (error) => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load image: ' + error));
                };
                img.src = url;
            });
        },

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
        },
    });

    return DirectPrinter;
});
