odoo.define('flexiretail_advance.models_prod', function (require) {
	"use strict";

	var models = require('point_of_sale.models');
	var core = require('web.core');
	var rpc = require('web.rpc');
	var _t = core._t;
	var utils = require('web.utils');
	var session = require('web.session');

	var round_pr = utils.round_precision;
	var QWeb = core.qweb;


	var posmodel_super = models.PosModel.prototype;
	models.PosModel = models.PosModel.extend({
		initialize: function(session, attributes) {
            var self = this;

            posmodel_super.initialize.call(this, session, attributes);

		},

	    load_server_data: function () {
	        var self = this;

	        return posmodel_super.load_server_data.apply(this, arguments).then(function () {



	        });
	    },
       get_lock_status: function(){
        	return this.get('pos_block_status')
        },
        		load_new_products: function(){
        		console.log("reloaded xxx")
            var self = this;
            var def  = new $.Deferred();
            var currency_symbol = self.currency ? self.currency : {symbol:'$', position: 'after', rounding: 0.01, decimals: 2};
            var fields = this.product_fields;
            var pos_domain = this.product_domain;
            var prod_domain = [['write_date','>',"2024-01-01 00:00:00"]];
            prod_domain = prod_domain.concat(pos_domain);
            var context = {
        		pricelist: false,
        		display_default_code: false,
        		location: self.config.stock_location_id[0],
        		compute_child: false,
            };
            var write_date = "2024-01-01 00:00:00";
            rpc.query({
                model: 'product.product',
                method: 'load_latest_product',
                args : [write_date,fields,context]
            }, {
                timeout: 3000,
                shadow: true,
                async: false,
            }).then(function(res){
            	self.db.currency_symbol = currency_symbol;
            	if(res && res.variants && self.gui.screen_instances.products){
            		var setup_prd = _.map(res.variants, function (product) {
                		product.categ = _.findWhere(self.product_categories, {'id': product.categ_id[0]});
	                    return new models.Product({}, product);
	                });
                	var prod_obj = self.gui.screen_instances.products.product_list_widget;
                	var current_pricelist = prod_obj._get_active_pricelist();
	                _.map(setup_prd,function(product){
	                	if(current_pricelist){
	                		prod_obj.product_cache.clear_node(product.id+','+current_pricelist.id);
	            			prod_obj.render_product(product);
	                	}
	                	prod_obj.renderElement();
            		});
	                self.db.add_products(setup_prd)
            	}
            	if(res && res.product_tmpl){
            		self.db.add_templates(_.map(res.product_tmpl, function(product) {
                        product.categ = _.findWhere(self.product_categories, {
                            'id': product.categ_id[0]
                        });
                        return new models.Product({}, product);
                    }));
            	}
            	if(self.gui.screen_instances.products){
            	self.gui.screen_instances.products.product_categories_widget.renderElement();
            	}
            });
            return def;
        },
		start_timer: function(){
        	var self = this;
        	setInterval(function() {
                if(self.get_lock_status()){
                	if(self.get_lock_data() && self.get_lock_data().session_id[0] == self.pos_session.id){
                		$('#block_session_freeze_screen').addClass("active_state_freeze_screen");
                        $('.lock_screen_button').fadeIn(2000);
                        $('span.lock_screen_button').show();
                        $('#msg_lock').show();
                        $('#msg_lock').text("Your session has been blocked by "+self.get_lock_data().locked_by_user_id[1]);
                	} else{
                		$('#block_session_freeze_screen').removeClass("active_state_freeze_screen");
                        $('span.lock_screen_button').hide();
                        $('#msg_lock').hide();
                        $('#msg_lock').text('');
                	}
                } else{
                	$('#block_session_freeze_screen').removeClass("active_state_freeze_screen");
                    $('span.lock_screen_button').hide();
                    $('#msg_lock').hide();
                    $('#msg_lock').text('');
                }
                //  kashif 6feb24: update /sync product every 10 seconds e.g price name etc
            self.load_new_products();
        	$('.prodcut_sync').toggleClass('rotate', 'rotate-reset');
            },19 * 1000);
        },




});
});