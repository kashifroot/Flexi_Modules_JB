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
            this._pendingImagePromise = null;
            this._pendingEscPromise = null;
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
                let imageBase64 = null;
                if (this._pendingImagePromise) {
                    // Await the already-running pre-render (may already be complete)
                    imageBase64 = await this._pendingImagePromise;
                    this._pendingImagePromise = null;
                }
                // Fall back to fresh render if pre-render failed or wasn't started
                if (!imageBase64) {
                    try {
                        imageBase64 = await this.render_receipt_to_image();
                    } catch (e) {
                        console.error('[DirectPrint] render_receipt_to_image failed:', e);
                    }
                }
                if (imageBase64) {
                    console.log('[DirectPrint] Base64 image ready, sending to printer. Length:', imageBase64.length, '| Preview (first 80 chars):', imageBase64.substring(0, 80));
                    await this.send_image_printing_job(imageBase64);
                }
                return;
            }

            let receipt = null;
            if (this._pendingEscPromise) {
                // Await the already-running pre-compute (may already be complete)
                receipt = await this._pendingEscPromise;
                this._pendingEscPromise = null;
            }
            // Fall back to fresh computation if pre-compute failed or wasn't started
            if (!receipt) {
                receipt = await this.get_esc_command_set(xmlReceipt);
            }
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
            // Poll until the receipt element appears in the DOM (up to 3 seconds).
            // .pos-receipt-container is always present on the receipt screen.
            // .pos-sale-ticket is only present for the custom UNPAID sticker receipt.
            var el = null;
            for (var i = 0; i < 30; i++) {
                el = document.querySelector('.pos-receipt-container') ||
                     document.querySelector('.pos-sale-ticket');
                if (el) break;
                await new Promise(function (resolve) { setTimeout(resolve, 100); });
            }
            if (!el) {
                throw new Error('Receipt element not found in DOM after 3s.');
            }
            var clone = el.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            clone.style.fontSize = '2rem';
            clone.style.height = 'auto';
            clone.style.width = '580px';
            clone.style.padding = '20px';
            clone.style.boxSizing = 'border-box';

            // Force all descendant block/flex elements to fill the full available width
            var styleOverride = document.createElement('style');
            styleOverride.textContent = `
                .pos-receipt-container, .pos-sale-ticket,
                .pos-receipt-container *, .pos-sale-ticket * {
                    box-sizing: border-box !important;
                    max-width: 100% !important;
                }
                .pos-receipt-container table, .pos-sale-ticket table {
                    width: 100% !important;
                    table-layout: fixed !important;
                }
                .pos-receipt-container td, .pos-receipt-container th,
                .pos-sale-ticket td, .pos-sale-ticket th {
                    word-break: break-word !important;
                    white-space: normal !important;
                }
            `;
            clone.appendChild(styleOverride);

            // Convert SVG barcode elements to <img> so html2canvas can render them
            clone.querySelectorAll('svg').forEach(function (svg) {
                var svgData = new XMLSerializer().serializeToString(svg);
                var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                var url = URL.createObjectURL(svgBlob);
                var img = document.createElement('img');
                img.crossOrigin = 'anonymous';
                img.src = url;
                img.width = svg.getBoundingClientRect().width || svg.getAttribute('width') || 200;
                img.height = svg.getBoundingClientRect().height || svg.getAttribute('height') || 100;
                img.style.display = 'block';
                svg.parentNode.replaceChild(img, svg);
            });

            // Set crossOrigin on all existing images and force reload so the browser
            // fetches them with CORS headers (required for html2canvas to read pixel data)
            clone.querySelectorAll('img').forEach(function (img) {
                if (!img.src.startsWith('blob:')) {
                    img.crossOrigin = 'anonymous';
                    // Re-trigger load by resetting src
                    var src = img.src;
                    img.src = '';
                    img.src = src;
                }
            });

            // Append to DOM first so images actually begin loading
            document.body.appendChild(clone);

            // Wait for every <img> in the clone to finish loading
            await Promise.all(
                Array.from(clone.querySelectorAll('img')).map(function (img) {
                    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                    return new Promise(function (resolve) {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });
                })
            );

            var canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 1,
                useCORS: true,
                logging: false,
            });
            // Revoke blob URLs created for SVG→img conversion
            clone.querySelectorAll('img[src^="blob:"]').forEach(function (img) {
                URL.revokeObjectURL(img.src);
            });
            document.body.removeChild(clone);

            const paperWidth = 580;
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
