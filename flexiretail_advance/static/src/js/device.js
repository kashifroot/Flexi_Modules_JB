odoo.define('flexiretail_advance.devices', function (require) {
	"use strict";

	var devices = require('point_of_sale.devices');

	devices.BarcodeReader.include({

			pay_quick_draft_order: function(order_id){
			self = this;
			self.pos.gui.screen_instances.orderlist.pay_order_due(false, order_id);
//			self.pos.chrome.close_incoming_order_panel()
//			self.pos.gui.show_screen('payment');
		},
		get_order_by_barcode:function(code){
		        var self=this;
		        return this._rpc({
                            model: 'pos.order',
                            method: 'get_order_byBarcode',
                            args: [[],code],
                        }).then(function (result) {
                            var data = result[0];
                            return data;
		})

		},
        //kashif6jan:fixed double qty add after barcoe scan issue
    	scan: function(code){
    	    console.log(code)
    		var self = this;
    		var current_screen = self.pos.gui.get_current_screen();
    		if (current_screen == 'products') {
                var exist_order = _.findWhere(self.pos.get('pos_order_list'), {'pos_reference': code})
            if(exist_order){
                 this.pay_quick_draft_order(exist_order.id);
                return;
            }
            else{
                this._super(code)
            }

    		}
             else if (current_screen == 'login' && !self.pos.is_rfid_login) {
                return
    		}
    		else if(current_screen == 'login' && self.pos.is_rfid_login){
    			var user = _.find(this.pos.users, function(obj) { return obj.rfid_no == code });
    			if(user){
                	self.pos.chrome.screens.login.login_user(user.login, user.pos_security_pin);
                }else{
                	var img = "<img src='/flexiretail_advance/static/src/img/scan_rfid_red.png' style='height:285px;width:auto;'/>";
                	$("#image").html(img)
                	setTimeout(function(){
                		var img = "<img src='/flexiretail_advance/static/src/img/scan_rfid.png' style='height:285px;width:auto;'/>";
                        $("#image").html(img)
                	}, 1000);
                }
    		}
            else{
            this._super(code)
            }
//    		var result = self.get_order_by_barcode(code);



    	},
    });
});
