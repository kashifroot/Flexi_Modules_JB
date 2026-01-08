odoo.define('flexiretail.gui', function (require) {
"use strict";

	var gui = require('point_of_sale.gui');
	var core = require('web.core');
	var BarcodeEvents = require('barcodes.BarcodeEvents').BarcodeEvents;
	var devices = require('point_of_sale.devices');

	var _t = core._t;


	gui.Gui.include({
        authentication_pin: function(password) {
            var self = this;
            var ret = new $.Deferred();
            var flag = false;
            self.show_popup('password',{
                'title': _t('Password ?'),
                confirm: function(pw) {
                    _.each(password, function(pass) {
                        if (pw === pass) {
                            flag = true;
                        }
                    });
                    if(flag){
                        ret.resolve();
                    } else {
                        self.show_popup('error',_t('Incorrect Password'));
                        ret.reject()
                    }
                },
            });
            return ret;
        },
        show_popup: function(name,options) {
            if (this.current_popup) {
                this.close_popup();
            }
            this.current_popup = this.popup_instances[name];
//            if (!this._originalHandlersBackedUp) {
//                this._originalKeypressHandler = this.keyboard_handler;
//                this._originalKeydownHandler = this.keyboard_keydown_handler;
//                this._originalHandlersBackedUp = true;
//            }
//
//            // Redefine handlers to do nothing
//            window.posmodel.chrome.screens.payment.keyboard_handler = function() {};
//            window.posmodel.chrome.screens.payment.keyboard_keydown_handler = function() {};
//            $('body').off('keypress', this.keyboard_handler);
//            $('body').off('keydown', this.keyboard_keydown_handler);
            return this.current_popup.show(options);
        },

        // close the current popup.
        close_popup: function() {
            if  (this.current_popup) {
//                $('body').on('keypress', this.keyboard_handler);
//                $('body').on('keydown', this.keyboard_keydown_handler);
//                if (this._originalHandlersBackedUp) {
//                    this.keyboard_handler = this._originalKeypressHandler;
//                    this.keyboard_keydown_handler = this._originalKeydownHandler;
//                    this._originalHandlersBackedUp = false; // Clear the backup flag
//                }
                this.current_popup.close();
                this.current_popup.hide();
                this.current_popup = null;
            }
        },
//        show_popup: function(name, options) {
//            // Call the original show_popup method
//            this._super(name, options);
//            // Backup the original event handlers and barcode reader instance
////            if (!this._originalHandlersBackedUp) {
////                this._originalKeypressHandler = window.posmodel.chrome.screens.payment.keyboard_handler;
////                this._originalKeydownHandler = window.posmodel.chrome.screens.payment.keyboard_keydown_handler;
////                this._originalBarcodeReader = window.posmodel.barcode_reader;
////                this._originalHandlersBackedUp = true;
////            }
////
////            // Redefine handlers to do nothing
////            window.posmodel.chrome.screens.payment.keyboard_handler = function() {};
////            window.posmodel.chrome.screens.payment.keyboard_keydown_handler = function() {};
////            $('.modal-dialog').not('.oe_hidden').on('keypress', this.originalKeypressHandler);
//            // Make sure to return the result of the original method
//            return this.current_popup.show(options);
//        },
//        close_popup: function() {
//            // Call the original show_popup method
//            this._super(name);
//
////            if (this._originalHandlersBackedUp) {
////                window.posmodel.chrome.screens.payment.keyboard_handler = this._originalKeypressHandler;
////                window.posmodel.chrome.screens.payment.keyboard_keydown_handler = this._originalKeydownHandler;
////                window.posmodel.barcode_reader = this._originalBarcodeReader;
////                this._originalHandlersBackedUp = false; // Clear the backup flag
////            }
////            console.log('');
//        },
        originalKeypressHandler: function(){
            console.log('')
        }
    });
});